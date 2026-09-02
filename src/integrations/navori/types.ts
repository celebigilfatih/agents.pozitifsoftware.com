export type NavoriGroup = {
  id: string;
  name: string;
  parentGroupId: string | null;
};
export type NavoriPlayer = {
  id: string;
  name: string;
  groupId: string;
  groupName: string;
  active: boolean;
  publishedStatus?: string;
};
export type NavoriPlaylist = {
  id: string;
  name: string;
  groupId: string;
  contentCount: number;
};
export type NavoriPlaylistContent = {
  id: string;
  contentId: string;
  index: number;
  playlistId: string;
  type: string;
};
export type NavoriMedia = { id: string; name: string; groupId: string };
export type PublicationResult = {
  publicationId: string;
  status: "accepted" | "completed" | "failed";
  playerIds: string[];
  message: string;
};
export type NavoriReadiness = {
  ready: boolean;
  mode: "mock" | "real";
  message: string;
  checkedAt: string;
};

export interface NavoriAdapter {
  readonly mode: "mock" | "real";
  readiness(): Promise<NavoriReadiness>;
  getGroups(): Promise<NavoriGroup[]>;
  getPlayers(): Promise<NavoriPlayer[]>;
  getPlaylists(groupId?: string): Promise<NavoriPlaylist[]>;
  getPlaylistContents(playlistId: string): Promise<NavoriPlaylistContent[]>;
  uploadMedia(input: {
    filePath: string;
    fileName: string;
    sizeBytes: number;
    groupId: string;
    assetId: string;
  }): Promise<NavoriMedia>;
  appendMediaToPlaylist(input: {
    playlistId: string;
    mediaId: string;
  }): Promise<{ playlistId: string; contentCount: number }>;
  publishContent(input: {
    playerIds: string[];
    scheduledAt: string | null;
  }): Promise<PublicationResult>;
  queryPublicationResult(publicationId: string): Promise<PublicationResult>;
}
