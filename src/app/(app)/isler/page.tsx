import { JobsTable } from "@/components/jobs-table";
import { PageHeader } from "@/components/page-header";
import { isAppRole } from "@/lib/auth/permissions";
import { requirePageSession } from "@/lib/auth/session";
import { listPublicationJobs } from "@/services/publication-planner";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
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
  return (
    <>
      <PageHeader
        eyebrow="Yayın kuyruğu"
        title="Yayın işleri"
        description="Sıradaki, devam eden ve tamamlanan Navori yayınlarını takip edin."
      />
      <section className="card overflow-hidden">
        <JobsTable rows={rows} />
      </section>
    </>
  );
}
