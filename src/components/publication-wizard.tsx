"use client";

import {
  AlertTriangle,
  Check,
  ChevronRight,
  FileVideo,
  LoaderCircle,
  Send,
  ShieldCheck,
  UploadCloud,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { PublicationPreview } from "@/domain/intent";
import { formatBytes } from "@/lib/format";

type Catalog = {
  groups: Array<{ id: string; name: string }>;
  players: Array<{
    id: string;
    name: string;
    groupId: string;
    active: boolean;
  }>;
  playlists: Array<{ id: string; name: string; groupId: string }>;
};
type ApiEnvelope<T> = { data: T; message?: string; code?: string };

export function PublicationWizard({ canPublish }: { canPublish: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [assetId, setAssetId] = useState<string | null>(null);
  const [instruction, setInstruction] = useState("");
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<
    "compose" | "planning" | "preview" | "confirming" | "done"
  >("compose");
  const [preview, setPreview] = useState<PublicationPreview | null>(null);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [playlistId, setPlaylistId] = useState("");
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const busy = phase === "planning" || phase === "confirming";

  useEffect(() => {
    if (!preview || preview.canConfirm) return;
    fetch("/api/v1/targets")
      .then((response) => response.json())
      .then((body: ApiEnvelope<Catalog>) => setCatalog(body.data))
      .catch(() => setError("Hedef seçenekleri alınamadı."));
  }, [preview]);

  function chooseFile(nextFile: File | undefined) {
    if (!nextFile) {
      setFile(null);
      setAssetId(null);
      setPreview(null);
      setProgress(0);
      setPhase("compose");
      return;
    }
    const allowed = [
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "video/x-msvideo",
    ];
    if (!allowed.includes(nextFile.type)) {
      setError("MP4, WebM, MOV veya AVI formatında bir video seçin.");
      return;
    }
    setFile(nextFile);
    setAssetId(null);
    setPreview(null);
    setError("");
    setProgress(0);
    setPhase("compose");
  }

  function upload(selected: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open("POST", "/api/v1/uploads");
      request.setRequestHeader("Content-Type", selected.type);
      request.setRequestHeader(
        "X-File-Name",
        encodeURIComponent(selected.name),
      );
      request.upload.onprogress = (event) => {
        if (event.lengthComputable)
          setProgress(Math.round((event.loaded / event.total) * 100));
      };
      request.onerror = () =>
        reject(new Error("Video yüklenirken bağlantı kesildi."));
      request.onload = () => {
        let body: ApiEnvelope<{ id: string }> | undefined;
        try {
          body = JSON.parse(request.responseText) as ApiEnvelope<{
            id: string;
          }>;
        } catch {
          /* safe fallback */
        }
        if (request.status >= 200 && request.status < 300 && body?.data.id)
          resolve(body.data.id);
        else reject(new Error(body?.message ?? "Video yüklenemedi."));
      };
      request.send(selected);
    });
  }

  async function createPlan() {
    if (!file || instruction.trim().length < 8) {
      setError("Bir video seçin ve en az 8 karakterlik yayın talimatı yazın.");
      return;
    }
    setError("");
    setPhase("planning");
    try {
      const uploadedId = assetId ?? (await upload(file));
      setAssetId(uploadedId);
      const response = await fetch("/api/v1/commands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId: uploadedId, instruction }),
      });
      const body = (await response.json()) as ApiEnvelope<PublicationPreview>;
      if (!response.ok)
        throw new Error(body.message ?? "Yayın planı oluşturulamadı.");
      setPreview(body.data);
      setPlaylistId(body.data.playlist?.id ?? "");
      setGroupIds(
        body.data.targets
          .filter((target) => target.type === "group")
          .map((target) => target.id),
      );
      setPhase("preview");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "İşlem tamamlanamadı.");
      setPhase("compose");
    }
  }

  async function resolveAmbiguity() {
    if (!preview) return;
    setError("");
    setPhase("planning");
    try {
      const response = await fetch(
        `/api/v1/commands/${preview.commandRequestId}/resolve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(playlistId ? { playlistId } : {}),
            ...(groupIds.length ? { groupIds } : {}),
          }),
        },
      );
      const body = (await response.json()) as ApiEnvelope<PublicationPreview>;
      if (!response.ok)
        throw new Error(body.message ?? "Seçimler doğrulanamadı.");
      setPreview(body.data);
      setPhase("preview");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Seçimler doğrulanamadı.",
      );
      setPhase("preview");
    }
  }

  async function confirm() {
    if (!preview?.canConfirm || !canPublish) return;
    setError("");
    setPhase("confirming");
    try {
      const response = await fetch(
        `/api/v1/commands/${preview.commandRequestId}/confirm`,
        {
          method: "POST",
          headers: { "Idempotency-Key": `publish:${crypto.randomUUID()}` },
        },
      );
      const body = (await response.json()) as ApiEnvelope<{ id: string }>;
      if (!response.ok)
        throw new Error(body.message ?? "Yayın kuyruğa alınamadı.");
      setPhase("done");
      router.push(`/isler/${body.data.id}`);
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Yayın kuyruğa alınamadı.",
      );
      setPhase("preview");
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.06fr_.94fr]">
      <section className="card p-5 sm:p-7">
        <div className="mb-6 flex items-center gap-2 text-xs font-bold text-[var(--muted)]">
          <Step active done={Boolean(file)} number="1" label="Video" />
          <ChevronRight size={14} />
          <Step
            active={Boolean(file)}
            done={Boolean(preview)}
            number="2"
            label="Talimat"
          />
          <ChevronRight size={14} />
          <Step
            active={Boolean(preview)}
            done={phase === "done"}
            number="3"
            label="Onay"
          />
        </div>
        <h2 className="text-xl font-black">1. Videoyu seçin</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Video yalnızca geçici sunucu deposuna yüklenir; OpenAI’a gönderilmez.
        </p>
        {!file ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              chooseFile(event.dataTransfer.files[0]);
            }}
            className="mt-5 flex min-h-52 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#b9cdc3] bg-emerald-50/30 px-5 text-center hover:border-[var(--brand)]"
          >
            <span className="grid size-14 place-items-center rounded-2xl bg-white text-[var(--brand)] shadow-sm">
              <UploadCloud size={26} />
            </span>
            <strong className="mt-4">Sürükleyin veya dosya seçin</strong>
            <span className="mt-1 text-xs text-[var(--muted)]">
              MP4, WebM, MOV, AVI
            </span>
          </button>
        ) : (
          <div className="mt-5 flex items-center gap-4 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-white text-[var(--brand)]">
              <FileVideo />
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block truncate text-sm">{file.name}</strong>
              <small className="text-[var(--muted)]">
                {formatBytes(file.size)}
              </small>
              {phase === "planning" && progress > 0 && progress < 100 && (
                <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-white">
                  <i
                    className="block h-full bg-[var(--brand)]"
                    style={{ width: `${progress}%` }}
                  />
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={() => chooseFile(undefined)}
              className="grid size-9 place-items-center rounded-lg hover:bg-white"
              aria-label="Videoyu kaldır"
            >
              <X size={17} />
            </button>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
          className="hidden"
          onChange={(event) => chooseFile(event.target.files?.[0])}
        />
        <label className="mt-7 block">
          <span className="text-xl font-black">2. Yayın talimatını yazın</span>
          <span className="mt-1 block text-sm text-[var(--muted)]">
            Hedef grup/player ve playlist adını açıkça belirtin.
          </span>
          <textarea
            className="field mt-4 min-h-36 resize-y leading-6"
            value={instruction}
            onChange={(event) => setInstruction(event.target.value)}
            maxLength={2000}
            placeholder="Örn: Videoyu İstanbul grubundaki Kampanya playlist’inin sonuna ekle ve hemen yayınla."
          />
        </label>
        <div className="mt-2 flex justify-between text-xs text-[var(--muted)]">
          <span>
            Silme ve playlist’i tamamen değiştirme işlemleri desteklenmez.
          </span>
          <span>{instruction.length}/2000</span>
        </div>
        {error && (
          <div
            role="alert"
            className="mt-5 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertTriangle className="shrink-0" size={18} /> {error}
          </div>
        )}
        <button
          type="button"
          onClick={createPlan}
          disabled={busy || !file || instruction.trim().length < 8}
          className="btn-primary mt-6 w-full sm:w-auto"
        >
          {phase === "planning" ? (
            <>
              <LoaderCircle className="animate-spin" size={18} /> Plan
              hazırlanıyor…
            </>
          ) : (
            <>
              <Send size={18} /> Yayın planını hazırla
            </>
          )}
        </button>
      </section>
      <section
        className={`card p-5 sm:p-7 ${!preview ? "flex min-h-[480px] flex-col items-center justify-center text-center" : ""}`}
      >
        {!preview ? (
          <>
            <span className="grid size-16 place-items-center rounded-3xl bg-[var(--brand-soft)] text-[var(--brand)]">
              <ShieldCheck size={29} />
            </span>
            <h2 className="mt-5 text-xl font-black">Yayın öncesi kontrol</h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--muted)]">
              AI planı hazırlandığında playlist, hedefler ve etkilenecek ekran
              sayısı burada gösterilir.
            </p>
          </>
        ) : (
          <PreviewPanel
            preview={preview}
            catalog={catalog}
            playlistId={playlistId}
            setPlaylistId={setPlaylistId}
            groupIds={groupIds}
            setGroupIds={setGroupIds}
            resolveAmbiguity={resolveAmbiguity}
            confirm={confirm}
            canPublish={canPublish}
            busy={busy}
          />
        )}
      </section>
    </div>
  );
}

function Step({
  active,
  done,
  number,
  label,
}: {
  active: boolean;
  done: boolean;
  number: string;
  label: string;
}) {
  return (
    <span
      className={`flex items-center gap-1.5 ${active ? "text-[var(--brand)]" : ""}`}
    >
      <i
        className={`grid size-6 place-items-center rounded-full not-italic ${active ? "bg-[var(--brand)] text-white" : "bg-slate-100"}`}
      >
        {done ? <Check size={13} /> : number}
      </i>
      {label}
    </span>
  );
}

function PreviewPanel({
  preview,
  catalog,
  playlistId,
  setPlaylistId,
  groupIds,
  setGroupIds,
  resolveAmbiguity,
  confirm,
  canPublish,
  busy,
}: {
  preview: PublicationPreview;
  catalog: Catalog | null;
  playlistId: string;
  setPlaylistId: (id: string) => void;
  groupIds: string[];
  setGroupIds: (ids: string[]) => void;
  resolveAmbiguity: () => void;
  confirm: () => void;
  canPublish: boolean;
  busy: boolean;
}) {
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">AI yayın planı</p>
          <h2 className="mt-2 text-xl font-black">Onay önizlemesi</h2>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${preview.canConfirm ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}
        >
          {preview.canConfirm ? "Onaya hazır" : "Seçim gerekiyor"}
        </span>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Summary
          label="Playlist"
          value={preview.playlist?.name ?? "Belirsiz"}
        />
        <Summary label="Ekran" value={`${preview.affectedScreenCount}`} />
        <Summary label="İşlem" value="Sona ekle" />
        <Summary
          label="Yayın"
          value={
            preview.intent.publishMode === "asap"
              ? "Hemen"
              : preview.intent.publishMode
          }
        />
      </div>
      <div className="mt-5">
        <span className="text-xs font-bold tracking-wide text-[var(--muted)] uppercase">
          Hedefler
        </span>
        <div className="mt-2 flex flex-wrap gap-2">
          {preview.targets.length ? (
            preview.targets.map((target) => (
              <span
                key={`${target.type}:${target.id}`}
                className="rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm font-semibold"
              >
                {target.name}{" "}
                <small className="text-[var(--muted)]">
                  · {target.screenCount} ekran
                </small>
              </span>
            ))
          ) : (
            <span className="text-sm text-[var(--muted)]">Hedef seçilmedi</span>
          )}
        </div>
      </div>
      {preview.warnings.length > 0 && (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <strong className="flex items-center gap-2 text-sm text-amber-900">
            <AlertTriangle size={17} /> Kontrol gerekenler
          </strong>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900/80">
            {preview.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
      {!preview.canConfirm && catalog && (
        <div className="mt-5 space-y-4 border-t border-[var(--line)] pt-5">
          <label className="block">
            <span className="mb-2 block text-sm font-bold">Playlist seçin</span>
            <select
              className="field"
              value={playlistId}
              onChange={(event) => setPlaylistId(event.target.value)}
            >
              <option value="">Seçiniz</option>
              {catalog.playlists.map((playlist) => (
                <option key={playlist.id} value={playlist.id}>
                  {playlist.name} ·{" "}
                  {
                    catalog.groups.find(
                      (group) => group.id === playlist.groupId,
                    )?.name
                  }
                </option>
              ))}
            </select>
          </label>
          <fieldset>
            <legend className="mb-2 text-sm font-bold">Hedef gruplar</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {catalog.groups.map((group) => (
                <label
                  key={group.id}
                  className="flex items-center gap-2 rounded-xl border border-[var(--line)] p-3 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={groupIds.includes(group.id)}
                    onChange={(event) =>
                      setGroupIds(
                        event.target.checked
                          ? [...groupIds, group.id]
                          : groupIds.filter((id) => id !== group.id),
                      )
                    }
                  />{" "}
                  {group.name}
                </label>
              ))}
            </div>
          </fieldset>
          <button
            onClick={resolveAmbiguity}
            disabled={busy || !playlistId || groupIds.length === 0}
            className="btn-secondary w-full"
          >
            Seçimleri doğrula
          </button>
        </div>
      )}
      <div className="mt-6 border-t border-[var(--line)] pt-5">
        {!canPublish ? (
          <div className="rounded-xl bg-slate-100 p-4 text-sm text-slate-700">
            Plan hazır. Yayına alma için Publisher veya Admin rolündeki bir
            kullanıcıdan onay isteyin.
          </div>
        ) : (
          <button
            onClick={confirm}
            disabled={!preview.canConfirm || busy}
            className="btn-primary w-full"
          >
            {busy ? (
              <>
                <LoaderCircle className="animate-spin" size={18} /> Kuyruğa
                alınıyor…
              </>
            ) : (
              <>
                <ShieldCheck size={18} /> Onayla ve yayın kuyruğuna al
              </>
            )}
          </button>
        )}
        <p className="mt-3 text-center text-xs text-[var(--muted)]">
          Onaydan sonra işlem denetim kaydına yazılır ve geri alınamaz.
        </p>
      </div>
    </>
  );
}
function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--paper)] p-4">
      <span className="block text-xs font-bold tracking-wide text-[var(--muted)] uppercase">
        {label}
      </span>
      <strong className="mt-1 block truncate">{value}</strong>
    </div>
  );
}
