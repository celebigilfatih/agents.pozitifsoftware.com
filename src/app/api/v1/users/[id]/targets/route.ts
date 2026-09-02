import { asc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { user, userTargetPermission } from "@/db/schema";
import { getNavoriAdapter } from "@/integrations/navori";
import {
  ApiError,
  apiErrorResponse,
  assertSameOrigin,
  requireApiActor,
} from "@/lib/api";
import { writeAudit } from "@/lib/audit";

const bodySchema = z.object({
  targets: z
    .array(
      z.object({
        type: z.enum(["group", "player", "playlist"]),
        id: z.string().min(1).max(200),
      }),
    )
    .max(500),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const requestId = crypto.randomUUID();
  try {
    await requireApiActor(request, "manageUsers");
    const { id } = await context.params;
    const permissions = await db
      .select()
      .from(userTargetPermission)
      .where(eq(userTargetPermission.userId, id))
      .orderBy(asc(userTargetPermission.targetName));
    return Response.json({ permissions, requestId });
  } catch (error) {
    return apiErrorResponse(error, requestId);
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const requestId = crypto.randomUUID();
  try {
    assertSameOrigin(request);
    const actor = await requireApiActor(request, "manageUsers");
    const { id } = await context.params;
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ApiError(
        400,
        "INVALID_TARGETS",
        "Hedef yetkileri geçerli değil.",
      );
    }
    const [targetUser] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.id, id))
      .limit(1);
    if (!targetUser)
      throw new ApiError(404, "USER_NOT_FOUND", "Kullanıcı bulunamadı.");

    const adapter = getNavoriAdapter();
    const [groups, players, playlists] = await Promise.all([
      adapter.getGroups(),
      adapter.getPlayers(),
      adapter.getPlaylists(),
    ]);
    const catalog = new Map<string, string>([
      ...groups.map((item) => [`group:${item.id}`, item.name] as const),
      ...players.map((item) => [`player:${item.id}`, item.name] as const),
      ...playlists.map((item) => [`playlist:${item.id}`, item.name] as const),
    ]);
    const uniqueTargets = [
      ...new Map(
        parsed.data.targets.map((target) => [
          `${target.type}:${target.id}`,
          target,
        ]),
      ).values(),
    ];
    const rows = uniqueTargets.map((target) => {
      const targetName = catalog.get(`${target.type}:${target.id}`);
      if (!targetName) {
        throw new ApiError(
          400,
          "TARGET_NOT_FOUND",
          "Seçilen hedeflerden biri bulunamadı.",
        );
      }
      return {
        userId: id,
        targetType: target.type,
        targetId: target.id,
        targetName,
      };
    });

    await db.transaction(async (tx) => {
      await tx
        .delete(userTargetPermission)
        .where(eq(userTargetPermission.userId, id));
      if (rows.length > 0) await tx.insert(userTargetPermission).values(rows);
    });
    await writeAudit({
      actorId: actor.id,
      eventType: "user.targets_changed",
      payload: {
        userId: id,
        targets: rows.map(({ targetType, targetId }) => ({
          targetType,
          targetId,
        })),
      },
      requestId,
    });
    return Response.json({ count: rows.length, requestId });
  } catch (error) {
    return apiErrorResponse(error, requestId);
  }
}
