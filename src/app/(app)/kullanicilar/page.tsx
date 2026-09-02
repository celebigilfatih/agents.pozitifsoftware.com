import { asc } from "drizzle-orm";

import { PageHeader } from "@/components/page-header";
import { UsersManager } from "@/components/users-manager";
import { db } from "@/db";
import { user } from "@/db/schema";
import { getNavoriAdapter } from "@/integrations/navori";
import { requirePagePermission } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  await requirePagePermission("manageUsers");
  const adapter = getNavoriAdapter();
  const [users, groups, players, playlists] = await Promise.all([
    db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        banned: user.banned,
      })
      .from(user)
      .orderBy(asc(user.name)),
    adapter.getGroups(),
    adapter.getPlayers(),
    adapter.getPlaylists(),
  ]);
  return (
    <>
      <PageHeader
        eyebrow="Erişim yönetimi"
        title="Kullanıcılar"
        description="Rolleri ve Navori hedef kapsamlarını en az yetki ilkesiyle yönetin."
      />
      <UsersManager
        initialUsers={users}
        catalog={{ groups, players, playlists }}
      />
    </>
  );
}
