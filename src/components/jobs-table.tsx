import { ArrowUpRight, RadioTower } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/format";

type JobRow = {
  job: {
    id: string;
    status: string;
    createdAt: Date;
    safeErrorMessage: string | null;
  };
  command: { originalInstruction: string };
  asset: { originalFileName: string };
};

export function JobsTable({ rows }: { rows: JobRow[] }) {
  if (rows.length === 0)
    return (
      <EmptyState
        icon={RadioTower}
        title="Henüz yayın işi yok"
        description="Onaylanan yayın planları burada izlenebilir."
      />
    );
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--line)] text-xs tracking-wide text-[var(--muted)] uppercase">
            <th className="px-5 py-4 font-bold">Video / talimat</th>
            <th className="px-4 py-4 font-bold">Durum</th>
            <th className="px-4 py-4 font-bold">Oluşturulma</th>
            <th className="px-5 py-4 text-right font-bold">Detay</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.job.id}
              className="border-b border-[var(--line)] last:border-0 hover:bg-emerald-50/25"
            >
              <td className="px-5 py-4">
                <strong className="block max-w-md truncate">
                  {row.asset.originalFileName}
                </strong>
                <span className="mt-1 block max-w-md truncate text-xs text-[var(--muted)]">
                  {row.command.originalInstruction}
                </span>
              </td>
              <td className="px-4 py-4">
                <StatusBadge status={row.job.status} />
                {row.job.safeErrorMessage && (
                  <span className="mt-1 block max-w-52 text-xs text-red-600">
                    {row.job.safeErrorMessage}
                  </span>
                )}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-[var(--muted)]">
                {formatDate(row.job.createdAt)}
              </td>
              <td className="px-5 py-4 text-right">
                <Link
                  href={`/isler/${row.job.id}`}
                  className="inline-flex size-9 items-center justify-center rounded-lg border border-[var(--line)] bg-white"
                  aria-label="İş detayını aç"
                >
                  <ArrowUpRight size={17} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
