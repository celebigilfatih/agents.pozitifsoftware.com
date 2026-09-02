import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import {
  ApiError,
  apiErrorResponse,
  assertSameOrigin,
  requireApiActor,
} from "@/lib/api";
import { confirmPublication } from "@/services/publication-planner";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const requestId = randomUUID();
  try {
    assertSameOrigin(request);
    const actor = await requireApiActor(request, "publish");
    const idempotencyKey = request.headers.get("idempotency-key");
    if (!idempotencyKey) {
      throw new ApiError(
        400,
        "IDEMPOTENCY_KEY_REQUIRED",
        "Yayın onayı için işlem anahtarı zorunludur.",
      );
    }
    const { id } = await context.params;
    const job = await confirmPublication({
      actor,
      commandId: id,
      idempotencyKey,
      requestId,
    });
    return NextResponse.json({ data: job, requestId }, { status: 202 });
  } catch (error) {
    return apiErrorResponse(error, requestId);
  }
}
