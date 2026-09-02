import { Database, HardDrive, KeyRound, PlugZap } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { pool } from "@/db";
import { env } from "@/env";
import { getNavoriAdapter } from "@/integrations/navori";
import { requirePagePermission } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  await requirePagePermission("manageIntegrations");
  let database = { ready: true, message: "Bağlantı hazır" };
  try {
    await pool.query("select 1");
  } catch {
    database = { ready: false, message: "Bağlantı kurulamadı" };
  }
  let navori: { ready: boolean; mode: string; message: string };
  try {
    navori = await getNavoriAdapter().readiness();
  } catch {
    navori = {
      ready: false,
      mode: env.NAVORI_API_ENABLED ? "real" : "mock",
      message: "Navori doğrulaması başarısız",
    };
  }
  const cards = [
    {
      title: "Navori QL",
      icon: PlugZap,
      ready: navori.ready,
      mode: navori.mode,
      message: navori.message,
    },
    {
      title: "OpenAI Responses API",
      icon: KeyRound,
      ready: env.OPENAI_API_ENABLED ? Boolean(env.OPENAI_API_KEY) : true,
      mode: env.OPENAI_API_ENABLED ? "Gerçek" : "Mock",
      message: env.OPENAI_API_ENABLED
        ? env.OPENAI_API_KEY
          ? "API anahtarı yerel ortamda hazır"
          : "API anahtarı eksik"
        : "Deterministik intent ayrıştırıcı etkin",
    },
    {
      title: "PostgreSQL",
      icon: Database,
      ready: database.ready,
      mode: "PostgreSQL",
      message: database.message,
    },
    {
      title: "Geçici video deposu",
      icon: HardDrive,
      ready: true,
      mode: `${env.UPLOAD_RETENTION_HOURS} saat`,
      message: `Dosya başına en fazla ${env.MAX_UPLOAD_SIZE_MB} MB`,
    },
  ];
  return (
    <>
      <PageHeader
        eyebrow="Sistem sağlığı"
        title="Entegrasyonlar"
        description="Dış servislerin çalışma modunu ve bağlantı durumunu sırları göstermeden izleyin."
      />
      <div className="grid gap-5 md:grid-cols-2">
        {cards.map(({ title, icon: Icon, ready, mode, message }) => (
          <section key={title} className="card p-6">
            <div className="flex items-start justify-between">
              <span className="grid size-12 place-items-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]">
                <Icon size={22} />
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-bold ${ready ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
              >
                {ready ? "Hazır" : "Dikkat"}
              </span>
            </div>
            <h2 className="mt-5 text-lg font-black">{title}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">{message}</p>
            <div className="mt-5 border-t border-[var(--line)] pt-4 text-xs font-bold tracking-wide text-[var(--muted)] uppercase">
              Mod: <span className="text-[var(--ink)]">{mode}</span>
            </div>
          </section>
        ))}
      </div>
      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
        <strong>Güvenlik notu:</strong> Bu ekran kimlik bilgilerini, API
        anahtarlarını veya Navori parolasını hiçbir zaman göstermez.
      </div>
    </>
  );
}
