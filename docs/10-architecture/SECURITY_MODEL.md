# Security Model

## Assets and Trust Boundaries

Korunan varlıklar kullanıcı hesapları, hedef yetkileri, videolar, Navori/OpenAI
secret'ları, Navori tokenı, yayın onayı ve audit geçmişidir. Browser, model
çıktısı, dosya metadata'sı ve tüm kullanıcı girdileri güvenilmezdir.

## Threats and Controls

- Prompt injection → allowlist action schema, backend validation ve yetki kesişimi.
- Yetki aşımı → route ve worker'da yeniden RBAC/target kontrolü, varsayılan red.
- Onaysız/çift yayın → explicit confirmation ve benzersiz idempotency key.
- Path traversal/upload abuse → server-generated key, stream limiti, MIME allowlist,
  checksum ve eski dosya cleanup; malware scanning MVP'de `TBD` riskidir.
- SSRF → `NAVORI_BASE_URL` yalnızca server environment'tan okunur; runtime kullanıcı
  girdisi değildir; HTTPS/host allowlist ve redirect reddi uygulanır.
- Secret sızıntısı → structured redaction, safe error mapping ve response testleri.
- CSRF/session abuse → SameSite/HttpOnly/Secure cookie, origin kontrolü, session
  rotation ve rate limiting.

## Identity, Authorization and Audit

Admin tüm hedefleri ve yönetimi; Publisher izinli hedef yayınını; Uploader upload
ve taslağı; Viewer salt okunur geçmişi kullanır. Audit actor, onay, hedef ve
sonucu kaydeder. Kullanıcı CRUD ve hedef atama yalnızca Admin'dir.

## Secrets and Sensitive Data

Secret'lar yalnızca Coolify environment/secrets alanında tutulur. `NEXT_PUBLIC_*`
değişkenlerine secret verilmez. Parolalar auth kütüphanesinin güçlü password
hashing mekanizmasıyla saklanır; Navori tokenı veritabanına düz metin yazılmaz.
Log ve audit redaction allowlist tabanlıdır.
