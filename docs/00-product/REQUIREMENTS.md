# Requirements

| ID      | Requirement                             | Source            | Acceptance criteria                                  | Status   |
| ------- | --------------------------------------- | ----------------- | ---------------------------------------------------- | -------- |
| REQ-001 | Rol ve hedef bazlı auth/authz           | Kullanıcı brief'i | UI ve backend testleri yetkisiz eylemi reddeder      | Accepted |
| REQ-002 | Güvenli geçici video yükleme            | Kullanıcı brief'i | MIME/boyut/checksum/path/cleanup testleri geçer      | Accepted |
| REQ-003 | Strict structured intent                | Kullanıcı brief'i | Şema, ambiguity ve forbidden action testleri geçer   | Accepted |
| REQ-004 | Önizleme ve açık yayın onayı            | Kullanıcı brief'i | Onaysız iş kuyruğa alınamaz                          | Accepted |
| REQ-005 | Idempotent asenkron yayın               | Kullanıcı brief'i | Tekrarlı onay tek işe dönüşür                        | Accepted |
| REQ-006 | Mock ve real Navori adapter             | Kullanıcı brief'i | Mock E2E çalışır; real readiness güvenli hata verir  | Accepted |
| REQ-007 | Append-only audit ve geçmiş             | Kullanıcı brief'i | Zorunlu alanlar saklanır ve UI'dan değiştirilemez    | Accepted |
| REQ-008 | Türkçe responsive yönetim paneli        | Kullanıcı brief'i | Ana ekranlar masaüstü/mobil çalışır                  | Accepted |
| REQ-009 | Coolify/Docker/PostgreSQL üretim paketi | Kullanıcı brief'i | Build, health, migration ve deployment rehberi geçer | Accepted |
| REQ-010 | Secret ve güven sınırları               | Kullanıcı brief'i | API/log secret sızıntısı testleri geçer              | Accepted |
