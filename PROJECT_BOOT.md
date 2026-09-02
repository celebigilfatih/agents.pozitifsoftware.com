# Pozitif AI – Navori Publisher — Project Boot

- **Document version:** 0.1
- **CDSK version:** 0.1.0
- **Last updated:** 2026-09-02

> Bu belge güncel çalışma özetidir. Ayrıntılı ürün, mimari ve karar belgelerinin
> yerine geçmez; onlara bağlantı verir. Bilinmeyen alan `TBD`, geçersiz alan
> kısa gerekçeyle `N/A` bırakılır.

## Project Compass

- **North star:** Navori yayınının doğal dil kadar kolay, backend kontrolleri kadar güvenli olması.
- **Current mission:** Doğrulanmış mock MVP'yi Coolify'a almak ve tenant Navori contract kapısını tamamlamak.
- **Success signal:** Yetkili kullanıcı mock modda onaylı yayını tamamlar; yetkisiz/onaysız akış engellenir.
- **Accepted trade-offs:** MVP local persistent upload ve PostgreSQL queue kullanmayı önerir; gerçek Navori readiness ayrı kapıdır.

## 1. Project Identity

- **Project name:** Pozitif AI – Navori Publisher
- **One-line vision:** Video ve Türkçe talimattan güvenli, onaylı ve denetlenebilir Navori yayını.
- **Problem statement:** Teknik Navori akışı yanlış hedef, yetki aşımı ve operasyonel tekrar riski taşıyor.
- **Target users:** Admin, Publisher, Uploader ve Viewer şirket kullanıcıları.
- **Success criteria:** `docs/00-product/PRODUCT_SPEC.md` ve `REQUIREMENTS.md`.
- **MVP goal:** Mock adapter ile uçtan uca kabul akışı ve production-ready paket.
- **Explicit non-goals:** Codex runtime, destructive Navori işlemleri, onaysız yayın ve OpenAI'a video gönderimi.

## 2. Current Status

- **Phase:** MVP implementation complete / production readiness
- **Version:** 0.1.0
- **Active sprint / milestone:** M2 — Production rollout
- **Current focus:** Coolify secret/volume kurulumu ve gerçek Navori tenant contract doğrulaması.
- **Critical risks:** Navori API Addon/tenant contract; production retention/backup değerleri.
- **Blocking decisions:** Yok; ADR-0002 onaylandı. Navori real contract readiness ayrı üretim kapısıdır.
- **Last status update:** 2026-09-02

## 3. Repository Navigation

1. `AGENTS.md`
2. `docs/00-product/CONSTITUTION.md`
3. `PROJECT_BOOT.md`
4. `README.md`
5. `docs/00-product/PRODUCT_SPEC.md`
6. `docs/00-product/SCOPE.md`
7. `docs/00-product/ROADMAP.md`
8. İlgili `docs/10-architecture/` belgeleri
9. İlgili `docs/50-decisions/` ADR'leri
10. İlgili quality/operations belgeleri
11. `CHANGELOG.md`

## 4. Architecture Snapshot

- **Layers:** Web/API → domain/application → typed adapters → PostgreSQL/storage/worker.
- **Main integrations:** OpenAI Responses API, Navori QL REST API/API Addon ve PostgreSQL.
- **AI components:** Strict intent parser; model yetkisiz ve toolsuz, backend guardrail zorunlu.
- **Data/storage:** PostgreSQL ve server-generated key kullanan geçici persistent upload volume.
- **Deployment model:** Hostinger VPS/Coolify üzerinde Docker web + worker; detay `DEPLOYMENT.md`.
- **Detailed sources:** `docs/10-architecture/OVERVIEW.md` ve ilgili belgeler

## 5. Decision Snapshot

| Decision                                | Status   | ADR / source |
| --------------------------------------- | -------- | ------------ |
| Production ve AI/Navori güven sınırları | Accepted | ADR-0001     |
| Next.js/TypeScript/Auth/queue/UI temeli | Accepted | ADR-0002     |

> Yalnızca en önemli güncel kararları özetle. Kararın tam gerekçesi ve sonuçları
> ADR'da kalır.

## 6. AI Context

- **Purpose:** Güvenli Navori yayın orkestrasyonu MVP'sini geliştirmek.
- **Constraints and prohibitions:** Model doğrudan yayınlayamaz; gerçek yayın insan onayı ister; secret/video sınırları korunur.
- **Open questions:** Tenant API contract, production retention/backup/alert sahipleri.
- **Recent decisions:** ADR-0002 onaylandı; Next.js/PostgreSQL/Better Auth/pg-boss temeli uygulandı.
- **Recently completed:** Responsive web UI, RBAC, upload, strict intent, confirmation, queue/worker, Mock/Real Navori adapter, audit, migration ve Docker paketi.

## 7. Current Priorities

1. Coolify'da PostgreSQL, web, worker, migrate ve upload volume kurulumunu yap.
2. Gerçek Navori tenant endpoint/payload contract testini tamamla.
3. Production backup, retention ve alert sahiplerini ata.

## 8. Known Constraints

- CDSK teknoloji/UI/auth sağlamaz; seçilen temel ADR-0002 ile onaylıdır.
- Navori real adapter sözleşmesi tenant sürümü ve API Addon doğrulamasına bağlıdır.
- Production retention, backup ve alert sahipleri TBD'dir.

## 9. Working Agreements

- Önce repository ve dokümantasyon doğrulaması.
- Küçük, doğrulanabilir adımlar.
- Kritik karar için ADR ve açık onay.
- Her anlamlı değişiklikte `CHANGELOG.md`.
- Ayrıntılı kaynağı Project Boot içine kopyalamak yerine bağlantı verme.
- TBD

## 10. Exit Checklist

### Definition of Ready

- [x] Amaç ve kabul kriterleri açık.
- [x] İlgili belgeler ve mevcut kod incelendi.
- [x] Belirsizlikler ve onay kapıları işaretlendi.
- [x] ADR ihtiyacı değerlendirildi.
- [x] Doğrulama yöntemi tanımlandı.

### Definition of Done

- [x] Mock MVP kabul akışı karşılandı.
- [x] Format/lint/typecheck/unit-integration test/build kontrolleri geçti.
- [x] İlgili dokümantasyon güncellendi.
- [x] ADR ve changelog gereksinimi tamamlandı.
- [x] Repository tutarlılığı doğrulandı.
- [x] Açık riskler ve sonraki adım kaydedildi.

## 11. AI Handoff

- **Session summary:** Onaylı stack ile production-minded MVP uygulandı; mock modda girişten worker tamamlanmasına uçtan uca gerçek tarayıcıyla doğrulandı. Local Docker Compose non-root runtime komutları doğrulandı.
- **Documents updated:** README, Project Boot, changelog, deployment, admin/OpenAI runbook'ları ve CDSK execution kayıtları.
- **Decisions recorded:** ADR-0001 ve ADR-0002 Accepted.
- **Remaining risk:** Gerçek Navori tenant sözleşmesi ve production retention/backup/alert sahipleri açık; Real modu bu nedenle varsayılan kapalıdır.
- **Recommended next step:** Repository'yi Coolify'a bağla, secret/volume'ları tanımla ve önce Mock smoke deployment yap.

> Kısa tut. Tam sohbet özeti yazma; bir sonraki oturumun güvenle devam etmesi
> için gerekli kalıcı bağlamı yaz.

## Revision History

| Version | Date       | Summary                                                     |
| ------- | ---------- | ----------------------------------------------------------- |
| 0.1     | 2026-09-01 | CDSK proje şablonu oluşturuldu                              |
| 0.2     | 2026-09-01 | Ürün bağlamı, mimari sınırlar ve ADR onay kapısı kaydedildi |
| 0.3     | 2026-09-02 | MVP, kalite kapıları ve uçtan uca mock doğrulama tamamlandı |
