import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  containsForbiddenInstruction,
  enforceIntentBusinessRules,
} from "@/domain/intent";

function validIntent(assetId: string) {
  return {
    action: "publish_uploaded_asset",
    uploadedAssetId: assetId,
    targetGroupNames: ["İstanbul Mağazaları"],
    targetGroupIds: [],
    targetPlayerNames: [],
    targetPlayerIds: [],
    playlistName: "Kampanya",
    playlistId: null,
    playlistOperation: "append",
    publishMode: "asap",
    requestedSchedule: null,
    requiresConfirmation: false,
    assumptions: [],
    ambiguities: [],
  };
}

describe("intent safety boundary", () => {
  it.each([
    "playlisti sil",
    "videoyu kaldır",
    "playlisti tamamen değiştir",
    "purge content",
  ])("blocks destructive instruction: %s", (instruction) =>
    expect(containsForbiddenInstruction(instruction)).toBe(true),
  );

  it("forces human confirmation", () => {
    const assetId = randomUUID();
    expect(
      enforceIntentBusinessRules(validIntent(assetId), assetId)
        .requiresConfirmation,
    ).toBe(true);
  });

  it("rejects model-selected asset substitution", () => {
    expect(() =>
      enforceIntentBusinessRules(validIntent(randomUUID()), randomUUID()),
    ).toThrow("farklı bir asset");
  });

  it("rejects extra schema keys", () => {
    const assetId = randomUUID();
    expect(() =>
      enforceIntentBusinessRules(
        { ...validIntent(assetId), shell: "run" },
        assetId,
      ),
    ).toThrow();
  });
});
