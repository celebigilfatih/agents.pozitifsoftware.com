import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { userTargetPermission } from "@/db/schema";
import { getNavoriAdapter } from "@/integrations/navori";
import { apiErrorResponse, requireApiActor } from "@/lib/api";

export async function GET(request: Request) {
  const requestId = randomUUID();
  try {
    const actor = await requireApiActor(request, "preparePublication");
    const adapter = getNavoriAdapter();
    const [groups, players, playlists, permissions] = await Promise.all([
      adapter.getGroups(),
      adapter.getPlayers(),
      adapter.getPlaylists(),
      actor.role === "admin"
        ? Promise.resolve([])
        : db
            .select()
            .from(userTargetPermission)
            .where(eq(userTargetPermission.userId, actor.id)),
    ]);
    if (actor.role === "admin") {
      return NextResponse.json({
        data: { groups, players, playlists },
        requestId,
      });
    }
    const allowedGroupIds = new Set(
      permissions
        .filter((item) => item.targetType === "group")
        .map((item) => item.targetId),
    );
    const allowed = (
      type: "group" | "player" | "playlist",
      id: string,
      groupId?: string,
    ) =>
      permissions.some(
        (item) => item.targetType === type && item.targetId === id,
      ) || (groupId ? allowedGroupIds.has(groupId) : false);
    return NextResponse.json({
      data: {
        groups: groups.filter((item) => allowed("group", item.id)),
        players: players.filter((item) =>
          allowed("player", item.id, item.groupId),
        ),
        playlists: playlists.filter((item) =>
          allowed("playlist", item.id, item.groupId),
        ),
      },
      requestId,
    });
  } catch (error) {
    return apiErrorResponse(error, requestId);
  }
}
