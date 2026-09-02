import {
  Activity,
  CheckCircle2,
  Clock3,
  Plus,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";

import { JobsTable } from "@/components/jobs-table";
import { PageHeader } from "@/components/page-header";
import { isAppRole } from "@/lib/auth/permissions";
import { requirePageSession } from "@/lib/auth/session";
import { listPublicationJobs } from "@/services/publication-planner";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requirePageSession();
  const role = isAppRole(session.user.role) ? session.user.role : "viewer";
  const rows = await listPublicationJobs(
    {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role,
    },
    100,
  );
  const completed = rows.filter((row) => row.job.status === "completed").length;
  const active = rows.filter((row) =>
    ["queued", "uploading", "updating_playlist", "publishing"].includes(
      row.job.status,
    ),
  ).length;
  const failed = rows.filter((row) => row.job.status === "failed").length;
  const canPrepare = role !== "viewer";
  const stats = [
    {
      label: "Toplam yayın",
      value: rows.length,
      icon: Activity,
      tone: "bg-slate-100 text-slate-700",
    },
    {
      label: "Aktif işlem",
      value: active,
      icon: Clock3,
      tone: "bg-blue-50 text-blue-700",
    },
    {
      label: "Tamamlanan",
      value: completed,
      icon: CheckCircle2,
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Dikkat gereken",
      value: failed,
      icon: TriangleAlert,
      tone: "bg-red-50 text-red-700",
    },
  ];
  return (
    <>
      <PageHeader
        eyebrow="Operasyon merkezi"
        title={`Merhaba, ${session.user.name.split(" ")[0]}`}
        description="Yayın operasyonunun son durumunu ve bekleyen işleri tek bakışta görün."
        action={
          canPrepare ? (
            <Link href="/yeni-yayin" className="btn-primary">
              <Plus size={18} /> Yeni yayın oluştur
            </Link>
          ) : undefined
        }
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[var(--muted)]">
                {label}
              </span>
              <span
                className={`grid size-10 place-items-center rounded-xl ${tone}`}
              >
                <Icon size={19} />
              </span>
            </div>
            <strong className="mt-5 block text-3xl font-black">{value}</strong>
          </div>
        ))}
      </section>
      <section className="card mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
          <div>
            <h2 className="font-black">Son yayın işleri</h2>
            <p className="text-sm text-[var(--muted)]">
              En son oluşturulan beş işlem
            </p>
          </div>
          <Link href="/isler" className="text-sm font-bold text-[var(--brand)]">
            Tümünü gör
          </Link>
        </div>
        <JobsTable rows={rows.slice(0, 5)} />
      </section>
    </>
  );
}
