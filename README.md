# Pozitif AI – Navori Publisher

Türkçe doğal dil talimatlarını güvenli ve onaylı Navori QL yayın işlerine dönüştüren kurumsal web uygulaması. Proje **CDSK 0.1.0** standardını kullanır.

## Neler hazır?

- Better Auth tabanlı kapalı üyelik ve Admin / Publisher / Uploader / Viewer rolleri
- Navori grup, player ve playlist bazlı hedef izinleri
- MP4, WebM, MOV ve AVI için boyut sınırlı geçici video yükleme
- OpenAI Responses API ile strict JSON intent; tools kapalı, `store: false`
- AI'a yalnızca talimat ve güvenli dosya metadatası gönderimi; video byte'ları gönderilmez
- Belirsizlik çözümü, etkilenecek ekran önizlemesi ve zorunlu insan onayı
- PostgreSQL/pg-boss kuyruğu, idempotency, kontrollü retry ve worker
- Navori Mock/Real adapter'ları ve append-only playlist güncellemesi
- Denetim izi, secret redaction, readiness/liveness ve Türkçe responsive panel
- Docker/Coolify için web, worker, migrate ve kalıcı upload volume paketi

## Yerel kurulum

Gereksinimler: Node.js 24+, pnpm 11+, PostgreSQL 17+.

```bash
pnpm install --frozen-lockfile
cp .env.example .env
```

`.env` içinde en az `DATABASE_URL` ve 32+ karakterlik `AUTH_SECRET` değerlerini belirleyin. Ardından:

```bash
pnpm db:migrate
pnpm admin:create --name "Ad Soyad" --email admin@example.com --password "guclu-gecici-parola"
pnpm dev
```

Ayrı terminalde worker'ı başlatın:

```bash
pnpm worker
```

Varsayılan geliştirme modu deterministiktir: `OPENAI_API_ENABLED=false` ve `NAVORI_API_ENABLED=false`. Bu mod gerçek dış servislere istek göndermez.

## OpenAI anahtarı

Yerel anahtar `.env.local` içinde `OPENAI_API_KEY` olarak tutulur ve Git tarafından dışlanır. Gerçek intent ayrıştırmayı etkinleştirmek için:

```dotenv
OPENAI_API_ENABLED=true
OPENAI_MODEL=gpt-5.4
```

Anahtarı log'a, audit payload'a, ekran görüntüsüne veya client bundle'a koymayın. Ayrıntılar: `docs/40-operations/OPENAI.md`.

## Navori modu

Gerçek moda geçmeden önce tenant API Addon ve endpoint sözleşmesini doğrulayın. Sonra Coolify secret'larında:

```dotenv
NAVORI_API_ENABLED=true
NAVORI_BASE_URL=https://tenant.example.com/NavoriService/Api/
NAVORI_USERNAME=...
NAVORI_PASSWORD=...
NAVORI_ALLOWED_HOSTS=tenant.example.com
```

Real adapter yalnızca HTTPS ve allowlist host kabul eder; destructive endpoint sunmaz.
Navori SaaS için doğrulanmış taban adresi
`https://saas.navori.com/NavoriService/Api/`, allowlist host'u ise
`saas.navori.com` değeridir.

## Kalite komutları

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
python3 /Users/fatih/Dev/cdsk/scripts/validate_project.py .
```

## Docker

```bash
docker build -t pozitif-ai-navori-publisher .
POSTGRES_PASSWORD=... AUTH_SECRET=... docker compose up --build
```

- Web: `http://localhost:3000`
- Liveness: `/api/health/live`
- Readiness: `/api/health/ready`

Coolify/Hostinger adımları için `docs/40-operations/DEPLOYMENT.md`; ilk yönetici, roller ve hedef yetkileri için `docs/40-operations/ADMIN_GUIDE.md`.

## Dokümantasyon başlangıç sırası

1. `AGENTS.md`
2. `docs/00-product/CONSTITUTION.md`
3. `PROJECT_BOOT.md`
4. `docs/00-product/PRODUCT_SPEC.md`
5. `docs/10-architecture/OVERVIEW.md`
6. `docs/50-decisions/ADR-0002-application-foundation.md`
7. `CHANGELOG.md`
