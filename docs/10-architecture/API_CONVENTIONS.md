# API Conventions

## Protocol and Versioning

Uygulama içi JSON ve multipart HTTP endpoint'leri `/api/v1` altında sürümlenir.
Uzun işlemler `202 Accepted` ile iş kimliği döndürür; request içinde Navori
yayınının bitmesi beklenmez.

## Authentication and Authorization

Güvenli HttpOnly session cookie ve backend rol/hedef kontrolü zorunludur. UI
gizleme bir güvenlik kontrolü sayılmaz. State-changing istekler same-origin ve
CSRF kontrolünden geçer.

## Errors, Idempotency and Pagination

- Hatalar `{ code, message, details?, requestId }` zarfıyla ve teknik olmayan Türkçe mesajla döner.
- Secret ve ham upstream gövdesi `details` içinde yer almaz.
- Yayın onayı `Idempotency-Key` ister; aynı anahtar aynı sonucu döndürür.
- Liste endpoint'leri cursor veya sınırlı sayfa boyutu kullanır.
- `429` rate limit, `409` ambiguity/idempotency conflict, `503` readiness için kullanılır.

## Compatibility

Breaking değişiklik yeni API/schema sürümü gerektirir. Navori payload'ları route
katmanına sızmaz; typed adapter içinde dönüştürülür.
