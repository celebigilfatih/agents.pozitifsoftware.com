import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import {
  auditEvent,
  commandRequest,
  parsedIntent,
  publicationJob,
  publicationTarget,
  uploadedAsset,
} from "@/db/schema";
import type { ParsedIntent } from "@/domain/intent";
import { classifyIntegrationError } from "@/domain/retry";
import { getNavoriAdapter, type NavoriAdapter } from "@/integrations/navori";
import { redactForAudit } from "@/lib/audit";
import { deleteUpload, resolveUploadPath } from "@/storage/uploads";

async function setJobStatus(
  jobId: string,
  status: "uploading" | "updating_playlist" | "publishing",
  actorId: string,
) {
  await db.transaction(async (tx) => {
    await tx
      .update(publicationJob)
      .set({
        status,
        startedAt: status === "uploading" ? new Date() : undefined,
      })
      .where(eq(publicationJob.id, jobId));
    await tx.insert(auditEvent).values({
      actorId,
      publicationJobId: jobId,
      eventType: `publication.${status}`,
      payload: { status },
    });
  });
}

export async function processPublicationJob(
  jobId: string,
  retryCount = 0,
  adapter: NavoriAdapter = getNavoriAdapter(),
) {
  const [row] = await db
    .select({
      job: publicationJob,
      command: commandRequest,
      intent: parsedIntent,
      asset: uploadedAsset,
    })
    .from(publicationJob)
    .innerJoin(
      commandRequest,
      eq(commandRequest.id, publicationJob.commandRequestId),
    )
    .innerJoin(
      parsedIntent,
      eq(parsedIntent.commandRequestId, commandRequest.id),
    )
    .innerJoin(
      uploadedAsset,
      eq(uploadedAsset.id, commandRequest.uploadedAssetId),
    )
    .where(eq(publicationJob.id, jobId))
    .limit(1);

  if (!row) throw new Error("Publication job not found");
  if (["completed", "cancelled"].includes(row.job.status)) return row.job;
  if (!row.job.approvedAt || !row.job.approvedById) {
    throw new Error("Publication job has no explicit approval");
  }

  const targets = await db
    .select()
    .from(publicationTarget)
    .where(eq(publicationTarget.publicationJobId, jobId));
  const playlistTarget = targets.find(
    (target) => target.targetType === "playlist",
  );
  const intent = row.intent.payload as ParsedIntent;
  const currentRetryCount = Math.max(retryCount, row.job.retryCount);
  if (!playlistTarget || intent.targetPlayerIds.length === 0) {
    throw new Error("Publication targets are incomplete");
  }

  try {
    const playlists = await adapter.getPlaylists();
    const playlist = playlists.find(
      (item) => item.id === playlistTarget.targetId,
    );
    if (!playlist) throw new Error("Playlist no longer exists");

    await setJobStatus(jobId, "uploading", row.job.approvedById);
    const media = await adapter.uploadMedia({
      filePath: resolveUploadPath(row.asset.storageKey),
      fileName: row.asset.originalFileName,
      sizeBytes: row.asset.sizeBytes,
      groupId: playlist.groupId,
      assetId: row.asset.id,
    });

    await setJobStatus(jobId, "updating_playlist", row.job.approvedById);
    const playlistResult = await adapter.appendMediaToPlaylist({
      playlistId: playlist.id,
      mediaId: media.id,
    });

    await setJobStatus(jobId, "publishing", row.job.approvedById);
    const result = await adapter.publishContent({
      playerIds: intent.targetPlayerIds,
      scheduledAt: intent.requestedSchedule,
    });

    await db.transaction(async (tx) => {
      await tx
        .update(publicationJob)
        .set({
          status: "completed",
          retryCount: currentRetryCount,
          navoriResult: redactForAudit({
            ...result,
            mediaId: media.id,
            playlistId: playlist.id,
            playlistContentCount: playlistResult.contentCount,
          }),
          completedAt: new Date(),
          safeErrorMessage: null,
          lastErrorCode: null,
        })
        .where(eq(publicationJob.id, jobId));
      await tx
        .update(uploadedAsset)
        .set({ status: "transferred", deletedAt: new Date() })
        .where(eq(uploadedAsset.id, row.asset.id));
      await tx.insert(auditEvent).values({
        actorId: row.job.approvedById,
        commandRequestId: row.command.id,
        publicationJobId: jobId,
        eventType: "publication.completed",
        payload: redactForAudit({
          result,
          retryCount: currentRetryCount,
          mediaId: media.id,
          playlistId: playlist.id,
          checksumSha256: row.asset.checksumSha256,
        }),
      });
    });
    await deleteUpload(row.asset.storageKey).catch(() => undefined);
    return { ...row.job, status: "completed" as const, navoriResult: result };
  } catch (error) {
    const decision = classifyIntegrationError(error);
    const nextRetryCount = currentRetryCount + 1;
    const exhausted = nextRetryCount >= row.job.maxRetries;
    await db.transaction(async (tx) => {
      await tx
        .update(publicationJob)
        .set({
          status: decision.retryable && !exhausted ? "queued" : "failed",
          retryCount: nextRetryCount,
          lastErrorCode: decision.code,
          safeErrorMessage: decision.safeMessage,
          completedAt: decision.retryable && !exhausted ? null : new Date(),
        })
        .where(eq(publicationJob.id, jobId));
      await tx.insert(auditEvent).values({
        actorId: row.job.approvedById,
        commandRequestId: row.command.id,
        publicationJobId: jobId,
        eventType:
          decision.retryable && !exhausted
            ? "publication.retry_scheduled"
            : "publication.failed",
        payload: {
          errorCode: decision.code,
          safeMessage: decision.safeMessage,
          retryCount: nextRetryCount,
          retryable: decision.retryable && !exhausted,
        },
      });
    });
    if (decision.retryable && !exhausted) throw error;
    return { ...row.job, status: "failed" as const };
  }
}

export async function cleanupExpiredUploads(now = new Date()) {
  const expired = await db
    .select()
    .from(uploadedAsset)
    .where(
      and(
        isNull(uploadedAsset.deletedAt),
        eq(uploadedAsset.status, "uploaded"),
      ),
    );
  const candidates = expired.filter((asset) => asset.expiresAt <= now);
  let deleted = 0;
  for (const asset of candidates) {
    const removed = await deleteUpload(asset.storageKey).catch(() => false);
    await db
      .update(uploadedAsset)
      .set({ status: "expired", deletedAt: new Date() })
      .where(eq(uploadedAsset.id, asset.id));
    await db.insert(auditEvent).values({
      actorId: asset.ownerId,
      eventType: "asset.expired",
      payload: {
        assetId: asset.id,
        checksumSha256: asset.checksumSha256,
        removed,
      },
    });
    if (removed) deleted += 1;
  }
  return { examined: candidates.length, deleted };
}
