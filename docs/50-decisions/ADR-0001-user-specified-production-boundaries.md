# ADR-0001: Kullanıcı tarafından belirlenen üretim sınırları

- **Status:** Accepted
- **Date:** 2026-09-01
- **Owners / approvers:** Ürün sahibi (kullanıcı)
- **Supersedes / superseded by:** N/A
- **Related:** `PRODUCT_SPEC.md`, `SCOPE.md`, `OVERVIEW.md`

## Context

Ürün brief'i üretim altyapısını ve kritik güven sınırlarını açıkça belirledi.
Bu kayıt yeni seçim yapmaz; kullanıcının bağlayıcı girdisini sürümlü hale getirir.

## Decision Drivers

Güvenli Navori yayınlama, insan onayı, düşük operasyonel karmaşıklık, mevcut
Hostinger/Coolify altyapısı ve OpenAI'ın sınırlı rolü.

## Considered Options

Brief bu sınırlar için alternatif değerlendirmesi istemedi; farklı altyapı,
model sağlayıcısı veya production agent runtime kapsam dışıdır.

## Decision

- Hostinger VPS, Coolify, Docker ve PostgreSQL kullanılacak.
- Hedef domain `https://ai.pozitifsoftware.com` olacak.
- Doğal dil çözümleme OpenAI Responses API strict structured output kullanacak.
- Navori işlemleri uygulamanın typed backend adapter'ı tarafından yürütülecek.
- Mock adapter yerel ve test varsayılanı; real adapter yalnızca açık env ayarıyla.
- Model video bytes, secret, shell veya işletim sistemi erişimi almayacak.
- Her gerçek yayın backend yetkisi ve açık kullanıcı onayı gerektirecek.
- Codex production runtime değildir.

## Consequences

Docker health/migration/runbook, PostgreSQL backup/restore ve secret yönetimi
zorunludur. Navori API Addon/tenant contract'ı doğrulanmadan real yayın hazır
sayılmaz; bu koşul mock MVP'yi engellemez.

## Rollout and Rollback

Mock modla doğrulanan aynı adapter sözleşmesi real readiness sonrası açılır.
Real mod sorununda `NAVORI_API_ENABLED=false` ile yayın kapatılır; audit korunur.

## Open Questions

- API Addon kullanıcı beyanıyla aktiftir; DT Cloud Navori sürümü, credential ve
  canlı tenant endpoint contract doğrulaması: TBD.
- Production backup/retention sahipleri: TBD.
