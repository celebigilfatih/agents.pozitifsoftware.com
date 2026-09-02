import { db } from "@/db";
import { auditEvent } from "@/db/schema";

const blockedKeys = /password|secret|token|authorization|cookie|api[-_]?key/i;

export function redactForAudit(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactForAudit);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        blockedKeys.test(key) ? "[REDACTED]" : redactForAudit(item),
      ]),
    );
  }
  return value;
}

export async function writeAudit(input: {
  actorId?: string | null;
  commandRequestId?: string | null;
  publicationJobId?: string | null;
  eventType: string;
  payload?: unknown;
  requestId?: string | null;
}) {
  await db.insert(auditEvent).values({
    actorId: input.actorId ?? null,
    commandRequestId: input.commandRequestId ?? null,
    publicationJobId: input.publicationJobId ?? null,
    eventType: input.eventType,
    payload: redactForAudit(input.payload ?? {}),
    requestId: input.requestId ?? null,
  });
}
