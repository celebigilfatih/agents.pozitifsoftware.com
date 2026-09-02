# Core Workflows

## Workflow 1 — Taslak yayın hazırlama

1. Yetkili kullanıcı oturum açar ve videoyu yükler.
2. Backend MIME, boyut, güvenli adlandırma ve checksum doğrulaması yapar.
3. Kullanıcı Türkçe talimatını girer.
4. Backend güvenli metadata ve talimatı OpenAI Responses API'ye gönderir.
5. Structured output backend schema ve iş kurallarıyla tekrar doğrulanır.
6. Hedefler kullanıcının izinleriyle kesiştirilir.
7. Belirsizlik varsa yayın durur ve kullanıcıdan seçim istenir.
8. Sistem etki önizlemesi üretir ve durumu `awaiting_confirmation` yapar.

### Success

Video, hedef, playlist, etki, zamanlama, varsayım ve uyarılar açıkça görünür.

### Failure and Recovery

Geçersiz dosya/talimat anlaşılır hata verir. Navori veya OpenAI hazır değilse
taslak korunur; gerçek yayın başlatılmaz.

## Workflow 2 — Onaylı yayın

1. Admin veya yetkili Publisher önizlemeyi inceler.
2. Kullanıcı “Onayla ve yayınla” eylemiyle açık onay verir.
3. Backend yetkiyi, güncel hedefleri ve idempotency key'i tekrar doğrular.
4. İş kuyruğa alınır; worker upload → append → publish adımlarını yürütür.
5. Durum ve append-only audit event'leri kaydedilir.
6. Başarıda retention politikasına göre geçici dosya silinir.

### Success

İş `completed` olur; Navori sonucu ve audit detayları görüntülenir.

### Failure and Recovery

Geçici ağ hataları sınırlı exponential backoff ile denenir. Yetki ve kalıcı
hatalar tekrar edilmez; iş `failed` olur ve teknik olmayan hata gösterilir.

## Workflow 3 — Operasyon ve denetim

Admin entegrasyon readiness'ini, disk kullanımını, kullanıcı/hedef izinlerini;
yetkili kullanıcılar devam eden ve geçmiş işleri görüntüler. Audit kayıtları
son kullanıcı arayüzünden değiştirilemez.
