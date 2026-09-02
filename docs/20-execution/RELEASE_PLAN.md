# Release Plan

## Release

- **Version:** 0.1.0 MVP
- **Target:** Coolify production; ilk aşama mock/readiness, real Navori kontrollü aktivasyon.
- **Included outcomes:** `SCOPE.md` MVP maddeleri.
- **Quality gates:** Format, lint, typecheck, deterministic tests, E2E, build,
  migration, secret scan, CDSK validation ve restore readiness.
- **Rollout:** Migration → web/worker → mock smoke → DNS/TLS → real readiness → kontrollü publish.
- **Rollback:** Navori API toggle off, worker stop, önceki image ve onaylı DB restore/forward-fix.
