import { desc, eq } from "drizzle-orm";
import { ScrollText } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { db } from "@/db";
import { auditEvent } from "@/db/schema";
import { formatDate } from "@/lib/format";
import { isAppRole } from "@/lib/auth/permissions";
import { requirePageSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
const eventLabels: Record<string, string> = {
  "asset.uploaded": "Video yüklendi",
  "command.planned": "Yayın planı oluşturuldu",
  "command.clarified": "Belirsizlik çözüldü",
  "publication.confirmed": "Yayın onaylandı",
  "publication.started": "Yayın işlemi başladı",
  "publication.completed": "Yayın tamamlandı",
  "publication.failed": "Yayın başarısız oldu",
  "user.created": "Kullanıcı oluşturuldu",
  "user.role_changed": "Kullanıcı rolü değişti",
  "user.targets_changed": "Hedef yetkileri değişti",
};

export default async function HistoryPage() {
  const session = await requirePageSession();
  const role = isAppRole(session.user.role) ? session.user.role : "viewer";
  const rows =
    role === "admin"
      ? await db
          .select()
          .from(auditEvent)
          .orderBy(desc(auditEvent.createdAt))
          .limit(100)
      : await db
          .select()
          .from(auditEvent)
          .where(eq(auditEvent.actorId, session.user.id))
          .orderBy(desc(auditEvent.createdAt))
          .limit(100);
  return (
    <>
      <PageHeader
        eyebrow="Denetim izi"
        title="İşlem geçmişi"
        description="Kritik kullanıcı ve yayın hareketlerinin değiştirilemez uygulama kaydı."
      />
      <section className="card overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title="Henüz kayıt yok"
            description="Yayın ve yönetim hareketleri burada zaman sırasıyla görünür."
          />
        ) : (
          <div className="divide-y divide-[var(--line)]">
            {rows.map((row) => (
              <div key={row.id} className="flex items-start gap-4 p-5">
                <span className="mt-1 size-2.5 shrink-0 rounded-full bg-[var(--brand)] ring-4 ring-emerald-50" />
                <div className="min-w-0 flex-1">
                  <strong className="block text-sm">
                    {eventLabels[row.eventType] ?? row.eventType}
                  </strong>
                  <span className="mt-1 block text-xs text-[var(--muted)]">
                    {formatDate(row.createdAt)} · İstek:{" "}
                    {row.requestId?.slice(0, 8) ?? "sistem"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
