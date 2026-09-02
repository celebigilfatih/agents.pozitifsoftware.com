# Runbook

## Prerequisites

Node.js 24 LTS, pnpm, Docker ve PostgreSQL. Production
için Coolify erişimi, Navori API Addon/credential ve OpenAI API key gerekir.

## Setup and Start

- Kurulum: `pnpm install --frozen-lockfile`
- Environment: `.env.example` kopyalanır; gerçek secret commit edilmez.
- Migration: `pnpm db:migrate`
- Local web: `pnpm dev`
- Worker: `pnpm worker`
- Mock adapter: `NAVORI_API_ENABLED=false`

Komutlar ADR onayı ve package manifest oluşturulunca doğrulanmış hale gelir.

## Stop and Recovery

Web ve worker ayrı durdurulur; aktif işlerin durumu PostgreSQL'de kalır. Restart
sonrası queue görünürlüğü ve stuck-job recovery doğrulanır. Upload volume
silinmez; cleanup job retention'a göre çalışır.

## Common Incidents

- **Navori hazır değil:** Lisans/endpoint/credential readiness kontrolü; secret loglama yok.
- **Disk doluyor:** Yeni upload'ı kontrollü durdur, stale cleanup ve volume kapasitesini incele.
- **Worker durmuş:** Heartbeat ve queue depth; web'i kapatmadan worker restart.
- **Yinelenen istek:** Idempotency key sonucunu döndür; ikinci publish oluşturma.
- **Migration hatası:** Trafiği açma; backup/rollback kararını uygula.

## Escalation and Ownership

Teknik ürün sahibi ve operasyon sahibi `TBD`. Gerçek publish incident'ında
Navori API kapatılır, audit/job kimliği korunur ve ham secret paylaşılmaz.
