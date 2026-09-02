# Backup and Recovery

## Protected Data

PostgreSQL domain/auth/audit/queue kayıtları ve aktif geçici upload volume.
Navori/OpenAI secret'ları repository/database backup kapsamına girmez; Coolify
secret yönetiminde tutulur.

## Backup, Retention and Encryption

Production sıklığı, saklama süresi ve backup hedefi `TBD` ve operasyon sahibi
onayı gerektirir. PostgreSQL backup şifreli ve erişimi sınırlı olmalıdır. Upload
volume geçicidir; kaynak video yeniden yüklenebilirlik ve retention politikasına
göre backup dışı bırakılabilir; bu karar production öncesi onaylanmalıdır.

## Restore Procedure

1. Navori real publish'i ve worker'ı durdur.
2. Uyumlu application image/migration sürümünü belirle.
3. PostgreSQL'i izole ortamda restore et ve migration tablosunu doğrula.
4. Audit/job sayımları ve örnek checksum bütünlüğünü kontrol et.
5. Mock smoke sonrası worker ve trafiği kademeli aç.

## Restore Test Evidence

İlk production yayından önce gerçek restore tatbikatı zorunludur; tarih, süre,
backup kimliği ve doğrulama sonucu buraya eklenir.
