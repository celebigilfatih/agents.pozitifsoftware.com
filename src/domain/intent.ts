import { z } from "zod";

export const parsedIntentSchema = z
  .object({
    action: z.enum([
      "publish_uploaded_asset",
      "upload_media",
      "query_publication",
    ]),
    uploadedAssetId: z.uuid(),
    targetGroupNames: z.array(z.string().min(1).max(160)),
    targetGroupIds: z.array(z.string().min(1).max(100)),
    targetPlayerNames: z.array(z.string().min(1).max(160)),
    targetPlayerIds: z.array(z.string().min(1).max(100)),
    playlistName: z.string().min(1).max(160).nullable(),
    playlistId: z.string().min(1).max(100).nullable(),
    playlistOperation: z.enum(["append", "none"]),
    publishMode: z.enum(["asap", "scheduled", "draft"]),
    requestedSchedule: z.iso.datetime().nullable(),
    requiresConfirmation: z.boolean(),
    assumptions: z.array(z.string().max(300)).max(20),
    ambiguities: z.array(z.string().max(300)).max(20),
  })
  .strict();

export type ParsedIntent = z.infer<typeof parsedIntentSchema>;

export const resolvedTargetSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["group", "player", "playlist"]),
  screenCount: z.number().int().nonnegative(),
});

export type ResolvedTarget = z.infer<typeof resolvedTargetSchema>;

export type PublicationPreview = {
  commandRequestId: string;
  asset: {
    id: string;
    originalFileName: string;
    mimeType: string;
    sizeBytes: number;
    checksumSha256: string;
    durationSeconds: number | null;
  };
  intent: ParsedIntent;
  playlist: ResolvedTarget | null;
  targets: ResolvedTarget[];
  affectedScreenCount: number;
  warnings: string[];
  canConfirm: boolean;
};

const forbiddenPatterns = [
  /\b(sil|silin|kaldır|delete|remove|wipe|purge)\b/iu,
  /playlist(?:i|ı)?\s+(?:tamamen\s+)?(?:değiştir|sıfırla|replace|overwrite)/iu,
];

export function containsForbiddenInstruction(instruction: string): boolean {
  return forbiddenPatterns.some((pattern) => pattern.test(instruction));
}

export function enforceIntentBusinessRules(
  candidate: unknown,
  expectedAssetId: string,
): ParsedIntent {
  const parsed = parsedIntentSchema.parse(candidate);
  if (parsed.uploadedAssetId !== expectedAssetId) {
    throw new Error("Model farklı bir asset kimliği seçti.");
  }
  if (
    parsed.playlistOperation !== "append" &&
    parsed.action === "publish_uploaded_asset"
  ) {
    throw new Error("MVP yalnızca playlist sonuna ekleme işlemine izin verir.");
  }
  return {
    ...parsed,
    requiresConfirmation: parsed.action !== "query_publication",
  };
}
