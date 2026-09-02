import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { env } from "@/env";
import type { AppPermission } from "@/lib/auth/permissions";
import { hasPermission } from "@/lib/auth/permissions";
import { getSessionActor, type SessionActor } from "@/lib/auth/session";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    public readonly safeMessage: string,
    public readonly details?: unknown,
  ) {
    super(safeMessage);
    this.name = "ApiError";
  }
}

export function apiErrorResponse(
  error: unknown,
  requestId: string = randomUUID(),
) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        code: error.code,
        message: error.safeMessage,
        ...(error.details === undefined ? {} : { details: error.details }),
        requestId,
      },
      { status: error.status },
    );
  }
  return NextResponse.json(
    {
      code: "INTERNAL_ERROR",
      message: "İşlem tamamlanamadı. Lütfen tekrar deneyin.",
      requestId,
    },
    { status: 500 },
  );
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const allowedHosts = new Set([
    new URL(env.APP_URL).host,
    new URL(request.url).host,
    request.headers.get("host"),
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim(),
  ]);
  if (!allowedHosts.has(new URL(origin).host)) {
    throw new ApiError(403, "ORIGIN_REJECTED", "İstek kaynağı doğrulanamadı.");
  }
}

export async function requireApiActor(
  request: Request,
  permission?: AppPermission,
): Promise<SessionActor> {
  const actor = await getSessionActor(request.headers);
  if (!actor) {
    throw new ApiError(
      401,
      "AUTH_REQUIRED",
      "Bu işlem için giriş yapmalısınız.",
    );
  }
  if (permission && !hasPermission(actor.role, permission)) {
    throw new ApiError(403, "PERMISSION_DENIED", "Bu işlem için yetkiniz yok.");
  }
  return actor;
}

type RateBucket = { count: number; resetsAt: number };
const buckets = new Map<string, RateBucket>();

export function applyRateLimit(key: string, max: number, windowMs = 60_000) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetsAt <= now) {
    buckets.set(key, { count: 1, resetsAt: now + windowMs });
    return;
  }
  current.count += 1;
  if (current.count > max) {
    throw new ApiError(
      429,
      "RATE_LIMITED",
      "Çok fazla istek gönderildi. Kısa süre sonra tekrar deneyin.",
    );
  }
}
