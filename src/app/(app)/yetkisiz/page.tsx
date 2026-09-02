import { ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="card mx-auto mt-20 max-w-xl p-10 text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-amber-50 text-amber-700">
        <ShieldAlert />
      </span>
      <h1 className="mt-5 text-2xl font-black">Bu alan için yetkiniz yok</h1>
      <p className="mt-2 text-[var(--muted)]">
        Gerekli erişim rolü veya hedef izni yöneticiniz tarafından
        tanımlanabilir.
      </p>
      <Link href="/dashboard" className="btn-primary mt-7">
        Genel bakışa dön
      </Link>
    </div>
  );
}
