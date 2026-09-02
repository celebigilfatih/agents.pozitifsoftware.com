import { AppShell } from "@/components/app-shell";
import { isAppRole } from "@/lib/auth/permissions";
import { requirePageSession } from "@/lib/auth/session";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requirePageSession();
  return (
    <AppShell
      user={{
        name: session.user.name,
        email: session.user.email,
        role: isAppRole(session.user.role) ? session.user.role : "viewer",
      }}
    >
      {children}
    </AppShell>
  );
}
