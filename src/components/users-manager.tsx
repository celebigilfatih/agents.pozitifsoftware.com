"use client";

import {
  KeyRound,
  LoaderCircle,
  Plus,
  Save,
  Settings2,
  UserRound,
} from "lucide-react";
import { useState } from "react";

import type { AppRole } from "@/lib/auth/permissions";

type UserItem = {
  id: string;
  name: string;
  email: string;
  role: string;
  banned: boolean;
};
type Target = { id: string; name: string };
type Catalog = { groups: Target[]; players: Target[]; playlists: Target[] };
const roles: Array<{ value: AppRole; label: string }> = [
  { value: "admin", label: "Yönetici" },
  { value: "publisher", label: "Yayıncı" },
  { value: "uploader", label: "Yükleyici" },
  { value: "viewer", label: "İzleyici" },
];

export function UsersManager({
  initialUsers,
  catalog,
}: {
  initialUsers: UserItem[];
  catalog: Catalog;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [selected, setSelected] = useState<UserItem | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function createUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/v1/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form)),
    });
    const body = await response.json();
    setBusy(false);
    if (!response.ok) {
      setMessage(body.message ?? "Kullanıcı oluşturulamadı.");
      return;
    }
    setUsers((items) =>
      [...items, body.user].sort((a, b) => a.name.localeCompare(b.name, "tr")),
    );
    event.currentTarget.reset();
    setMessage("Kullanıcı oluşturuldu.");
  }

  async function updateRole(item: UserItem, role: string) {
    setBusy(true);
    setMessage("");
    const response = await fetch(`/api/v1/users/${item.id}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const body = await response.json();
    setBusy(false);
    if (!response.ok) {
      setMessage(body.message ?? "Rol değiştirilemedi.");
      return;
    }
    setUsers((items) =>
      items.map((user) => (user.id === item.id ? { ...user, role } : user)),
    );
    setMessage("Rol güncellendi.");
  }

  async function openPermissions(item: UserItem) {
    setSelected(item);
    setBusy(true);
    setMessage("");
    const response = await fetch(`/api/v1/users/${item.id}/targets`);
    const body = await response.json();
    setBusy(false);
    if (!response.ok) {
      setMessage(body.message ?? "Yetkiler alınamadı.");
      return;
    }
    setPermissions(
      body.permissions.map(
        (permission: { targetType: string; targetId: string }) =>
          `${permission.targetType}:${permission.targetId}`,
      ),
    );
  }

  async function savePermissions() {
    if (!selected) return;
    setBusy(true);
    setMessage("");
    const targets = permissions.map((key) => {
      const [type, ...rest] = key.split(":");
      return { type, id: rest.join(":") };
    });
    const response = await fetch(`/api/v1/users/${selected.id}/targets`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targets }),
    });
    const body = await response.json();
    setBusy(false);
    if (!response.ok) {
      setMessage(body.message ?? "Yetkiler kaydedilemedi.");
      return;
    }
    setMessage(`${selected.name} için ${body.count} hedef yetkisi kaydedildi.`);
    setSelected(null);
  }

  function toggle(key: string) {
    setPermissions((items) =>
      items.includes(key)
        ? items.filter((item) => item !== key)
        : [...items, key],
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
      <section className="card overflow-hidden">
        <div className="border-b border-[var(--line)] px-5 py-4">
          <h2 className="font-black">Ekip üyeleri</h2>
          <p className="text-sm text-[var(--muted)]">
            Rol ve hedef erişimlerini yönetin.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] text-xs tracking-wide text-[var(--muted)] uppercase">
                <th className="px-5 py-4">Kullanıcı</th>
                <th className="px-4 py-4">Rol</th>
                <th className="px-5 py-4 text-right">Hedefler</th>
              </tr>
            </thead>
            <tbody>
              {users.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-[var(--line)] last:border-0"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 place-items-center rounded-full bg-[var(--brand-soft)] font-bold text-[var(--brand)]">
                        {item.name.slice(0, 2).toUpperCase()}
                      </span>
                      <span>
                        <strong className="block">{item.name}</strong>
                        <small className="text-[var(--muted)]">
                          {item.email}
                        </small>
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <select
                      className="field !w-40 !py-2"
                      value={item.role}
                      disabled={busy}
                      onChange={(event) => updateRole(item, event.target.value)}
                    >
                      {roles.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => openPermissions(item)}
                      className="btn-secondary !min-h-9 !py-1.5"
                    >
                      <Settings2 size={16} /> Düzenle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="card p-5 sm:p-6">
        <span className="grid size-11 place-items-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]">
          <UserRound size={21} />
        </span>
        <h2 className="mt-4 text-lg font-black">Yeni kullanıcı</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Geçici parola en az 12 karakter olmalıdır.
        </p>
        <form onSubmit={createUser} className="mt-5 space-y-4">
          <input
            className="field"
            name="name"
            placeholder="Ad soyad"
            required
            minLength={2}
          />
          <input
            className="field"
            name="email"
            type="email"
            placeholder="E-posta"
            required
          />
          <input
            className="field"
            name="password"
            type="password"
            placeholder="Geçici parola"
            required
            minLength={12}
          />
          <select className="field" name="role" defaultValue="viewer">
            {roles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
          <button disabled={busy} className="btn-primary w-full">
            {busy ? (
              <LoaderCircle className="animate-spin" size={17} />
            ) : (
              <Plus size={17} />
            )}{" "}
            Kullanıcı oluştur
          </button>
        </form>
        {message && (
          <p className="mt-4 rounded-xl bg-[var(--paper)] p-3 text-sm">
            {message}
          </p>
        )}
      </section>
      {selected && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          onClick={() => setSelected(null)}
        >
          <section
            className="card max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="eyebrow">Hedef yetkileri</p>
                <h2 className="mt-2 text-xl font-black">{selected.name}</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Grup yetkisi, o gruptaki player ve playlist’leri de kapsar.
                </p>
              </div>
              <KeyRound className="text-[var(--brand)]" />
            </div>
            <div className="mt-6 space-y-5">
              {(
                [
                  ["group", "Gruplar", catalog.groups],
                  ["player", "Player’lar", catalog.players],
                  ["playlist", "Playlist’ler", catalog.playlists],
                ] as const
              ).map(([type, label, items]) => (
                <fieldset key={type}>
                  <legend className="mb-2 text-sm font-black">{label}</legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {items.map((item) => {
                      const key = `${type}:${item.id}`;
                      return (
                        <label
                          key={key}
                          className="flex items-center gap-2 rounded-xl border border-[var(--line)] p-3 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={permissions.includes(key)}
                            onChange={() => toggle(key)}
                          />{" "}
                          {item.name}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-3 border-t border-[var(--line)] pt-5">
              <button
                onClick={() => setSelected(null)}
                className="btn-secondary"
              >
                Vazgeç
              </button>
              <button
                onClick={savePermissions}
                disabled={busy}
                className="btn-primary"
              >
                <Save size={17} /> Yetkileri kaydet
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
