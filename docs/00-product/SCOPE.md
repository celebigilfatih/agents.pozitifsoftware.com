# Scope

## MVP In Scope

- Admin, Publisher, Uploader ve Viewer rolleri; hedef bazlı izinler.
- Video yükleme, metadata/checksum, güvenli geçici depolama ve temizlik.
- Türkçe talimatın strict schema ile izinli Navori niyetine dönüştürülmesi.
- Video yükleme, playlist bulma, sona ekleme, yayınlama ve durum sorgulama.
- Belirsizlik çözümü, etki önizlemesi, açık onay ve idempotency.
- Asenkron işler, retry/backoff, durum makinesi ve append-only audit.
- Mock/real adapter, readiness, dashboard ve operasyon ekranları.
- Docker, PostgreSQL migrationları ve Coolify dağıtım belgeleri.

## Explicit Non-goals

- Codex'i üretim runtime'ı olarak kullanmak.
- Modele shell, işletim sistemi veya genel amaçlı Navori erişimi vermek.
- OpenAI'a video içeriğini göndermek.
- Doğal dille silmek, playlist'i tamamen değiştirmek veya içerik kaldırmak.
- Kullanıcı onayı olmadan gerçek yayın yapmak.
- Navori API Addon lisansını veya erişimini bu uygulamanın sağlaması.
- 3D Web Experience profili; bu yönetim paneli için `N/A`.

## Later

- Gelişmiş zamanlama, çoklu onay, bildirimler ve harici object storage.
- Navori API sözleşmesi doğrulandıktan sonra daha geniş güvenli operasyon seti.

## Scope Change Policy

MVP genişlemesi change request ve açık kullanıcı onayı gerektirir; mimari etkide
ADR hazırlanır.
