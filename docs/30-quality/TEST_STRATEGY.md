# Test Strategy

## Risk-based Test Layers

- Unit: intent schema/iş kuralı, permission matrisi, state machine, retry ve redaction.
- Integration: PostgreSQL repository/migration, auth/session, upload ve queue sınırı.
- Contract: Mock/Real Navori adapter şekli ve OpenAI fixture parse davranışı.
- Browser E2E: login, upload, preview, confirmation, mock publish, history/audit.
- Security regression: onaysız/yetkisiz hedef, idempotency, SSRF config ve secret leak.

## Commands

- **Unit:** `pnpm test:unit`
- **Integration:** `pnpm test:integration`
- **End-to-end:** `pnpm test:e2e`
- **Security:** `pnpm test:security` ve dependency/secret scan
- **Build:** `pnpm build`

## Test Data and Isolation

Varsayılan test akışında dış servis yoktur: Mock Navori ve deterministic OpenAI
fixture kullanılır. Test DB ayrı `TEST_DATABASE_URL` ister ve her suite izole
transaction/schema kullanır. Gerçek Navori/OpenAI çağrısı otomatik testte yasaktır.
Real Navori contract testleri HTTP'yi process içinde stub'lar; SaaS endpoint,
token header, publish seçenekleri ve append-only playlist payload'ını doğrular.

## Release Gates

Format, lint, typecheck, unit/integration/security, E2E kritik akış, production
build, migration dry-run ve CDSK validator geçmeden release yapılamaz.
