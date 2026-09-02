import { randomUUID } from "node:crypto";

import { isNull } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db, pool } from "@/db";
import { uploadedAsset } from "@/db/schema";
import { env } from "@/env";
import { getNavoriAdapter } from "@/integrations/navori";
import { apiErrorResponse, requireApiActor } from "@/lib/api";
import { uploadDiskUsage } from "@/storage/uploads";

export async function GET(request: Request) {
  const requestId = randomUUID();
  try {
    await requireApiActor(request, "viewHistory");
    const startedAt = Date.now();
    await pool.query("select 1");
    const navori = await getNavoriAdapter().readiness();
    const assets = await db
      .select({ storageKey: uploadedAsset.storageKey })
      .from(uploadedAsset)
      .where(isNull(uploadedAsset.deletedAt));
    const diskUsageBytes = await uploadDiskUsage(
      assets.map((asset) => asset.storageKey),
    );
    return NextResponse.json({
      data: {
        navori,
        openai: {
          ready: env.OPENAI_API_ENABLED ? Boolean(env.OPENAI_API_KEY) : true,
          mode: env.OPENAI_API_ENABLED ? "real" : "mock",
          message: env.OPENAI_API_ENABLED
            ? "OpenAI Responses API etkin"
            : "Deterministik mock intent modu etkin",
        },
        database: { ready: true, latencyMs: Date.now() - startedAt },
        uploads: {
          diskUsageBytes,
          retentionHours: env.UPLOAD_RETENTION_HOURS,
          maxUploadSizeMb: env.MAX_UPLOAD_SIZE_MB,
        },
      },
      requestId,
    });
  } catch (error) {
    return apiErrorResponse(error, requestId);
  }
}
