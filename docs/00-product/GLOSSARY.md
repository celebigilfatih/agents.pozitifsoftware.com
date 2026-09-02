# Glossary

| Term               | Definition                                                         | Notes                                     |
| ------------------ | ------------------------------------------------------------------ | ----------------------------------------- |
| Asset              | Geçici depolamaya alınmış, doğrulanmış video                       | OpenAI'a içerik gönderilmez               |
| Command Request    | Kullanıcının doğal dil talimatı ve çözümleme yaşam döngüsü         | Orijinal metin audit edilir               |
| Parsed Intent      | Strict schema ve backend kurallarıyla doğrulanmış izinli operasyon | Model çıktısı tek başına yetkili değildir |
| Publication Job    | Onay sonrası asenkron yürütülen Navori işi                         | Idempotent durum makinesi                 |
| Publication Target | Grup, player veya playlist hedef kaydı                             | Kullanıcı izniyle doğrulanır              |
| Readiness          | Entegrasyonun güvenli biçimde kullanılabilirlik durumu             | Secret değeri açıklanmaz                  |
| Audit Event        | Kullanıcı tarafından değiştirilemeyen olay kaydı                   | Append-only uygulama sözleşmesi           |
| CDSK               | Çelebigil Development Standard Kit                                 | Sürüm 0.1.0                               |
