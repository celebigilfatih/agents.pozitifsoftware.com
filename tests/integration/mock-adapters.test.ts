import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import { MockNavoriAdapter } from "@/integrations/navori/mock-adapter";
import { MockIntentAdapter } from "@/integrations/openai/intent-adapter";

describe("deterministic mock integrations", () => {
  it("extracts the scoped group and playlist without video bytes", async () => {
    const assetId = randomUUID();
    const intent = await new MockIntentAdapter().parse({
      instruction:
        "Videoyu İstanbul grubundaki Kampanya playlist sonuna ekle ve hemen yayınla.",
      asset: {
        id: assetId,
        originalFileName: "video.mp4",
        mimeType: "video/mp4",
        sizeBytes: 1024,
        durationSeconds: 12,
      },
    });
    expect(intent.uploadedAssetId).toBe(assetId);
    expect(intent.targetGroupNames).toEqual(["İstanbul Mağazaları"]);
    expect(intent.playlistName).toBe("Kampanya");
    expect(intent.requiresConfirmation).toBe(true);
  });

  it("returns isolated catalog copies and deterministic readiness", async () => {
    const adapter = new MockNavoriAdapter();
    const groups = await adapter.getGroups();
    groups[0]!.name = "mutated";
    expect((await adapter.getGroups())[0]!.name).toBe("İstanbul Mağazaları");
    expect((await adapter.readiness()).ready).toBe(true);
  });

  it("publishes only to supplied player ids", async () => {
    const adapter = new MockNavoriAdapter();
    const result = await adapter.publishContent({
      playerIds: ["ply-ist-01"],
      scheduledAt: null,
    });
    expect(result.playerIds).toEqual(["ply-ist-01"]);
    expect(
      (await adapter.queryPublicationResult(result.publicationId)).status,
    ).toBe("completed");
  });
});
