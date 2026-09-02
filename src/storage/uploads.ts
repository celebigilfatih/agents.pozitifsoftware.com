import { createHash, randomUUID } from "node:crypto";
import { mkdir, open, stat, unlink } from "node:fs/promises";
import { basename, extname, resolve, sep } from "node:path";

import { env } from "@/env";
import { ApiError } from "@/lib/api";

const allowedMimeTypes = new Map([
  ["video/mp4", ".mp4"],
  ["video/webm", ".webm"],
  ["video/quicktime", ".mov"],
  ["video/x-msvideo", ".avi"],
]);

export const maxUploadBytes = env.MAX_UPLOAD_SIZE_MB * 1024 * 1024;

export function hasValidVideoSignature(
  mimeType: string,
  prefix: Uint8Array,
): boolean {
  const bytes = Buffer.from(prefix);
  if (mimeType === "video/webm") {
    return (
      bytes.length >= 4 &&
      bytes.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))
    );
  }
  if (mimeType === "video/x-msvideo") {
    return (
      bytes.length >= 12 &&
      bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
      bytes.subarray(8, 12).toString("ascii") === "AVI "
    );
  }
  if (mimeType === "video/mp4" || mimeType === "video/quicktime") {
    return (
      bytes.length >= 12 && bytes.subarray(4, 8).toString("ascii") === "ftyp"
    );
  }
  return false;
}

export function sanitizeOriginalFileName(value: string): string {
  const normalized = basename(value.normalize("NFKC"))
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim();
  return (normalized || "video").slice(0, 240);
}

export function resolveUploadPath(storageKey: string): string {
  if (!/^[0-9a-f-]{36}\.(mp4|webm|mov|avi)$/.test(storageKey)) {
    throw new ApiError(
      400,
      "INVALID_STORAGE_KEY",
      "Dosya anahtarı geçerli değil.",
    );
  }
  const root = resolve(env.TEMP_UPLOAD_PATH);
  const candidate = resolve(root, storageKey);
  if (!candidate.startsWith(`${root}${sep}`)) {
    throw new ApiError(
      400,
      "INVALID_STORAGE_PATH",
      "Dosya yolu geçerli değil.",
    );
  }
  return candidate;
}

export async function persistUpload(input: {
  body: ReadableStream<Uint8Array> | null;
  mimeType: string;
  originalFileName: string;
  contentLength: number | null;
}) {
  const extension = allowedMimeTypes.get(input.mimeType);
  if (!extension) {
    throw new ApiError(
      415,
      "UNSUPPORTED_VIDEO_TYPE",
      "Desteklenen video türleri MP4, WebM, MOV ve AVI'dir.",
    );
  }
  if (!input.body) {
    throw new ApiError(400, "EMPTY_UPLOAD", "Video verisi bulunamadı.");
  }
  if (input.contentLength !== null && input.contentLength > maxUploadBytes) {
    throw new ApiError(
      413,
      "UPLOAD_TOO_LARGE",
      `Video boyutu en fazla ${env.MAX_UPLOAD_SIZE_MB} MB olabilir.`,
    );
  }

  await mkdir(resolve(env.TEMP_UPLOAD_PATH), { recursive: true, mode: 0o750 });
  const storageKey = `${randomUUID()}${extension}`;
  const filePath = resolveUploadPath(storageKey);
  const file = await open(filePath, "wx", 0o640);
  const hash = createHash("sha256");
  let sizeBytes = 0;
  let signaturePrefix = Buffer.alloc(0);

  try {
    const reader = input.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      sizeBytes += value.byteLength;
      if (sizeBytes > maxUploadBytes) {
        await reader.cancel();
        throw new ApiError(
          413,
          "UPLOAD_TOO_LARGE",
          `Video boyutu en fazla ${env.MAX_UPLOAD_SIZE_MB} MB olabilir.`,
        );
      }
      const buffer = Buffer.from(value);
      if (signaturePrefix.length < 64) {
        signaturePrefix = Buffer.concat([
          signaturePrefix,
          buffer.subarray(0, 64 - signaturePrefix.length),
        ]);
      }
      hash.update(buffer);
      await file.write(buffer);
    }
  } catch (error) {
    await file.close();
    await unlink(filePath).catch(() => undefined);
    throw error;
  }
  await file.close();

  if (sizeBytes === 0) {
    await unlink(filePath).catch(() => undefined);
    throw new ApiError(400, "EMPTY_UPLOAD", "Yüklenen video boş.");
  }
  if (!hasValidVideoSignature(input.mimeType, signaturePrefix)) {
    await unlink(filePath).catch(() => undefined);
    throw new ApiError(
      415,
      "VIDEO_SIGNATURE_INVALID",
      "Dosya içeriği seçilen video formatıyla eşleşmiyor.",
    );
  }

  return {
    storageKey,
    originalFileName: sanitizeOriginalFileName(input.originalFileName),
    sizeBytes,
    checksumSha256: hash.digest("hex"),
    filePath,
  };
}

export async function deleteUpload(storageKey: string): Promise<boolean> {
  const path = resolveUploadPath(storageKey);
  try {
    await unlink(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}

export async function uploadDiskUsage(storageKeys: string[]): Promise<number> {
  const sizes = await Promise.all(
    storageKeys.map(async (key) => {
      try {
        return (await stat(resolveUploadPath(key))).size;
      } catch {
        return 0;
      }
    }),
  );
  return sizes.reduce((sum, size) => sum + size, 0);
}

export function extensionForFileName(fileName: string) {
  return extname(fileName).toLowerCase();
}
