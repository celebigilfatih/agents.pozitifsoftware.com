import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type RecordedRequest = {
  url: string;
  init: RequestInit | undefined;
};

function jsonResponse(body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function stubFetch(responses: Array<Record<string, unknown>>) {
  const requests: RecordedRequest[] = [];
  vi.stubGlobal(
    "fetch",
    async (input: string | URL | Request, init?: RequestInit) => {
      requests.push({
        url: input instanceof Request ? input.url : String(input),
        init,
      });
      const response = responses.shift();
      if (!response) throw new Error("Unexpected Navori request");
      return jsonResponse(response);
    },
  );
  return requests;
}

function requestBody(request: RecordedRequest) {
  return JSON.parse(String(request.init?.body)) as Record<string, unknown>;
}

async function createAdapter() {
  const { RealNavoriAdapter } =
    await import("@/integrations/navori/real-adapter");
  return new RealNavoriAdapter();
}

describe("real Navori SaaS contract", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("NAVORI_API_ENABLED", "true");
    vi.stubEnv(
      "NAVORI_BASE_URL",
      "https://saas.navori.com/NavoriService/APIDocumentation/",
    );
    vi.stubEnv("NAVORI_USERNAME", "contract-user");
    vi.stubEnv("NAVORI_PASSWORD", "contract-password");
    vi.stubEnv("NAVORI_ALLOWED_HOSTS", "saas.navori.com");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("normalizes the SaaS URL and performs GetToken then GetGroups", async () => {
    const requests = stubFetch([
      { Status: "SUCCESS", Token: "contract-token" },
      { Status: "SUCCESS", GroupList: [] },
    ]);
    const adapter = await createAdapter();

    await expect(adapter.readiness()).resolves.toMatchObject({
      ready: true,
      mode: "real",
    });
    expect(requests.map((request) => request.url)).toEqual([
      "https://saas.navori.com/NavoriService/Api/GetToken",
      "https://saas.navori.com/NavoriService/Api/GetGroups",
    ]);
    expect(requestBody(requests[0]!)).toEqual({
      Login: "contract-user",
      Password: "contract-password",
    });
    expect(new Headers(requests[1]!.init?.headers).get("Token")).toBe(
      "contract-token",
    );
    expect(requestBody(requests[1]!)).toEqual({ Filter: "*" });
  });

  it("uses the documented Defered option for a scheduled publish", async () => {
    const requests = stubFetch([
      { Status: "SUCCESS", Token: "contract-token" },
      { Status: "SUCCESS" },
    ]);
    const adapter = await createAdapter();

    await adapter.publishContent({
      playerIds: ["101", "202"],
      scheduledAt: "2026-09-05T10:00:00Z",
    });

    expect(requests[1]!.url).toBe(
      "https://saas.navori.com/NavoriService/Api/PublishContent",
    );
    expect(requestBody(requests[1]!)).toEqual({
      PlayerIdList: [101, 202],
      Option: "Defered",
      Methode: "RestartPlaylist",
      Date: "2026-09-05T10:00:00Z",
    });
  });

  it("uses ASAP without a date for an immediate publish", async () => {
    const requests = stubFetch([
      { Status: "SUCCESS", Token: "contract-token" },
      { Status: "SUCCESS" },
    ]);
    const adapter = await createAdapter();

    await adapter.publishContent({ playerIds: ["303"], scheduledAt: null });

    expect(requestBody(requests[1]!)).toEqual({
      PlayerIdList: [303],
      Option: "ASAP",
      Methode: "RestartPlaylist",
    });
  });

  it("preserves existing playlist contents when appending media", async () => {
    const requests = stubFetch([
      { Status: "SUCCESS", Token: "contract-token" },
      {
        Status: "SUCCESS",
        PlaylistList: [
          {
            Id: 44,
            GroupId: 7,
            Name: "Kampanya",
            PlaylistContentList: [
              {
                Id: 8,
                ContentId: 12,
                Index: 0,
                PlaylistId: 44,
                Type: "Media",
              },
            ],
          },
        ],
      },
      { Status: "SUCCESS" },
    ]);
    const adapter = await createAdapter();

    await expect(
      adapter.appendMediaToPlaylist({ playlistId: "44", mediaId: "13" }),
    ).resolves.toEqual({ playlistId: "44", contentCount: 2 });

    expect(requestBody(requests[2]!)).toEqual({
      PlaylistList: [
        {
          Id: 44,
          GroupId: 7,
          Name: "Kampanya",
          PlaylistContentList: [
            {
              Id: 8,
              ContentId: 12,
              Index: 0,
              PlaylistId: 44,
              Type: "Media",
            },
            {
              Id: 0,
              ContentId: 13,
              Index: 1,
              PlaylistId: 44,
              Type: "Media",
            },
          ],
        },
      ],
    });
  });
});
