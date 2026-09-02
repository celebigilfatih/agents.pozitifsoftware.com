# Coding Standards

## Language and Framework Rules

`ADR-0002` onayına bağlı öneri: strict TypeScript, Next.js App Router ve Node.js
24 LTS. Domain kuralları framework route'larından bağımsız saf servislerde;
Navori/OpenAI/storage/queue erişimi typed adapter'larda tutulur.

## Repository Conventions

- Feature/domain odaklı küçük modüller; route içinde upstream payload yok.
- Server-only dosyalar client graph'ına girmez.
- Şema, status enum ve permission isimleri tek kanonik kaynaktan türetilir.
- Dosya/DB değişiklikleri transaction ve idempotency invariants'ını korur.
- Açıklamasız TODO veya mock production fallback kabul edilmez.

## Error, Security and Logging Rules

Güvenli hata kodu + Türkçe kullanıcı mesajı; ham upstream hata/secret yok.
Structured logger allowlist alanları kullanır. Tüm dış çağrılarda timeout ve
tanımlı retry sınıflandırması bulunur.

## Formatting and Static Analysis

- **Format:** `pnpm format:check`
- **Lint:** `pnpm lint`
- **Typecheck:** `pnpm typecheck`
