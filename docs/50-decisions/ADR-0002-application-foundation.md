# ADR-0002: Uygulama temeli, auth, queue ve UI stack'i

- **Status:** Accepted
- **Date:** 2026-09-01
- **Owners / approvers:** Ürün sahibi (kullanıcı)
- **Supersedes / superseded by:** N/A
- **Related:** `ADR-0001`, `OVERVIEW.md`, `SECURITY_MODEL.md`

## Context

CDSK 0.1.0 teknoloji-bağımsızdır; hazır UI bileşeni, tema, authentication,
veri erişim katmanı veya job sistemi sunmaz. Boş repository'de MVP uygulamasına
geçmek için bu seçimlerin açıkça onaylanması gerekir.

## Decision Drivers

- Tek geliştirilebilir/deploy edilebilir TypeScript codebase.
- 4 vCPU / 16 GB VPS'te düşük operasyonel yük.
- Streaming upload, PostgreSQL, background worker ve Docker desteği.
- Güvenli session, backend RBAC, typed migration ve deterministik test.
- Redis gibi brief'te olmayan ek kalıcı servisi MVP'de zorunlu kılmamak.

## Considered Options

1. **Next.js full-stack monolith + PostgreSQL queue (önerilen):** En az deployment
   parçası, ortak TypeScript tipleri ve hızlı MVP. Web/worker process sınırı korunur.
2. **Ayrı React SPA + NestJS API + Redis/BullMQ:** Güçlü servis ayrımı; MVP için
   ek container, sözleşme ve operasyon yükü.
3. **Django + Celery:** Olgun admin/job ekosistemi; Türkçe dashboard için ayrı
   frontend veya daha fazla template işi ve ek broker gerektirir.

## Decision

Onaylanan karar:

- Node.js 24 LTS, pnpm ve strict TypeScript.
- Next.js 16.3.x App Router; güvenlik düzeltmesi içeren en güncel patch pinlenir.
- React server/client bileşenleri; ayrı API servisi yerine `/api/v1` route'ları.
- PostgreSQL + Drizzle ORM ve versioned SQL migration.
- Better Auth email/password session; self-registration kapalı, kullanıcıyı Admin oluşturur.
- `pg-boss` ile PostgreSQL-backed worker, sınırlı retry/backoff ve cleanup schedule.
- Tailwind CSS 4.x, Radix UI primitives ve proje içi merkezi design token/component
  katmanı. CDSK'da mevcut tema/bileşen olmadığı için ikinci bir kit kopyalanmaz.
- Zod sınır şemaları, OpenAI resmi Node SDK ve typed adapter'lar.
- Vitest unit/integration, Playwright kritik browser akışları; ESLint/Prettier/typecheck.
- Aynı Docker image'dan `web`, `worker` ve `migrate` komutları.

## Consequences

- Tek dil ve image geliştirme/operasyonu sadeleştirir.
- Web ile worker aynı repository'de olsa da domain/adapters bağımsız kalır.
- Better Auth ve pg-boss tabloları migration/backup kapsamına girer.
- Tailwind/Radix, CDSK'nın sunmadığı UI temelini oluşturur; özel component sayısı
  yalnız ürün ihtiyacı kadar tutulur.
- Next.js self-hosting reverse proxy gereksinimi Coolify tarafından karşılanır.

Doğrulanan resmi kaynaklar:

- <https://nextjs.org/blog> — 16.3.3 Active LTS güvenlik sürümü.
- <https://nodejs.org/en/about/previous-releases> — Node 24 Active LTS.
- <https://better-auth.com/docs/basic-usage> — email/password ve server session.
- <https://orm.drizzle.team/docs/migrations> — code-first SQL migration.
- <https://github.com/timgit/pg-boss> — PostgreSQL job queue ve backoff.

## Rollout and Rollback

Önce mock adapter ile dikey dilim kurulur. Migration production'dan önce backup
ile uygulanır. Stack reddedilirse uygulama kodu yazılmadığı için yalnız bu ADR
`Rejected` yapılır ve alternatif karar hazırlanır.

## Open Questions

- Bu önerilen stack 2026-09-01 tarihinde kullanıcı tarafından açıkça onaylandı.
- İlk Admin hesabının güvenli bootstrap yöntemi: öneri tek kullanımlık CLI/env
  bootstrap; varsayılan parola yok.
- Audit ve upload retention için production değerleri.
