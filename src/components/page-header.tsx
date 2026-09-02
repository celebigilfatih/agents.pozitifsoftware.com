export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">{description}</p>
      </div>
      {action}
    </header>
  );
}
