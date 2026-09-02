import { and, count, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { user } from "@/db/schema";
import {
  ApiError,
  apiErrorResponse,
  assertSameOrigin,
  requireApiActor,
} from "@/lib/api";
import { appRoles } from "@/lib/auth/permissions";
import { writeAudit } from "@/lib/audit";

const bodySchema = z.object({ role: z.enum(appRoles) });

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
    if (!parsed.success)
      throw new ApiError(400, "INVALID_ROLE", "Rol geçerli değil.");

    const [current] = await db
      .select()
      .from(user)
      .where(eq(user.id, id))
      .limit(1);
    if (!current)
      throw new ApiError(404, "USER_NOT_FOUND", "Kullanıcı bulunamadı.");
    if (current.role === "admin" && parsed.data.role !== "admin") {
      const [admins] = await db
        .select({ value: count() })
        .from(user)
        .where(and(eq(user.role, "admin"), eq(user.banned, false)));
      if ((admins?.value ?? 0) <= 1) {
        throw new ApiError(
          409,
          "LAST_ADMIN",
          "Son aktif yönetici rolü değiştirilemez.",
        );
      }
    }

    const [updated] = await db
      .update(user)
      .set({ role: parsed.data.role })
      .where(eq(user.id, id))
      .returning({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    await writeAudit({
      actorId: actor.id,
      eventType: "user.role_changed",
      payload: {
        userId: id,
        previousRole: current.role,
        role: parsed.data.role,
      },
      requestId,
    });
    return Response.json({ user: updated, requestId });
  } catch (error) {
    return apiErrorResponse(error, requestId);
  }
}
