"use client";

import { ArrowRight, CheckCircle2, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const result = await authClient.signIn.email({
      email: String(form.get("email")),
      password: String(form.get("password")),
      rememberMe: false,
    });
    setLoading(false);
    if (result.error) {
      setError("E-posta veya parola hatalı. Bilgilerinizi kontrol edin.");
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden bg-[var(--brand-dark)] p-14 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute top-20 -right-28 size-96 rounded-full border border-white/10" />
        <div className="absolute top-36 -right-12 size-56 rounded-full bg-emerald-300/10 blur-2xl" />
        <div className="relative flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-white text-xl font-black text-[var(--brand-dark)]">
            P
          </span>
          <span>
            <strong className="block text-xl">Pozitif AI</strong>
            <small className="text-emerald-100/65">Navori Publisher</small>
          </span>
        </div>
        <div className="relative max-w-xl">
          <p className="eyebrow !text-emerald-300">
            Kontrollü yayın operasyonu
          </p>
          <h1 className="mt-4 text-5xl leading-[1.07] font-black tracking-tight">
            Talimatınızı yazın.
            <br />
            Planı görün.
            <br />
            Güvenle yayınlayın.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-emerald-50/70">
            Video içeriğiniz yapay zekâya gönderilmez. Her hedef, playlist ve
            etkilenecek ekran yayın öncesinde açıkça gösterilir.
          </p>
        </div>
        <div className="relative flex gap-6 text-sm text-emerald-50/70">
          <span className="flex items-center gap-2">
            <CheckCircle2 size={17} /> Onay zorunlu
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 size={17} /> Tam denetim kaydı
          </span>
        </div>
      </section>
      <section className="flex items-center justify-center p-5 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <span className="grid size-11 place-items-center rounded-xl bg-[var(--brand)] text-xl font-black text-white">
              P
            </span>
            <strong className="text-xl">Pozitif AI</strong>
          </div>
          <span className="mb-5 grid size-12 place-items-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]">
            <LockKeyhole size={23} />
          </span>
          <h1 className="text-3xl font-black tracking-tight">
            Tekrar hoş geldiniz
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            Yayın paneline devam etmek için giriş yapın.
          </p>
          <form onSubmit={submit} className="mt-8 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-bold">E-posta</span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                className="field"
                placeholder="ad@pozitifsoftware.com"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold">Parola</span>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                minLength={12}
                className="field"
              />
            </label>
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}
            <button className="btn-primary w-full" disabled={loading}>
              {loading ? (
                "Giriş yapılıyor…"
              ) : (
                <>
                  Giriş yap <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
          <p className="mt-8 text-center text-xs leading-5 text-[var(--muted)]">
            Hesaplar yalnızca sistem yöneticisi tarafından oluşturulur.
          </p>
        </div>
      </section>
    </main>
  );
}
