import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { apiErrorResponse, assertSameOrigin, requireApiActor } from "@/lib/api";
import { resolvePublicationAmbiguity } from "@/services/publication-planner";

const bodySchema = z.object({
  playlistId: z.string().min(1).optional(),
  groupIds: z.array(z.string().min(1)).max(20).optional(),
  playerIds: z.array(z.string().min(1)).max(100).optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const requestId = randomUUID();
  try {
    assertSameOrigin(request);
    const actor = await requireApiActor(request, "preparePublication");
    const body = bodySchema.parse(await request.json());
    const { id } = await context.params;
    const preview = await resolvePublicationAmbiguity({
      actor,
      commandId: id,
      ...body,
      requestId,
    });
    return NextResponse.json({ data: preview, requestId });
  } catch (error) {
    return apiErrorResponse(error, requestId);
  }
}
