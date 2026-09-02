# Observability

## Logs, Metrics and Traces

JSON structured log: requestId, actorId (uygun ise), jobId, event, status,
duration ve güvenli hata kodu. Parola, token, secret, video bytes, ham OpenAI veya
Navori payload'ı loglanmaz. Metrikler: HTTP hata/latency, queue depth/age,
job status/retry, integration readiness, cleanup sonucu ve disk kullanımı.

## Health and Alerts

- Liveness ve DB-backed readiness.
- Worker heartbeat gecikmesi, failed job oranı, queue age, düşük disk ve Navori
  readiness değişimi için alarm eşikleri production verisiyle `TBD`.

## Dashboards and Ownership

Uygulama dashboard'u son yayın, devam eden/failed iş, Navori durumu ve geçici
disk kullanımını gösterir. Production metric backend ve alarm sahibi `TBD`.

## Sensitive Data Rules

Allowlist log alanları ve merkezi redaction kullanılır. Instruction, filename ve
upstream hata yalnız güvenli/normalize edilmiş biçimde; secret pattern testleri
kalite kapısında çalışır.
