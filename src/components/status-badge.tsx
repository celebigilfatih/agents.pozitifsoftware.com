const labels: Record<string, string> = {
  queued: "Sırada",
  uploading: "Navori’ye yükleniyor",
  updating_playlist: "Playlist güncelleniyor",
  publishing: "Yayınlanıyor",
  completed: "Tamamlandı",
  failed: "Başarısız",
  cancelled: "İptal edildi",
};

const tones: Record<string, string> = {
  queued: "bg-slate-100 text-slate-700",
  uploading: "bg-blue-50 text-blue-700",
  updating_playlist: "bg-indigo-50 text-indigo-700",
  publishing: "bg-amber-50 text-amber-800",
  completed: "bg-emerald-50 text-emerald-700",
  failed: "bg-red-50 text-red-700",
  cancelled: "bg-slate-100 text-slate-600",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${tones[status] ?? tones.queued}`}
    >
      {labels[status] ?? status}
    </span>
  );
}
