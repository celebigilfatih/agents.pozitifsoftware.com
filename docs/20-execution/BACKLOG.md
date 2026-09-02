# Backlog

| ID      | Outcome                           | Priority | Dependencies | Acceptance criteria                     | Status            |
| ------- | --------------------------------- | -------- | ------------ | --------------------------------------- | ----------------- |
| MVP-001 | CDSK foundation ve onaylı ADR     | P0       | —            | Validator geçer, ADR-0002 kararı alınır | Done              |
| MVP-002 | Auth, RBAC ve target permissions  | P0       | MVP-001      | Rol/permission testleri                 | Done              |
| MVP-003 | Güvenli upload ve cleanup         | P0       | MVP-001      | Upload/retention testleri               | Done              |
| MVP-004 | Intent, ambiguity ve preview      | P0       | MVP-002/003  | Strict schema ve target testleri        | Done              |
| MVP-005 | Queue, Navori adapter ve audit    | P0       | MVP-004      | Mock publish/retry/idempotency testleri | Done              |
| MVP-006 | Dashboard/admin/operations UI     | P1       | MVP-002/005  | Responsive kritik ekranlar              | Done              |
| MVP-007 | Docker/Coolify production package | P0       | MVP-005      | Build/health/migration/runbook          | Done              |
| OPS-001 | Coolify mock smoke deployment     | P0       | MVP-007      | HTTPS, health, web+worker, volume geçer | Ready             |
| INT-001 | Navori tenant contract doğrulama  | P0       | OPS-001      | Readiness ve kontrollü test yayını      | Blocked by tenant |
