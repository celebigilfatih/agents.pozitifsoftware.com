# AI Architecture

## AI Use Cases

Türkçe doğal dil talimatını izinli Navori operasyon planına dönüştürmek ve
belirsizlik/varsayımları görünür kılmak.

## Models, Tools and Data Boundaries

- Production runtime OpenAI Responses API'dir; model `OPENAI_MODEL` ile seçilir.
- Modele yalnızca talimat, asset kimliği ve güvenli metadata verilir.
- Video bytes, secret, Navori credential/token ve kullanıcının geniş yetki verisi verilmez.
- Modelin shell, ağ veya genel araç erişimi yoktur.
- Codex yalnızca geliştirme/bakım aracıdır.

## Guardrails and Human Approval

Strict schema alanları: `action`, `uploadedAssetId`, target ad/kimlikleri,
playlist ad/kimliği, `playlistOperation`, `publishMode`, `requestedSchedule`,
`requiresConfirmation`, `assumptions`, `ambiguities`. Backend ek olarak:

1. schema sürümü ve enum allowlist'i,
2. forbidden/destructive operasyon reddi,
3. asset ownership ve rol/target yetkisi,
4. Navori canonical target çözümü,
5. ambiguity durdurma,
6. açık insan onayı

uygular. Model hiçbir zaman doğrudan Navori adapter çağırmaz.

## Evaluation, Observability and Fallback

Structured output parse/schema/iş kuralı başarısı ölçülür; prompt veya kullanıcı
metni loglara ham olarak yazılmadan güvenli audit kaydı tutulur. OpenAI hazır
değilse mock/local deterministic intent modu yalnızca geliştirmede kullanılır.

## Prompt and Model Versioning

System prompt ve JSON schema kodda sürümlenir; model ortam değişkenidir. Model
veya prompt değişimi deterministik evaluation fixture'larını geçirmek zorundadır.
