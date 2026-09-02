import { randomUUID } from "node:crypto";

import type {
  NavoriAdapter,
  NavoriGroup,
  NavoriMedia,
  NavoriPlayer,
  NavoriPlaylist,
  NavoriPlaylistContent,
  NavoriReadiness,
  PublicationResult,
} from "@/integrations/navori/types";

const groups: NavoriGroup[] = [
  { id: "grp-istanbul", name: "İstanbul Mağazaları", parentGroupId: null },
  { id: "grp-ankara", name: "Ankara Mağazaları", parentGroupId: null },
  { id: "grp-izmir", name: "İzmir Mağazaları", parentGroupId: null },
];

const players: NavoriPlayer[] = [
  {
    id: "ply-ist-01",
    name: "Kadıköy Ekran 01",
    groupId: "grp-istanbul",
    groupName: "İstanbul Mağazaları",
    active: true,
  },
  {
    id: "ply-ist-02",
    name: "Beşiktaş Ekran 01",
    groupId: "grp-istanbul",
    groupName: "İstanbul Mağazaları",
    active: true,
  },
  {
    id: "ply-ist-03",
    name: "Ataşehir Ekran 02",
    groupId: "grp-istanbul",
    groupName: "İstanbul Mağazaları",
    active: true,
  },
  {
    id: "ply-ank-01",
    name: "Çankaya Ekran 01",
    groupId: "grp-ankara",
    groupName: "Ankara Mağazaları",
    active: true,
  },
  {
    id: "ply-ank-02",
    name: "Kızılay Ekran 02",
    groupId: "grp-ankara",
    groupName: "Ankara Mağazaları",
    active: false,
  },
  {
    id: "ply-izm-01",
    name: "Alsancak Ekran 01",
    groupId: "grp-izmir",
    groupName: "İzmir Mağazaları",
    active: true,
  },
];

const playlists: NavoriPlaylist[] = [
  {
    id: "pl-yaz-ist",
    name: "Yaz Kampanyası",
    groupId: "grp-istanbul",
    contentCount: 4,
  },
  {
    id: "pl-yaz-ank",
    name: "Yaz Kampanyası",
    groupId: "grp-ankara",
    contentCount: 3,
  },
  {
    id: "pl-duyuru-ist",
    name: "Mağaza Duyuruları",
    groupId: "grp-istanbul",
    contentCount: 7,
  },
  {
    id: "pl-kampanya-a",
    name: "Kampanya",
    groupId: "grp-istanbul",
    contentCount: 2,
  },
  {
    id: "pl-kampanya-b",
    name: "Kampanya",
    groupId: "grp-istanbul",
    contentCount: 5,
  },
];

const publicationResults = new Map<string, PublicationResult>();

export class MockNavoriAdapter implements NavoriAdapter {
  readonly mode = "mock" as const;

  async readiness(): Promise<NavoriReadiness> {
    return {
      ready: true,
      mode: "mock",
      message: "Mock Navori bağlantısı hazır",
      checkedAt: new Date().toISOString(),
    };
  }

  async getGroups() {
    return structuredClone(groups);
  }

  async getPlayers() {
    return structuredClone(players);
  }

  async getPlaylists(groupId?: string) {
    return structuredClone(
      groupId
        ? playlists.filter((item) => item.groupId === groupId)
        : playlists,
    );
  }

  async getPlaylistContents(
    playlistId: string,
  ): Promise<NavoriPlaylistContent[]> {
    const playlist = playlists.find((item) => item.id === playlistId);
    if (!playlist) return [];
    return Array.from({ length: playlist.contentCount }, (_, index) => ({
      id: `mock-content-${index + 1}`,
      contentId: `mock-media-${index + 1}`,
      index,
      playlistId,
      type: "Media",
    }));
  }

  async uploadMedia(input: {
    filePath: string;
    fileName: string;
    sizeBytes: number;
    groupId: string;
    assetId: string;
  }): Promise<NavoriMedia> {
    if (input.fileName.includes("mock-fail-permanent")) {
      throw new Error("MOCK_PERMANENT");
    }
    return {
      id: `media-${input.assetId}`,
      name: input.fileName,
      groupId: input.groupId,
    };
  }

  async appendMediaToPlaylist(input: { playlistId: string; mediaId: string }) {
    const playlist = playlists.find((item) => item.id === input.playlistId);
    if (!playlist) throw new Error("MOCK_PLAYLIST_NOT_FOUND");
    playlist.contentCount += 1;
    return { playlistId: playlist.id, contentCount: playlist.contentCount };
  }

  async publishContent(input: {
    playerIds: string[];
    scheduledAt: string | null;
  }) {
    const publicationId = `mock-pub-${randomUUID()}`;
    const result: PublicationResult = {
      publicationId,
      status: "completed",
      playerIds: input.playerIds,
      message: `${input.playerIds.length} player için mock yayın tamamlandı.`,
    };
    publicationResults.set(publicationId, result);
    return result;
  }

  async queryPublicationResult(publicationId: string) {
    return (
      publicationResults.get(publicationId) ?? {
        publicationId,
        status: "failed" as const,
        playerIds: [],
        message: "Mock yayın kaydı bulunamadı.",
      }
    );
  }
}
