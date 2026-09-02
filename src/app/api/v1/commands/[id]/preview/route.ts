import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { apiErrorResponse, requireApiActor } from "@/lib/api";
import { getPublicationPreview } from "@/services/publication-planner";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const requestId = randomUUID();
  try {
    const actor = await requireApiActor(request, "preparePublication");
    const { id } = await context.params;
    const preview = await getPublicationPreview({ actor, commandId: id });
    return NextResponse.json({ data: preview, requestId });
  } catch (error) {
    return apiErrorResponse(error, requestId);
  }
}
