import { PageHeader } from "@/components/page-header";
import { PublicationWizard } from "@/components/publication-wizard";
import { requirePagePermission } from "@/lib/auth/session";

export default async function NewPublicationPage() {
  const session = await requirePagePermission("preparePublication");
  return (
    <>
      <PageHeader
        eyebrow="Kontrollü yayın"
        title="Yeni yayın oluştur"
        description="Videoyu yükleyin, talimatı yazın ve Navori’ye gitmeden önce oluşan planı doğrulayın."
      />
      <PublicationWizard
        canPublish={session.role === "admin" || session.role === "publisher"}
      />
    </>
  );
}
