# Admin Guide

## İlk yönetici

Migration tamamlandıktan sonra yalnızca güvenilen terminalde çalıştırın:

```bash
pnpm admin:create --name "Ad Soyad" --email admin@example.com --password "en-az-12-karakter"
```

Komut parolayı yazdırmaz ve mevcut e-postayı ezmez. Üretimde parolayı shell history'ye bırakmamak için geçici, güçlü bir değer kullanın; kullanıcı ilk güvenli kanalda teslim almalıdır.

## Roller

| Rol       | Yükle | Plan hazırla | Yayın onayla | Geçmiş | Kullanıcı/entegrasyon yönet |
| --------- | ----: | -----------: | -----------: | -----: | --------------------------: |
| Admin     |  Evet |         Evet |         Evet |   Evet |                        Evet |
| Publisher |  Evet |         Evet |         Evet |   Evet |                       Hayır |
| Uploader  |  Evet |         Evet |        Hayır |   Evet |                       Hayır |
| Viewer    | Hayır |        Hayır |        Hayır |   Evet |                       Hayır |

Son aktif Admin'in rolü API tarafından düşürülemez.

## Hedef izinleri

`Kullanıcılar → Hedefler` ekranında grup, player veya playlist izni verilebilir. Grup izni, o grubun altındaki player ve playlist'leri kapsar. Admin rolü tüm hedeflere erişir. Admin olmayan kullanıcılarda boş izin listesi hiçbir Navori hedefi seçilemeyeceği anlamına gelir.

## Operasyon kontrolü

- `Entegrasyonlar`: DB, OpenAI, Navori ve upload ayarlarının secretsız durumu.
- `Yayın işleri`: queue ve worker aşamaları, güvenli hata mesajı, retry sayısı.
- `İşlem geçmişi`: kritik kullanıcı/yayın olayları ve request ID.
- `/api/health/live`: process canlılığı.
- `/api/health/ready`: DB ve upload klasörü hazır olma durumu.

## Acil durdurma

Gerçek Navori erişimini durdurmak için Coolify'da `NAVORI_API_ENABLED=false` yapıp web ve worker'ı yeniden başlatın. Kuyruktaki işleri incelemeden yeniden etkinleştirmeyin.
