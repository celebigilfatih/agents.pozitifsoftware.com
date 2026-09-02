import { eq } from "drizzle-orm";

import { db } from "@/db";
import { userTargetPermission } from "@/db/schema";
import type { ParsedIntent, ResolvedTarget } from "@/domain/intent";
import { getNavoriAdapter } from "@/integrations/navori";
import type { AppRole } from "@/lib/auth/permissions";

export type TargetResolution = {
  playlist: ResolvedTarget | null;
  targets: ResolvedTarget[];
  playerIds: string[];
  ambiguities: string[];
};

function normalized(value: string) {
  return value.trim().toLocaleLowerCase("tr-TR");
}

export async function resolveIntentTargets(input: {
  intent: ParsedIntent;
  userId: string;
  role: AppRole;
}): Promise<TargetResolution> {
  const adapter = getNavoriAdapter();
  const [groups, players, playlists, permissions] = await Promise.all([
    adapter.getGroups(),
    adapter.getPlayers(),
    adapter.getPlaylists(),
    input.role === "admin"
      ? Promise.resolve([])
      : db
          .select()
          .from(userTargetPermission)
          .where(eq(userTargetPermission.userId, input.userId)),
  ]);

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
    input.role === "admin" ||
    permissions.some(
      (item) => item.targetType === type && item.targetId === id,
    ) ||
    (groupId !== undefined && allowedGroupIds.has(groupId));
  const ambiguities = [...input.intent.ambiguities];

  const groupMatches = groups.filter(
    (group) =>
      (input.intent.targetGroupIds.includes(group.id) ||
        input.intent.targetGroupNames.some(
          (name) => normalized(name) === normalized(group.name),
        )) &&
      allowed("group", group.id),
  );
  const explicitGroupRequests =
    input.intent.targetGroupIds.length + input.intent.targetGroupNames.length;
  if (explicitGroupRequests > 0 && groupMatches.length === 0) {
    ambiguities.push(
      "Belirtilen grup bulunamadı veya bu grup için yetkiniz yok.",
    );
  }
  for (const requestedName of input.intent.targetGroupNames) {
    const sameName = groups.filter(
      (group) =>
        normalized(group.name) === normalized(requestedName) &&
        allowed("group", group.id),
    );
    if (sameName.length > 1) {
      ambiguities.push(`“${requestedName}” adıyla birden fazla grup bulundu.`);
    }
  }

  const playerMatches = players.filter(
    (player) =>
      (input.intent.targetPlayerIds.includes(player.id) ||
        input.intent.targetPlayerNames.some(
          (name) => normalized(name) === normalized(player.name),
        )) &&
      allowed("player", player.id, player.groupId),
  );
  const groupPlayerMatches = players.filter(
    (player) =>
      groupMatches.some((group) => group.id === player.groupId) &&
      player.active,
  );
  const selectedPlayers = [
    ...new Map(
      [...playerMatches, ...groupPlayerMatches].map((p) => [p.id, p]),
    ).values(),
  ];
  if (selectedPlayers.length === 0) {
    ambiguities.push("Yayınlanacak aktif player bulunamadı.");
  }

  let playlistCandidates = playlists.filter((playlist) =>
    allowed("playlist", playlist.id, playlist.groupId),
  );
  if (groupMatches.length > 0) {
    playlistCandidates = playlistCandidates.filter((playlist) =>
      groupMatches.some((group) => group.id === playlist.groupId),
    );
  }
  if (input.intent.playlistId) {
    playlistCandidates = playlistCandidates.filter(
      (playlist) =>
        playlist.id === input.intent.playlistId &&
        allowed("playlist", playlist.id, playlist.groupId),
    );
  } else if (input.intent.playlistName) {
    playlistCandidates = playlistCandidates.filter(
      (playlist) =>
        normalized(playlist.name) ===
        normalized(input.intent.playlistName ?? ""),
    );
  } else {
    playlistCandidates = [];
  }

  if (playlistCandidates.length === 0) {
    ambiguities.push(
      "Belirtilen playlist bulunamadı veya bu playlist için yetkiniz yok.",
    );
  } else if (playlistCandidates.length > 1) {
    ambiguities.push(
      "Aynı adla birden fazla playlist bulundu; lütfen bir playlist seçin.",
    );
  }

  const playlist =
    playlistCandidates.length === 1 ? playlistCandidates[0] : null;
  const targets: ResolvedTarget[] = [
    ...groupMatches.map((group) => ({
      id: group.id,
      name: group.name,
      type: "group" as const,
      screenCount: groupPlayerMatches.filter(
        (player) => player.groupId === group.id,
      ).length,
    })),
    ...playerMatches.map((player) => ({
      id: player.id,
      name: player.name,
      type: "player" as const,
      screenCount: 1,
    })),
  ];

  return {
    playlist: playlist
      ? {
          id: playlist.id,
          name: playlist.name,
          type: "playlist",
          screenCount: 0,
        }
      : null,
    targets,
    playerIds: selectedPlayers.map((player) => player.id),
    ambiguities: [...new Set(ambiguities)],
  };
}
