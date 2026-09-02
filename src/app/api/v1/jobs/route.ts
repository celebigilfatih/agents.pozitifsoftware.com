import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { apiErrorResponse, requireApiActor } from "@/lib/api";
import { listPublicationJobs } from "@/services/publication-planner";

export async function GET(request: Request) {
  const requestId = randomUUID();
  try {
    const actor = await requireApiActor(request, "viewHistory");
    const rows = await listPublicationJobs(actor);
    return NextResponse.json({ data: rows, requestId });
  } catch (error) {
    return apiErrorResponse(error, requestId);
  }
}
