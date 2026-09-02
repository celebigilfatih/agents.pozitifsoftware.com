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

## Navori SaaS Contract Verification

1. `NAVORI_BASE_URL=https://saas.navori.com/NavoriService/Api/` ve
   `NAVORI_ALLOWED_HOSTS=saas.navori.com` değerlerini runtime secret'larında tanımla.
2. API kullanıcı adı/parolasını yalnız secret store'da tut; log veya audit'e yazma.
3. Kuyrukta bekleyen iş olmadığını doğrula ve web/worker'ı real modda yeniden başlat.
4. Önce yalnız `GetToken`, `GetGroups` ve `GetPlayers` çağrılarını doğrula.
5. Ayrı test grubunda küçük medya upload'ı ve playlist append payload'ını doğrula.
6. Kullanıcı açıkça onaylamadan `PublishContent` çağırma.

`PublishedStatus` değerleri resmî dokümanda enum olarak verilmediğinden tenant
yanıtları gözlenip kaydedilene kadar sonuç yorumlaması production-ready sayılmaz.

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
