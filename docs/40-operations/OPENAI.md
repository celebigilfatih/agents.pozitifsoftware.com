# OpenAI Operations

## Veri sınırı

Responses API'ye şu veriler gönderilir:

- Kullanıcının Türkçe yayın talimatı
- Server-generated asset ID
- Gösterim amaçlı dosya adı metadatası
- MIME türü, byte boyutu ve varsa süre

Video içeriği, checksum, Navori parolası ve OpenAI anahtarı modele gönderilmez. İstek `store: false`, tools olmadan ve strict JSON Schema ile yapılır. Model yalnızca plan önerir; backend rol, hedef, append-only ve onay kontrollerini tekrar uygular.

## Yerel secret

Onaylı anahtar yalnızca `.env.local` içindeki `OPENAI_API_KEY` değeridir. Dosya `.gitignore` kapsamındadır. Anahtarı doğrulamak için değerini yazdırmayın; yalnızca değişkenin varlığını kontrol edin.

## Production

Coolify'da `OPENAI_API_KEY` secret olarak, `OPENAI_API_ENABLED=true` ve doğrulanmış `OPENAI_MODEL` ile tanımlanır. Deployment log'larında secret değerinin bulunmadığını kontrol edin.

## Fallback

OpenAI kesintisinde `OPENAI_API_ENABLED=false` ile deterministik mock parser'a dönülebilir. Bu, gerçek kullanıcı talimatlarının tamamını anlamaz; yalnızca smoke/demo amaçlıdır ve gerçek Navori yayınıyla birlikte kullanılmamalıdır.
