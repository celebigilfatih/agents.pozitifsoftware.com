# Changelog

## [Unreleased]

### Added

- CDSK proje iskeleti.
- Pozitif AI – Navori Publisher ürün, kapsam, kullanıcı akışı ve gereksinim belgeleri.
- AI/Navori güven sınırları, data model, API, entegrasyon ve operasyon taslakları.
- `ADR-0001` ile kullanıcı tarafından belirlenen production kararları.
- `ADR-0002` ile onaylanan uygulama stack'i.
- Coolify DNS/domain/TLS, health, rollback ve backup/runbook adımları.
- Next.js 16 / TypeScript responsive yönetim paneli ve kapalı Better Auth oturum akışı.
- Admin, Publisher, Uploader ve Viewer rol matrisi ile Navori hedef izinleri.
- Güvenli geçici video upload, retention cleanup, checksum ve path containment.
- MP4/MOV, WebM ve AVI içerik imzası doğrulaması.
- OpenAI Responses API strict intent parser ve deterministik mock parser.
- Belirsizlik çözümü, yayın önizlemesi, zorunlu onay ve idempotent confirmation.
- pg-boss yayın kuyruğu, web/worker ayrımı, retry sınıflandırması ve audit trail.
- Resmî API sözleşmesine dayalı Navori Real adapter ile güvenli Mock adapter.
- Drizzle PostgreSQL migration'ları, ilk admin CLI'si, health endpoint'leri.
- Dockerfile, docker-compose web/worker/migrate topolojisi ve kalıcı upload volume.
- 22 unit/integration/security testi ve Playwright ile masaüstü/mobil mock smoke doğrulaması.

### Fixed

- Better Auth 1.7 account `issuer` sözleşmesi migration'a eklendi.
- Reverse proxy/standalone ortamında canonical host kullanan same-origin doğrulaması.
- Grup izninin alt playlist/player kapsamına güvenli aktarımı.
- Non-root Docker image içinde migrate ve worker'ın pnpm yazma kontrolüne takılması.
