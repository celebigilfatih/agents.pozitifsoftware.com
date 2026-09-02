import { describe, expect, it } from "vitest";

import {
  hasValidVideoSignature,
  resolveUploadPath,
  sanitizeOriginalFileName,
} from "@/storage/uploads";

describe("upload path hardening", () => {
  it("removes path traversal from display name", () => {
    expect(sanitizeOriginalFileName("../../kampanya.mp4")).toBe("kampanya.mp4");
  });

  it.each([
    "../../secret.mp4",
    "not-a-uuid.mp4",
    "00000000-0000-0000-0000-000000000000.exe",
  ])("rejects invalid storage key %s", (key) =>
    expect(() => resolveUploadPath(key)).toThrow(
      "Dosya anahtarı geçerli değil",
    ),
  );

  it("validates video content signatures independently from MIME headers", () => {
    const mp4 = Buffer.concat([Buffer.alloc(4), Buffer.from("ftypisom")]);
    const webm = Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x42]);
    const avi = Buffer.concat([
      Buffer.from("RIFF"),
      Buffer.alloc(4),
      Buffer.from("AVI "),
    ]);

    expect(hasValidVideoSignature("video/mp4", mp4)).toBe(true);
    expect(hasValidVideoSignature("video/webm", webm)).toBe(true);
    expect(hasValidVideoSignature("video/x-msvideo", avi)).toBe(true);
    expect(
      hasValidVideoSignature("video/mp4", Buffer.from("not a video")),
    ).toBe(false);
  });
});
