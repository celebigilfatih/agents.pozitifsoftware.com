# Bounded Contexts

| Context / module   | Responsibility                                         | Owns data                                    | Does not own                   |
| ------------------ | ------------------------------------------------------ | -------------------------------------------- | ------------------------------ |
| Identity & Access  | Oturum, rol, permission ve hedef izni                  | User, Role/Permission, UserTargetPermission  | Navori tokenı ve yayın yürütme |
| Asset Intake       | Upload doğrulama, checksum, geçici dosya yaşam döngüsü | UploadedAsset                                | Playlist ve yayın kararı       |
| Command Planning   | Talimat çözümleme, ambiguity ve preview                | CommandRequest, ParsedIntent                 | Gerçek yayın çağrısı           |
| Publication        | Onay, idempotency, durum makinesi ve worker            | PublicationJob, PublicationTarget            | Kullanıcı/parola yönetimi      |
| Integration        | Typed OpenAI/Navori adapter ve readiness               | Geçici token cache; secret kalıcı verisi yok | Yetkilendirme kararı           |
| Audit & Operations | Append-only event, dashboard ve sağlık                 | AuditEvent                                   | Domain state mutasyonu         |
