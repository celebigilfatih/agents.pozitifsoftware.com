import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center px-6 text-center">
      <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand)]">
        <Icon size={22} />
      </span>
      <h3 className="font-bold">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-[var(--muted)]">{description}</p>
    </div>
  );
}
