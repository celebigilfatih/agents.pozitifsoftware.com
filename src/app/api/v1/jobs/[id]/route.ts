import { randomUUID } from "node:crypto";

import { and, asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import {
  auditEvent,
  commandRequest,
  parsedIntent,
  publicationJob,
  publicationTarget,
  uploadedAsset,
} from "@/db/schema";
import { ApiError, apiErrorResponse, requireApiActor } from "@/lib/api";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const requestId = randomUUID();
  try {
    const actor = await requireApiActor(request, "viewHistory");
    const { id } = await context.params;
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
      .where(
        actor.role === "admin"
          ? eq(publicationJob.id, id)
          : and(eq(publicationJob.id, id), eq(commandRequest.userId, actor.id)),
      )
      .limit(1);
    if (!row) throw new ApiError(404, "JOB_NOT_FOUND", "Yayın işi bulunamadı.");
    const [targets, events] = await Promise.all([
      db
        .select()
        .from(publicationTarget)
        .where(eq(publicationTarget.publicationJobId, id)),
      db
        .select()
        .from(auditEvent)
        .where(eq(auditEvent.publicationJobId, id))
        .orderBy(asc(auditEvent.createdAt)),
    ]);
    return NextResponse.json({
      data: { ...row, targets, auditEvents: events },
      requestId,
    });
  } catch (error) {
    return apiErrorResponse(error, requestId);
  }
}
