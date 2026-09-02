import { and, asc, eq } from "drizzle-orm";
import {
  ArrowLeft,
  FileVideo,
  ListVideo,
  Monitor,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { db } from "@/db";
import {
  auditEvent,
  commandRequest,
  parsedIntent,
  publicationJob,
  publicationTarget,
  uploadedAsset,
} from "@/db/schema";
import type { ParsedIntent } from "@/domain/intent";
import { formatBytes, formatDate } from "@/lib/format";
import { isAppRole } from "@/lib/auth/permissions";
import { requirePageSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requirePageSession();
  const role = isAppRole(session.user.role) ? session.user.role : "viewer";
  const { id } = await params;
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
      role === "admin"
        ? eq(publicationJob.id, id)
        : and(
            eq(publicationJob.id, id),
            eq(commandRequest.userId, session.user.id),
          ),
    )
    .limit(1);
  if (!row) notFound();
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
  const intent = row.intent.payload as ParsedIntent;
  const playlist = targets.find((target) => target.targetType === "playlist");
  const destinations = targets.filter(
    (target) => target.targetType !== "playlist",
  );
  return (
    <>
      <Link
        href="/isler"
        className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-[var(--muted)] hover:text-[var(--ink)]"
      >
        <ArrowLeft size={16} /> Yayın işlerine dön
      </Link>
      <PageHeader
        eyebrow={`İş #${id.slice(0, 8)}`}
        title={row.asset.originalFileName}
        description={row.command.originalInstruction}
        action={<StatusBadge status={row.job.status} />}
      />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <div className="space-y-6">
          <section className="card p-5 sm:p-6">
            <h2 className="font-black">Yayın özeti</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Detail
                icon={FileVideo}
                label="Video"
                value={`${row.asset.originalFileName} · ${formatBytes(row.asset.sizeBytes)}`}
              />
              <Detail
                icon={ListVideo}
                label="Playlist"
                value={playlist?.targetName ?? "—"}
              />
              <Detail
                icon={Monitor}
                label="Hedefler"
                value={
                  destinations.map((target) => target.targetName).join(", ") ||
                  "—"
                }
              />
              <Detail
                icon={ShieldCheck}
                label="Yayın modu"
                value={
                  intent.publishMode === "asap"
                    ? "Hemen yayınla"
                    : intent.publishMode
                }
              />
            </div>
            {row.job.safeErrorMessage && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {row.job.safeErrorMessage}
              </div>
            )}
          </section>
          <section className="card p-5 sm:p-6">
            <h2 className="font-black">Teknik bilgiler</h2>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <Meta label="SHA-256" value={row.asset.checksumSha256} mono />
              <Meta
                label="Tekrar sayısı"
                value={`${row.job.retryCount} / ${row.job.maxRetries}`}
              />
              <Meta label="Oluşturulma" value={formatDate(row.job.createdAt)} />
              <Meta
                label="Tamamlanma"
                value={
                  row.job.completedAt ? formatDate(row.job.completedAt) : "—"
                }
              />
            </dl>
          </section>
        </div>
        <section className="card p-5 sm:p-6">
          <h2 className="font-black">İşlem zaman çizelgesi</h2>
          <div className="mt-6 space-y-0">
            {events.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">Henüz iş olayı yok.</p>
            ) : (
              events.map((event, index) => (
                <div
                  key={event.id}
                  className="relative flex gap-4 pb-7 last:pb-0"
                >
                  {index < events.length - 1 && (
                    <span className="absolute top-4 left-[5px] h-full w-px bg-[var(--line)]" />
                  )}
                  <span className="relative mt-1 size-3 shrink-0 rounded-full bg-[var(--brand)] ring-4 ring-emerald-50" />
                  <div>
                    <strong className="block text-sm">{event.eventType}</strong>
                    <span className="mt-1 block text-xs text-[var(--muted)]">
                      {formatDate(event.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileVideo;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--paper)] p-4">
      <span className="flex items-center gap-2 text-xs font-bold tracking-wide text-[var(--muted)] uppercase">
        <Icon size={15} /> {label}
      </span>
      <strong className="mt-2 block text-sm leading-6">{value}</strong>
    </div>
  );
}
function Meta({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs font-bold tracking-wide text-[var(--muted)] uppercase">
        {label}
      </dt>
      <dd
        className={`mt-1 break-all ${mono ? "font-mono text-xs" : "font-semibold"}`}
      >
        {value}
      </dd>
    </div>
  );
}
