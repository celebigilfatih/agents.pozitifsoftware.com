"use client";

import {
  Activity,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  PlugZap,
  Send,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";
import type { AppRole } from "@/lib/auth/permissions";

const roleLabels: Record<AppRole, string> = {
  admin: "Yönetici",
  publisher: "Yayıncı",
  uploader: "Yükleyici",
  viewer: "İzleyici",
};

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { name: string; email: string; role: AppRole };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const canPrepare = user.role !== "viewer";
  const items = [
    {
      href: "/dashboard",
      label: "Genel bakış",
      icon: LayoutDashboard,
      show: true,
    },
    { href: "/yeni-yayin", label: "Yeni yayın", icon: Send, show: canPrepare },
    { href: "/isler", label: "Yayın işleri", icon: Activity, show: true },
    { href: "/gecmis", label: "İşlem geçmişi", icon: History, show: true },
    {
      href: "/kullanicilar",
      label: "Kullanıcılar",
      icon: Users,
      show: user.role === "admin",
    },
    {
      href: "/entegrasyonlar",
      label: "Entegrasyonlar",
      icon: PlugZap,
      show: user.role === "admin",
    },
  ].filter((item) => item.show);

  async function signOut() {
    await authClient.signOut();
    router.replace("/giris");
    router.refresh();
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
        <Link
          href="/dashboard"
          className="flex items-center gap-3"
          onClick={() => setOpen(false)}
        >
          <span className="grid size-10 place-items-center rounded-xl bg-white text-lg font-black text-[var(--brand-dark)]">
            P
          </span>
          <span>
            <strong className="block text-lg leading-none">Pozitif AI</strong>
            <small className="mt-1 block text-[11px] text-emerald-100/70">
              Navori Publisher
            </small>
          </span>
        </Link>
        <button
          className="md:hidden"
          onClick={() => setOpen(false)}
          aria-label="Menüyü kapat"
        >
          <X />
        </button>
      </div>
      <nav className="flex-1 space-y-1 p-3" aria-label="Ana menü">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href === "/isler" && pathname.startsWith("/isler/"));
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${active ? "bg-white text-[var(--brand-dark)] shadow-sm" : "text-emerald-50/80 hover:bg-white/10 hover:text-white"}`}
            >
              <Icon size={18} /> {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-4">
        <div className="mb-3 flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10 text-sm font-bold">
            {user.name.slice(0, 2).toLocaleUpperCase("tr-TR")}
          </span>
          <span className="min-w-0">
            <strong className="block truncate text-sm">{user.name}</strong>
            <small className="text-emerald-100/65">
              {roleLabels[user.role]}
            </small>
          </span>
        </div>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-emerald-50/75 hover:bg-white/10"
        >
          <LogOut size={16} /> Güvenli çıkış
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen md:grid md:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 hidden h-screen bg-[var(--brand-dark)] text-white md:block">
        {sidebar}
      </aside>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/35 md:hidden"
          onClick={() => setOpen(false)}
        >
          <aside
            className="h-full w-[84%] max-w-xs bg-[var(--brand-dark)] text-white"
            onClick={(event) => event.stopPropagation()}
          >
            {sidebar}
          </aside>
        </div>
      )}
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--line)] bg-white/85 px-4 backdrop-blur md:hidden">
          <button
            onClick={() => setOpen(true)}
            className="grid size-10 place-items-center rounded-xl border border-[var(--line)]"
            aria-label="Menüyü aç"
          >
            <Menu size={20} />
          </button>
          <strong>Pozitif AI</strong>
          <span className="size-10" />
        </header>
        <main className="mx-auto w-full max-w-[1440px] p-4 sm:p-6 lg:p-9">
          {children}
        </main>
      </div>
    </div>
  );
}
