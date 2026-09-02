import { createReadStream } from "node:fs";
import { isIP } from "node:net";
import { extname } from "node:path";

import { env } from "@/env";
import {
  PermanentIntegrationError,
  TransientIntegrationError,
} from "@/domain/retry";
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

type NavoriResponse = {
  Status?: string;
  Message?: string;
  Token?: string;
  GroupList?: Array<Record<string, unknown>>;
  PlayerList?: Array<Record<string, unknown>>;
  PlaylistList?: Array<Record<string, unknown>>;
  MediaList?: Array<Record<string, unknown>>;
  FilePath?: string;
  FileName?: string;
  Offset?: number;
};

const apiMethods = {
  token: "GetToken",
  groups: "GetGroups",
  players: "GetPlayers",
  playlists: "GetPlaylists",
  playlistsById: "GetPlaylistsById",
  uploadFile: "UploadFile",
  setMedias: "SetMedias",
  getMedias: "GetMedias",
  setPlaylists: "SetPlaylists",
  publish: "PublishContent",
  playersById: "GetPlayersById",
} as const;

function stringValue(value: unknown): string {
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : "";
}

function booleanValue(value: unknown): boolean {
  return value === true || value === 1 || value === "1" || value === "true";
}

function validateBaseUrl(rawUrl: string): URL {
  const base = new URL(rawUrl);
  if (base.username || base.password) {
    throw new PermanentIntegrationError(
      "NAVORI_URL_CREDENTIALS",
      "Navori adresi güvenli biçimde yapılandırılmamış.",
    );
  }
  if (env.NODE_ENV === "production" && base.protocol !== "https:") {
    throw new PermanentIntegrationError(
      "NAVORI_HTTPS_REQUIRED",
      "Navori bağlantısı için HTTPS zorunludur.",
    );
  }
  const normalizedHost = base.hostname.toLowerCase();
  if (["localhost", "0.0.0.0", "::1"].includes(normalizedHost)) {
    throw new PermanentIntegrationError(
      "NAVORI_PRIVATE_HOST",
      "Navori adresi izin verilen bir sunucu değil.",
    );
  }
  if (isIP(normalizedHost)) {
    const privateIp =
      normalizedHost.startsWith("10.") ||
      normalizedHost.startsWith("127.") ||
      normalizedHost.startsWith("169.254.") ||
      normalizedHost.startsWith("192.168.") ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(normalizedHost);
    if (privateIp) {
      throw new PermanentIntegrationError(
        "NAVORI_PRIVATE_IP",
        "Navori adresi izin verilen bir sunucu değil.",
      );
    }
  }
  const allowedHosts = env.NAVORI_ALLOWED_HOSTS.split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
  if (allowedHosts.length > 0 && !allowedHosts.includes(normalizedHost)) {
    throw new PermanentIntegrationError(
      "NAVORI_HOST_NOT_ALLOWED",
      "Navori sunucusu izin listesinde değil.",
    );
  }
  return new URL("/NavoriService/Api/", base);
}

export class RealNavoriAdapter implements NavoriAdapter {
  readonly mode = "real" as const;
  private readonly apiBase: URL;
  private tokenCache: { token: string; expiresAt: number } | null = null;

  constructor() {
    if (!env.NAVORI_BASE_URL) {
      throw new PermanentIntegrationError(
        "NAVORI_NOT_CONFIGURED",
        "Navori bağlantısı henüz yapılandırılmadı.",
      );
    }
    this.apiBase = validateBaseUrl(env.NAVORI_BASE_URL);
  }

  private async authenticate(force = false): Promise<string> {
    if (!force && this.tokenCache && this.tokenCache.expiresAt > Date.now()) {
      return this.tokenCache.token;
    }
    const response = await this.post(
      apiMethods.token,
      { Login: env.NAVORI_USERNAME, Password: env.NAVORI_PASSWORD },
      null,
    );
    if (!response.Token) {
      throw new PermanentIntegrationError(
        "NAVORI_AUTH_FAILED",
        "Navori kimlik doğrulaması başarısız. Entegrasyon ayarlarını kontrol edin.",
      );
    }
    this.tokenCache = {
      token: response.Token,
      expiresAt: Date.now() + 9 * 60_000,
    };
    return response.Token;
  }

  private async post(
    method: string,
    payload: object,
    token?: string | null,
  ): Promise<NavoriResponse> {
    const url = new URL(method, this.apiBase);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    try {
      const response = await fetch(url, {
        method: "POST",
        redirect: "error",
        headers: {
          "content-type": "application/json; charset=utf-8",
          accept: "application/json",
          ...(token ? { Token: token } : {}),
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      if (response.status === 401 || response.status === 403) {
        throw new PermanentIntegrationError(
          "NAVORI_NOT_AUTHORIZED",
          "Navori bu işlem için yetki vermedi.",
        );
      }
      if (response.status === 429 || response.status >= 500) {
        throw new TransientIntegrationError(
          "NAVORI_TEMPORARY",
          "Navori geçici olarak yanıt veremiyor. İş sınırlı sayıda tekrar denenecek.",
        );
      }
      if (!response.ok) {
        throw new PermanentIntegrationError(
          "NAVORI_REQUEST_REJECTED",
          "Navori işlemi kabul etmedi. Entegrasyon ayarlarını kontrol edin.",
        );
      }
      const data = (await response.json()) as NavoriResponse;
      if (data.Status && data.Status !== "SUCCESS") {
        const authFailure = /AUTH|TOKEN|AUTHORIZED/i.test(data.Status);
        throw new PermanentIntegrationError(
          authFailure ? "NAVORI_NOT_AUTHORIZED" : "NAVORI_OPERATION_REJECTED",
          authFailure
            ? "Navori oturumu veya yetkisi geçerli değil."
            : "Navori işlemi kabul etmedi.",
        );
      }
      return data;
    } catch (error) {
      if (
        error instanceof PermanentIntegrationError ||
        error instanceof TransientIntegrationError
      ) {
        throw error;
      }
      throw new TransientIntegrationError(
        "NAVORI_UNREACHABLE",
        "Navori sunucusuna şu anda ulaşılamıyor. İş sınırlı sayıda tekrar denenecek.",
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private async call(
    method: string,
    payload: object = {},
  ): Promise<NavoriResponse> {
    const token = await this.authenticate();
    try {
      return await this.post(method, payload, token);
    } catch (error) {
      if (
        error instanceof PermanentIntegrationError &&
        error.code === "NAVORI_NOT_AUTHORIZED"
      ) {
        const renewed = await this.authenticate(true);
        return this.post(method, payload, renewed);
      }
      throw error;
    }
  }

  async readiness(): Promise<NavoriReadiness> {
    try {
      await this.call(apiMethods.groups, { Filter: "*" });
      return {
        ready: true,
        mode: "real",
        message: "Navori API bağlantısı hazır",
        checkedAt: new Date().toISOString(),
      };
    } catch {
      return {
        ready: false,
        mode: "real",
        message: "Navori API Addon veya bağlantı ayarları henüz hazır değil.",
        checkedAt: new Date().toISOString(),
      };
    }
  }

  async getGroups(): Promise<NavoriGroup[]> {
    const data = await this.call(apiMethods.groups, { Filter: "*" });
    return (data.GroupList ?? []).map((item) => ({
      id: stringValue(item.Id),
      name: stringValue(item.Name),
      parentGroupId:
        item.ParentGroupId == null ? null : stringValue(item.ParentGroupId),
    }));
  }

  async getPlayers(): Promise<NavoriPlayer[]> {
    const data = await this.call(apiMethods.players, { Filter: "*" });
    return (data.PlayerList ?? []).map((item) => ({
      id: stringValue(item.Id),
      name: stringValue(item.Name),
      groupId: stringValue(item.GroupId),
      groupName: stringValue(item.GroupName),
      active: booleanValue(item.Active),
      publishedStatus: stringValue(item.PublishedStatus) || undefined,
    }));
  }

  async getPlaylists(groupId?: string): Promise<NavoriPlaylist[]> {
    const groupIds = groupId
      ? [groupId]
      : (await this.getGroups()).map((group) => group.id);
    const results = await Promise.all(
      groupIds.map(async (id) => {
        const data = await this.call(apiMethods.playlists, {
          GroupId: Number(id),
          Filter: "*",
        });
        return (data.PlaylistList ?? []).map((item) => ({
          id: stringValue(item.Id),
          name: stringValue(item.Name),
          groupId: stringValue(item.GroupId || id),
          contentCount: Array.isArray(item.PlaylistContentList)
            ? item.PlaylistContentList.length
            : 0,
        }));
      }),
    );
    return results.flat();
  }

  private async getPlaylistRaw(
    playlistId: string,
  ): Promise<Record<string, unknown>> {
    const data = await this.call(apiMethods.playlistsById, {
      IdList: [Number(playlistId)],
    });
    const playlist = data.PlaylistList?.[0];
    if (!playlist) {
      throw new PermanentIntegrationError(
        "NAVORI_PLAYLIST_NOT_FOUND",
        "Seçilen playlist Navori üzerinde bulunamadı.",
      );
    }
    return playlist;
  }

  async getPlaylistContents(
    playlistId: string,
  ): Promise<NavoriPlaylistContent[]> {
    const playlist = await this.getPlaylistRaw(playlistId);
    const contents = Array.isArray(playlist.PlaylistContentList)
      ? (playlist.PlaylistContentList as Array<Record<string, unknown>>)
      : [];
    return contents.map((item) => ({
      id: stringValue(item.Id),
      contentId: stringValue(item.ContentId),
      index: Number(item.Index ?? 0),
      playlistId: stringValue(item.PlaylistId || playlistId),
      type: stringValue(item.Type),
    }));
  }

  async uploadMedia(input: {
    filePath: string;
    fileName: string;
    sizeBytes: number;
    groupId: string;
    assetId: string;
  }): Promise<NavoriMedia> {
    const extension = extname(input.fileName)
      .toLowerCase()
      .replace(/[^.a-z0-9]/g, "");
    const safeFileName = `${input.assetId}${extension || ".mp4"}`;
    let offset = 0;
    let remoteFileName = safeFileName;
    let remotePath = "";

    for await (const chunk of createReadStream(input.filePath, {
      highWaterMark: 2 * 1024 * 1024,
    })) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      const data = await this.call(apiMethods.uploadFile, {
        FileSize: input.sizeBytes,
        Buffer: buffer.toString("base64"),
        FileName: remoteFileName,
        Offset: offset,
      });
      offset = Number(data.Offset ?? offset + buffer.length);
      remoteFileName = data.FileName ?? remoteFileName;
      remotePath = data.FilePath ?? remotePath;
    }

    if (!remotePath) {
      throw new TransientIntegrationError(
        "NAVORI_UPLOAD_INCOMPLETE",
        "Video Navori'ye tam olarak aktarılamadı.",
      );
    }

    const mediaName = `Pozitif-${input.assetId}`;
    const setResult = await this.call(apiMethods.setMedias, {
      MediaList: [
        {
          GroupId: Number(input.groupId),
          MediaPath: remotePath,
          Name: mediaName,
        },
      ],
    });
    const created = setResult.MediaList?.[0];
    if (created) {
      return {
        id: stringValue(created.Id),
        name: stringValue(created.Name || mediaName),
        groupId: stringValue(created.GroupId || input.groupId),
      };
    }
    const lookup = await this.call(apiMethods.getMedias, {
      GroupId: Number(input.groupId),
      Filter: `Name=${mediaName}`,
    });
    const found = lookup.MediaList?.find(
      (item) => stringValue(item.Name) === mediaName,
    );
    if (!found) {
      throw new TransientIntegrationError(
        "NAVORI_MEDIA_LOOKUP_FAILED",
        "Video aktarıldı ancak Navori medya kaydı doğrulanamadı.",
      );
    }
    return {
      id: stringValue(found.Id),
      name: stringValue(found.Name),
      groupId: stringValue(found.GroupId || input.groupId),
    };
  }

  async appendMediaToPlaylist(input: { playlistId: string; mediaId: string }) {
    const playlist = await this.getPlaylistRaw(input.playlistId);
    const contents = Array.isArray(playlist.PlaylistContentList)
      ? [...(playlist.PlaylistContentList as Array<Record<string, unknown>>)]
      : [];
    contents.push({
      Id: 0,
      ContentId: Number(input.mediaId),
      Index: contents.length,
      PlaylistId: Number(input.playlistId),
      Type: "Media",
    });
    await this.call(apiMethods.setPlaylists, {
      PlaylistList: [{ ...playlist, PlaylistContentList: contents }],
    });
    return { playlistId: input.playlistId, contentCount: contents.length };
  }

  async publishContent(input: {
    playerIds: string[];
    scheduledAt: string | null;
  }): Promise<PublicationResult> {
    await this.call(apiMethods.publish, {
      PlayerIdList: input.playerIds.map(Number),
      Option: input.scheduledAt ? "Defered" : "ASAP",
      Methode: "RestartPlaylist",
      ...(input.scheduledAt ? { Date: input.scheduledAt } : {}),
    });
    const publicationId = Buffer.from(JSON.stringify(input.playerIds)).toString(
      "base64url",
    );
    return {
      publicationId,
      status: "accepted",
      playerIds: input.playerIds,
      message: "Navori yayın isteğini kabul etti.",
    };
  }

  async queryPublicationResult(
    publicationId: string,
  ): Promise<PublicationResult> {
    let playerIds: string[];
    try {
      const parsed: unknown = JSON.parse(
        Buffer.from(publicationId, "base64url").toString("utf8"),
      );
      playerIds = Array.isArray(parsed)
        ? parsed.filter((id): id is string => typeof id === "string")
        : [];
    } catch {
      throw new PermanentIntegrationError(
        "NAVORI_PUBLICATION_ID_INVALID",
        "Yayın sorgu kimliği geçerli değil.",
      );
    }
    const data = await this.call(apiMethods.playersById, {
      IdList: playerIds.map(Number),
    });
    const statuses = (data.PlayerList ?? []).map((item) =>
      stringValue(item.PublishedStatus),
    );
    const failed = statuses.some((status) => /fail|error/i.test(status));
    const completed =
      statuses.length > 0 &&
      statuses.every((status) => /publish|success|complete/i.test(status));
    return {
      publicationId,
      playerIds,
      status: failed ? "failed" : completed ? "completed" : "accepted",
      message: failed
        ? "Navori bazı player'larda yayın hatası bildirdi."
        : completed
          ? "Navori yayını tamamladı."
          : "Navori yayını işliyor.",
    };
  }
}
