# Architecture Overview

## System Context

Pozitif AI – Navori Publisher, şirket kullanıcıları ile Navori QL Server
arasında güvenli bir yayın orkestrasyon katmanıdır. OpenAI yalnızca talimatı
izinli bir niyete dönüştürür; yetki, hedef çözümü, onay ve Navori çağrıları
uygulamanın backend'inde kalır.

## Layers and Responsibilities

- **Web/API:** Oturum, yönetim arayüzü, upload ve typed HTTP sözleşmeleri.
- **Application/domain:** Yetki, intent doğrulama, preview, idempotency ve durum makinesi.
- **Adapters:** OpenAI, Mock/Real Navori, dosya depolama ve iş kuyruğu.
- **Worker:** Uzun Navori işlemleri, retry/backoff ve periyodik temizlik.
- **Persistence:** PostgreSQL migrationları, uygulama kayıtları ve audit.

## Main Integrations

- Navori QL Server REST API/API Addon — backend-only.
- OpenAI Responses API — talimat ve güvenli metadata; video içeriği hariç.
- PostgreSQL — kalıcı veri ve önerilen iş kuyruğu.

## AI Components

Model yalnızca strict `ParsedIntent` üretir. Çıktı güvenilmez kabul edilir,
backend schema/iş kuralı/yetki kontrollerinden geçer ve yayın yetkisine sahip
değildir. Codex üretim bileşeni değildir.

## Data and Storage

Kanonik iş ve audit verisi PostgreSQL'de; video geçici olarak server-generated
bir anahtarla bağlı volume'da tutulur. Retention süresi ortam değişkenidir.

## Deployment Model

Hostinger VPS üzerindeki Coolify'da Docker container, PostgreSQL ve kalıcı upload
volume. Web ve worker aynı image'dan ayrı process olarak çalıştırılabilir.

## Key Risks and ADR Links

- Kullanıcının onayladığı dış sınırlar: `ADR-0001`.
- Uygulama stack'i ve auth/queue/UI seçimi: `ADR-0002` (`Accepted`).
- Navori tenant sürümü ve API Addon contract doğrulaması üretim aktivasyonu için
  bloklayıcı readiness koşuludur; mock geliştirmeyi engellemez.
