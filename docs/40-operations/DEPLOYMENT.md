# Deployment

## Environments

- **Local/test:** Mock Navori varsayılanı, ayrı test PostgreSQL, gerçek dış çağrı yok.
- **Production:** Hostinger VPS üzerinde Coolify, Docker, PostgreSQL, web + worker
  process ve kalıcı upload volume.

## Release Steps

1. Git repository'yi Coolify application olarak bağla.
2. PostgreSQL resource oluştur; `DATABASE_URL` secret olarak ata.
3. `.env.example` içindeki zorunlu değişkenleri Coolify Secrets'ta tanımla.
4. Kalıcı volume'u `TEMP_UPLOAD_PATH` ile aynı container yoluna mount et.
5. Production image'ı build et; release/migrate komutunu çalıştır.
6. Web ve worker process'lerini aynı image ile başlat.
7. Health/readiness geçmeden trafiği açma.
8. Navori tenant contract'ı doğrulanana kadar `NAVORI_API_ENABLED=false` tut.

### Coolify process topology

Aynı Dockerfile/image ile üç ayrı resource/command kullanılır:

- **migrate (release command):** `pnpm db:migrate`; her immutable release öncesi bir kez.
- **web:** image varsayılan komutu `node server.js`; internal port `3000`.
- **worker:** `pnpm worker`; public port açılmaz.

Web ve worker'a aynı `DATABASE_URL`, `AUTH_SECRET`, OpenAI/Navori secret'ları ve aynı kalıcı `/app/data/uploads` volume'u verilir. Migration resource'u volume istemez. En az iki web replica ancak session DB ve shared upload volume erişimi doğrulandıktan sonra açılır.

### Required production secrets

- `APP_URL=https://ai.pozitifsoftware.com`
- `DATABASE_URL`
- `AUTH_SECRET` (en az 32 karakter, rastgele)
- `OPENAI_API_KEY` (`OPENAI_API_ENABLED=true` ise)
- `NAVORI_BASE_URL`, `NAVORI_USERNAME`, `NAVORI_PASSWORD`, `NAVORI_ALLOWED_HOSTS` (`NAVORI_API_ENABLED=true` ise)

Secret değerlerini build arg olarak vermeyin; yalnızca runtime secret kullanın.

### DNS, domain and TLS

1. Hostinger DNS'te `ai` için VPS public IPv4 adresine `A` kaydı ekle.
2. DNS yayılımını authoritative lookup ile doğrula.
3. Coolify application domain alanına `https://ai.pozitifsoftware.com` yaz.
4. Portu web process'in dinlediği internal porta bağla ve HTTPS sertifikasını
   Coolify/Let's Encrypt ile üret.
5. HTTP→HTTPS redirect, Secure cookie ve health check'i doğrula.

## Verification

- `/api/health/live`: process çalışıyor.
- `/api/health/ready`: DB ve gerekli local kaynaklar hazır; secret değeri açıklanmaz.
- Entegrasyon ekranı OpenAI/Navori readiness'ini ayrı ve teknik olmayan durumla gösterir.
- Mock E2E smoke, migration sürümü, worker heartbeat ve upload volume yazılabilirliği.

## Rollback

Önceki immutable image'a dön; geriye uyumsuz migration uygulanmışsa onaylı
restore/forward-fix planını kullan. Real Navori'yi hemen kapatmak için
`NAVORI_API_ENABLED=false` yap; queued işleri güvenli biçimde durdur.
