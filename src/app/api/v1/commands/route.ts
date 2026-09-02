import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import {
  apiErrorResponse,
  applyRateLimit,
  assertSameOrigin,
  requireApiActor,
} from "@/lib/api";
import { createPublicationPlan } from "@/services/publication-planner";

const bodySchema = z.object({
  assetId: z.uuid(),
  instruction: z.string().min(8).max(2_000),
});

export async function POST(request: Request) {
  const requestId = randomUUID();
  try {
    assertSameOrigin(request);
    const actor = await requireApiActor(request, "preparePublication");
    applyRateLimit(`command:${actor.id}`, 30);
    const body = bodySchema.parse(await request.json());
    const preview = await createPublicationPlan({ actor, ...body, requestId });
    return NextResponse.json({ data: preview, requestId }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error, requestId);
  }
}
