import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  auditEvent,
  commandRequest,
  parsedIntent,
  publicationJob,
  publicationTarget,
  uploadedAsset,
} from "@/db/schema";
import type { ParsedIntent, PublicationPreview } from "@/domain/intent";
import { containsForbiddenInstruction } from "@/domain/intent";
import {
  getIntentAdapter,
  INTENT_PROMPT_VERSION,
} from "@/integrations/openai/intent-adapter";
import { ApiError } from "@/lib/api";
import type { SessionActor } from "@/lib/auth/session";
import { redactForAudit, writeAudit } from "@/lib/audit";
import { enqueuePublication } from "@/queue";
import {
  resolveIntentTargets,
  type TargetResolution,
} from "@/services/target-resolver";

function toPreview(input: {
  commandId: string;
  asset: typeof uploadedAsset.$inferSelect;
  intent: ParsedIntent;
  resolution: TargetResolution;
}): PublicationPreview {
  return {
    commandRequestId: input.commandId,
    asset: {
      id: input.asset.id,
      originalFileName: input.asset.originalFileName,
      mimeType: input.asset.mimeType,
      sizeBytes: input.asset.sizeBytes,
      checksumSha256: input.asset.checksumSha256,
      durationSeconds: input.asset.durationSeconds,
    },
    intent: input.intent,
    playlist: input.resolution.playlist,
    targets: input.resolution.targets,
    affectedScreenCount: input.resolution.playerIds.length,
    warnings: [
      ...input.intent.assumptions,
      ...input.resolution.ambiguities,
      ...(input.resolution.playerIds.length === 0
        ? ["Aktif ekran bulunamadı."]
        : []),
    ],
    canConfirm:
      input.resolution.ambiguities.length === 0 &&
      input.resolution.playlist !== null &&
      input.resolution.playerIds.length > 0,
  };
}

export async function createPublicationPlan(input: {
  actor: SessionActor;
  assetId: string;
  instruction: string;
  requestId: string;
}): Promise<PublicationPreview> {
  const instruction = input.instruction.trim();
  if (instruction.length < 8 || instruction.length > 2_000) {
    throw new ApiError(
      400,
      "INVALID_INSTRUCTION",
      "Talimat 8–2000 karakter arasında olmalıdır.",
    );
  }
  if (containsForbiddenInstruction(instruction)) {
    throw new ApiError(
      422,
      "DESTRUCTIVE_ACTION_FORBIDDEN",
      "Silme, kaldırma veya playlist'i tamamen değiştirme işlemleri MVP kapsamında değildir.",
    );
  }

  const [asset] = await db
    .select()
    .from(uploadedAsset)
    .where(
      input.actor.role === "admin"
        ? eq(uploadedAsset.id, input.assetId)
        : and(
            eq(uploadedAsset.id, input.assetId),
            eq(uploadedAsset.ownerId, input.actor.id),
          ),
    )
    .limit(1);
  if (!asset || asset.deletedAt) {
    throw new ApiError(404, "ASSET_NOT_FOUND", "Yüklenen video bulunamadı.");
  }

  const [command] = await db
    .insert(commandRequest)
    .values({
      userId: input.actor.id,
      uploadedAssetId: asset.id,
      originalInstruction: instruction,
      status: "draft",
    })
    .returning();
  if (!command)
    throw new ApiError(500, "COMMAND_CREATE_FAILED", "Taslak oluşturulamadı.");

  const adapter = getIntentAdapter();
  let modelIntent: ParsedIntent;
  try {
    modelIntent = await adapter.parse({
      instruction,
      asset: {
        id: asset.id,
        originalFileName: asset.originalFileName,
        mimeType: asset.mimeType,
        sizeBytes: asset.sizeBytes,
        durationSeconds: asset.durationSeconds,
      },
    });
  } catch {
    await writeAudit({
      actorId: input.actor.id,
      commandRequestId: command.id,
      eventType: "command.parse_failed",
      payload: { assetId: asset.id, instructionLength: instruction.length },
      requestId: input.requestId,
    });
    throw new ApiError(
      422,
      "INTENT_PARSE_FAILED",
      "Talimat güvenli bir yayın planına dönüştürülemedi. Lütfen daha açık yazın.",
    );
  }

  const resolution = await resolveIntentTargets({
    intent: modelIntent,
    userId: input.actor.id,
    role: input.actor.role,
  });
  const intent: ParsedIntent = {
    ...modelIntent,
    targetGroupIds: resolution.targets
      .filter((target) => target.type === "group")
      .map((target) => target.id),
    targetGroupNames: resolution.targets
      .filter((target) => target.type === "group")
      .map((target) => target.name),
    targetPlayerIds: resolution.playerIds,
    playlistId: resolution.playlist?.id ?? null,
    playlistName: resolution.playlist?.name ?? modelIntent.playlistName,
    ambiguities: resolution.ambiguities,
  };
  const status =
    resolution.ambiguities.length > 0
      ? "needs_clarification"
      : "awaiting_confirmation";

  await db.transaction(async (tx) => {
    await tx.insert(parsedIntent).values({
      commandRequestId: command.id,
      payload: intent,
      model: adapter.model,
      promptVersion: INTENT_PROMPT_VERSION,
    });
    await tx
      .update(commandRequest)
      .set({ status })
      .where(eq(commandRequest.id, command.id));
    await tx.insert(auditEvent).values({
      actorId: input.actor.id,
      commandRequestId: command.id,
      eventType: "command.planned",
      payload: redactForAudit({
        originalInstruction: instruction,
        parsedIntent: intent,
        asset: {
          id: asset.id,
          fileName: asset.originalFileName,
          mimeType: asset.mimeType,
          sizeBytes: asset.sizeBytes,
          checksumSha256: asset.checksumSha256,
        },
      }),
      requestId: input.requestId,
    });
  });

  return toPreview({ commandId: command.id, asset, intent, resolution });
}

export async function getPublicationPreview(input: {
  actor: SessionActor;
  commandId: string;
}): Promise<PublicationPreview> {
  const [row] = await db
    .select({
      command: commandRequest,
      intent: parsedIntent,
      asset: uploadedAsset,
    })
    .from(commandRequest)
    .innerJoin(
      parsedIntent,
      eq(parsedIntent.commandRequestId, commandRequest.id),
    )
    .innerJoin(
      uploadedAsset,
      eq(uploadedAsset.id, commandRequest.uploadedAssetId),
    )
    .where(
      input.actor.role === "admin"
        ? eq(commandRequest.id, input.commandId)
        : and(
            eq(commandRequest.id, input.commandId),
            eq(commandRequest.userId, input.actor.id),
          ),
    )
    .limit(1);
  if (!row)
    throw new ApiError(404, "COMMAND_NOT_FOUND", "Yayın taslağı bulunamadı.");
  const intent = row.intent.payload as ParsedIntent;
  const resolution = await resolveIntentTargets({
    intent,
    userId: input.actor.id,
    role: input.actor.role,
  });
  return toPreview({
    commandId: row.command.id,
    asset: row.asset,
    intent,
    resolution,
  });
}

export async function resolvePublicationAmbiguity(input: {
  actor: SessionActor;
  commandId: string;
  playlistId?: string;
  groupIds?: string[];
  playerIds?: string[];
  requestId: string;
}) {
  const [row] = await db
    .select({ command: commandRequest, intent: parsedIntent })
    .from(commandRequest)
    .innerJoin(
      parsedIntent,
      eq(parsedIntent.commandRequestId, commandRequest.id),
    )
    .where(
      input.actor.role === "admin"
        ? eq(commandRequest.id, input.commandId)
        : and(
            eq(commandRequest.id, input.commandId),
            eq(commandRequest.userId, input.actor.id),
          ),
    )
    .limit(1);
  if (!row)
    throw new ApiError(404, "COMMAND_NOT_FOUND", "Yayın taslağı bulunamadı.");
  if (
    !["needs_clarification", "awaiting_confirmation"].includes(
      row.command.status,
    )
  ) {
    throw new ApiError(
      409,
      "COMMAND_STATE_INVALID",
      "Bu taslak artık değiştirilemez.",
    );
  }

  const current = row.intent.payload as ParsedIntent;
  const candidate: ParsedIntent = {
    ...current,
    playlistId: input.playlistId ?? current.playlistId,
    playlistName: input.playlistId ? null : current.playlistName,
    targetGroupIds: input.groupIds ?? current.targetGroupIds,
    targetGroupNames: input.groupIds ? [] : current.targetGroupNames,
    targetPlayerIds: input.playerIds ?? current.targetPlayerIds,
    targetPlayerNames: input.playerIds ? [] : current.targetPlayerNames,
    ambiguities: [],
  };
  const resolution = await resolveIntentTargets({
    intent: candidate,
    userId: input.actor.id,
    role: input.actor.role,
  });
  const intent: ParsedIntent = {
    ...candidate,
    playlistId: resolution.playlist?.id ?? candidate.playlistId,
    playlistName: resolution.playlist?.name ?? candidate.playlistName,
    targetPlayerIds: resolution.playerIds,
    ambiguities: resolution.ambiguities,
  };
  const status =
    resolution.ambiguities.length === 0
      ? "awaiting_confirmation"
      : "needs_clarification";
  await db.transaction(async (tx) => {
    await tx
      .update(parsedIntent)
      .set({ payload: intent })
      .where(eq(parsedIntent.commandRequestId, input.commandId));
    await tx
      .update(commandRequest)
      .set({ status })
      .where(eq(commandRequest.id, input.commandId));
    await tx.insert(auditEvent).values({
      actorId: input.actor.id,
      commandRequestId: input.commandId,
      eventType: "command.clarified",
      payload: redactForAudit({
        playlistId: input.playlistId,
        groupIds: input.groupIds,
        playerIds: input.playerIds,
        remainingAmbiguities: resolution.ambiguities,
      }),
      requestId: input.requestId,
    });
  });
  return getPublicationPreview({
    actor: input.actor,
    commandId: input.commandId,
  });
}

export async function confirmPublication(input: {
  actor: SessionActor;
  commandId: string;
  idempotencyKey: string;
  requestId: string;
}) {
  if (!/^[A-Za-z0-9:_-]{16,128}$/.test(input.idempotencyKey)) {
    throw new ApiError(
      400,
      "INVALID_IDEMPOTENCY_KEY",
      "Idempotency anahtarı geçerli değil.",
    );
  }

  const [existing] = await db
    .select()
    .from(publicationJob)
    .where(eq(publicationJob.idempotencyKey, input.idempotencyKey))
    .limit(1);
  if (existing) {
    if (existing.commandRequestId !== input.commandId) {
      throw new ApiError(
        409,
        "IDEMPOTENCY_CONFLICT",
        "Bu işlem anahtarı farklı bir yayın için kullanılmış.",
      );
    }
    return existing;
  }

  const preview = await getPublicationPreview({
    actor: input.actor,
    commandId: input.commandId,
  });
  if (!preview.canConfirm || !preview.playlist) {
    throw new ApiError(
      409,
      "PUBLICATION_AMBIGUOUS",
      "Hedef veya playlist belirsizliği çözülmeden yayınlanamaz.",
      { ambiguities: preview.intent.ambiguities },
    );
  }

  const [command] = await db
    .select()
    .from(commandRequest)
    .where(eq(commandRequest.id, input.commandId))
    .limit(1);
  if (!command || command.status !== "awaiting_confirmation") {
    throw new ApiError(
      409,
      "CONFIRMATION_STATE_INVALID",
      "Bu taslak yayınlanmaya hazır değil.",
    );
  }

  const job = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(publicationJob)
      .values({
        commandRequestId: command.id,
        requestedById: command.userId,
        approvedById: input.actor.id,
        idempotencyKey: input.idempotencyKey,
        status: "queued",
      })
      .returning();
    if (!created)
      throw new ApiError(500, "JOB_CREATE_FAILED", "Yayın işi oluşturulamadı.");

    await tx.insert(publicationTarget).values([
      ...preview.targets.map((target) => ({
        publicationJobId: created.id,
        targetType: target.type,
        targetId: target.id,
        targetName: target.name,
        screenCount: target.screenCount,
      })),
      {
        publicationJobId: created.id,
        targetType: "playlist" as const,
        targetId: preview.playlist!.id,
        targetName: preview.playlist!.name,
        screenCount: 0,
      },
    ]);
    await tx
      .update(commandRequest)
      .set({ status: "queued" })
      .where(eq(commandRequest.id, command.id));
    await tx.insert(auditEvent).values({
      actorId: input.actor.id,
      commandRequestId: command.id,
      publicationJobId: created.id,
      eventType: "publication.confirmed",
      payload: {
        idempotencyKey: input.idempotencyKey,
        targets: preview.targets,
        playlist: preview.playlist,
        affectedScreenCount: preview.affectedScreenCount,
      },
      requestId: input.requestId,
    });
    return created;
  });

  try {
    await enqueuePublication(job.id, job.idempotencyKey);
  } catch {
    await db
      .update(publicationJob)
      .set({
        status: "failed",
        lastErrorCode: "QUEUE_UNAVAILABLE",
        safeErrorMessage: "Yayın kuyruğuna şu anda ulaşılamıyor.",
        completedAt: new Date(),
      })
      .where(eq(publicationJob.id, job.id));
    throw new ApiError(
      503,
      "QUEUE_UNAVAILABLE",
      "Yayın kuyruğu şu anda hazır değil.",
    );
  }
  return job;
}

export async function listPublicationJobs(actor: SessionActor, limit = 50) {
  return db
    .select({
      job: publicationJob,
      command: commandRequest,
      asset: uploadedAsset,
    })
    .from(publicationJob)
    .innerJoin(
      commandRequest,
      eq(commandRequest.id, publicationJob.commandRequestId),
    )
    .innerJoin(
      uploadedAsset,
      eq(uploadedAsset.id, commandRequest.uploadedAssetId),
    )
    .where(
      actor.role === "admin" ? undefined : eq(commandRequest.userId, actor.id),
    )
    .orderBy(desc(publicationJob.createdAt))
    .limit(Math.min(limit, 100));
}
