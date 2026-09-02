# Product Specification

## Problem

Şirket kullanıcıları bugün Navori QL Server üzerinde video yükleme, playlist
güncelleme ve hedef ekranlara yayınlama işlemlerini teknik ve parçalı adımlarla
yapmak zorunda. Yanlış hedef, yinelenen yayın ve yetki aşımı operasyonel risk
yaratıyor.

## Target Users and Outcomes

- **Admin:** Kullanıcıları, hedef yetkilerini ve entegrasyon durumunu yönetir.
- **Publisher:** İzinli hedeflere, açık önizleme ve onaydan sonra yayın yapar.
- **Uploader:** Video yükler ve yayın taslağı hazırlar; yayın başlatamaz.
- **Viewer:** İşlem geçmişini ve erişebildiği audit detaylarını görüntüler.

## Value Proposition

Kullanıcı, videoyu güvenli biçimde yükler ve Türkçe doğal dil talimatı verir.
Sistem yalnızca izin verilen Navori operasyonlarına dönüştürdüğü talimatı,
belirsizlikleri çözmeden ve kullanıcı açıkça onaylamadan yayınlamaz.

## Functional Requirements

1. Güvenli oturum, rol ve hedef bazlı yetkilendirme.
2. Doğrulanan, checksum üreten, ilerleme gösteren geçici video yükleme.
3. OpenAI Responses API strict structured output ile niyet çözümleme.
4. Belirsiz playlist/grup eşleşmelerinde zorunlu kullanıcı seçimi.
5. Etki önizlemesi ve ayrı “Onayla ve yayınla” eylemi.
6. Idempotent, asenkron Navori yükleme/playlist/publish iş akışı.
7. Mock ve real Navori adapter'ları ile readiness kontrolü.
8. Değiştirilemez kullanıcı audit kaydı ve işlem geçmişi.
9. Yönetim panelinde dashboard, iş, kullanıcı/yetki ve entegrasyon ekranları.

## Non-functional Requirements

- Varsayılan red ve backend'de zorunlu yetki kontrolü.
- Secret, token ve Navori parolalarının frontend/API/loglara sızmaması.
- Video içeriğinin OpenAI'a gönderilmemesi; yalnızca güvenli metadata.
- Kullanıcı girdisinden dosya yolu üretmeme ve yapılandırılabilir upload limiti.
- Sınırlı retry, exponential backoff ve kalıcı hatalarda otomatik retry yapmama.
- Docker üzerinde Coolify/Hostinger VPS dağıtımı, HTTPS ve health check.
- Türkçe, responsive ve erişilebilir yönetim arayüzü.
- Harici servislere bağlı olmayan deterministik testler.

## Success Metrics

- Admin veya Publisher mock modda yükleme → talimat → önizleme → onay → yayın
  → audit akışını uçtan uca tamamlayabilir.
- Yetkisiz yayın, onaysız yayın ve idempotency tekrarları backend'de engellenir.
- Kalite kapılarının tamamı geçer ve gerçek secret repository'de bulunmaz.

## Acceptance Criteria

Kullanıcı girdisindeki on maddelik kabul kriteri MVP sürümünün bağlayıcı çıkış
kriteridir. Ayrıntılı izlenebilirlik `REQUIREMENTS.md` ve test stratejisindedir.
