# Data Model

## Canonical Entities

- `User`: kimlik ve aktiflik; auth sağlayıcısının hesap/session kayıtlarıyla ilişkili.
- `Role` / `Permission`: Admin, Publisher, Uploader, Viewer yetki matrisi.
- `UserTargetPermission`: kullanıcının grup/playlist/player kapsamı.
- `UploadedAsset`: server-generated storage key, orijinal ad, MIME, boyut,
  checksum, süre, yaşam döngüsü ve retention zamanı.
- `CommandRequest`: orijinal talimat, kullanıcı, asset ve çözümleme durumu.
- `ParsedIntent`: schema sürümü, doğrulanmış alanlar, varsayım ve belirsizlikler.
- `PublicationJob`: durum makinesi, açık onay, idempotency, retry ve sonuç.
- `PublicationTarget`: çözümlenmiş Navori grup/player/playlist snapshot'ı.
- `AuditEvent`: actor, event type, güvenli payload ve zaman bilgisi.

## Invariants and Ownership

- Her domain kaydı UUID ile tanımlanır; kullanıcı girdisi dosya anahtarı olamaz.
- `PublicationJob.idempotencyKey` benzersizdir.
- `awaiting_confirmation` öncesi yayın adımları çalışamaz; onay actor/zamanı saklanır.
- `Uploader` ve `Viewer` yayın onayı veremez.
- Hedefler onay ve worker başlangıcında backend'de tekrar yetkilendirilir.
- Audit event'leri uygulama API'sinde update/delete sözleşmesi taşımaz.
- Secret/token/parola audit payload'ına veya domain tablolarına düz metin girmez.

## Lifecycle and Retention

- Asset önce geçici volume'a alınır; başarı ve süresi dolma cleanup koşulları saklanır.
- Varsayılan retention değeri kullanıcı onayından önce `TBD`; çalışma zamanı
  `UPLOAD_RETENTION_HOURS` ile açıkça yapılandırılır.
- İş/audit retention ve hukuki saklama süresi `TBD`; üretim açılışı öncesi sahibi
  tarafından onaylanmalıdır.

## Migration Policy

Şema code-first migration dosyalarıyla sürümlenir. Production'da otomatik
`push` yapılmaz; release öncesi migration, backup ve rollback etkisi doğrulanır.
Destructive migration ayrı ADR ve açık onay gerektirir.
