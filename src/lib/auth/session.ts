import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import {
  hasPermission,
  isAppRole,
  type AppPermission,
  type AppRole,
} from "@/lib/auth/permissions";

export async function getServerSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requirePageSession() {
  const session = await getServerSession();
  if (!session) redirect("/giris");
  return session;
}

export async function requirePagePermission(permission: AppPermission) {
  const session = await requirePageSession();
  const role = isAppRole(session.user.role) ? session.user.role : "viewer";
  if (!hasPermission(role, permission)) redirect("/yetkisiz");
  return { ...session, role };
}

export type SessionActor = {
  id: string;
  name: string;
  email: string;
  role: AppRole;
};

export async function getSessionActor(
  requestHeaders: Headers,
): Promise<SessionActor | null> {
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) return null;
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: isAppRole(session.user.role) ? session.user.role : "viewer",
  };
}
