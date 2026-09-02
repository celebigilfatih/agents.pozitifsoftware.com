import { randomUUID } from "node:crypto";

import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { uploadedAsset } from "@/db/schema";
import { env } from "@/env";
import {
  apiErrorResponse,
  applyRateLimit,
  assertSameOrigin,
  requireApiActor,
} from "@/lib/api";
import { writeAudit } from "@/lib/audit";
import { persistUpload } from "@/storage/uploads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = randomUUID();
  try {
    const actor = await requireApiActor(request, "upload");
    const rows = await db
      .select({
        id: uploadedAsset.id,
        originalFileName: uploadedAsset.originalFileName,
        mimeType: uploadedAsset.mimeType,
        sizeBytes: uploadedAsset.sizeBytes,
        checksumSha256: uploadedAsset.checksumSha256,
        durationSeconds: uploadedAsset.durationSeconds,
        status: uploadedAsset.status,
        createdAt: uploadedAsset.createdAt,
      })
      .from(uploadedAsset)
      .where(
        actor.role === "admin"
          ? undefined
          : eq(uploadedAsset.ownerId, actor.id),
      )
      .orderBy(desc(uploadedAsset.createdAt))
      .limit(50);
    return NextResponse.json({ data: rows, requestId });
  } catch (error) {
    return apiErrorResponse(error, requestId);
  }
}

export async function POST(request: Request) {
  const requestId = randomUUID();
  try {
    assertSameOrigin(request);
    const actor = await requireApiActor(request, "upload");
    applyRateLimit(`upload:${actor.id}`, 12, 60 * 60_000);
    const mimeType =
      request.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
    const encodedName = request.headers.get("x-file-name") ?? "video";
    let originalFileName = "video";
    try {
      originalFileName = decodeURIComponent(encodedName);
    } catch {
      originalFileName = encodedName;
    }
    const contentLengthHeader = request.headers.get("content-length");
    const contentLength = contentLengthHeader
      ? Number(contentLengthHeader)
      : null;
    const durationHeader = request.headers.get("x-video-duration");
    const durationSeconds = durationHeader
      ? Math.round(Number(durationHeader))
      : null;
    const stored = await persistUpload({
      body: request.body,
      mimeType,
      originalFileName,
      contentLength: Number.isFinite(contentLength) ? contentLength : null,
    });
    const [asset] = await db
      .insert(uploadedAsset)
      .values({
        ownerId: actor.id,
        originalFileName: stored.originalFileName,
        storageKey: stored.storageKey,
        mimeType,
        sizeBytes: stored.sizeBytes,
        checksumSha256: stored.checksumSha256,
        durationSeconds:
          durationSeconds !== null &&
          Number.isFinite(durationSeconds) &&
          durationSeconds >= 0
            ? durationSeconds
            : null,
        expiresAt: new Date(
          Date.now() + env.UPLOAD_RETENTION_HOURS * 60 * 60_000,
        ),
      })
      .returning();
    if (!asset) throw new Error("Asset insert failed");
    await writeAudit({
      actorId: actor.id,
      eventType: "asset.uploaded",
      payload: {
        assetId: asset.id,
        fileName: asset.originalFileName,
        mimeType: asset.mimeType,
        sizeBytes: asset.sizeBytes,
        checksumSha256: asset.checksumSha256,
      },
      requestId,
    });
    return NextResponse.json(
      {
        data: {
          id: asset.id,
          originalFileName: asset.originalFileName,
          mimeType: asset.mimeType,
          sizeBytes: asset.sizeBytes,
          checksumSha256: asset.checksumSha256,
          durationSeconds: asset.durationSeconds,
          expiresAt: asset.expiresAt,
        },
        requestId,
      },
      { status: 201 },
    );
  } catch (error) {
    return apiErrorResponse(error, requestId);
  }
}
