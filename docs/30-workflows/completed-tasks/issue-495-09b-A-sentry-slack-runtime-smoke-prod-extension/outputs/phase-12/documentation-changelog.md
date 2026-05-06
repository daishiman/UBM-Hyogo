# Documentation Changelog

| File | Reason | Related AC |
| --- | --- | --- |
| `apps/api/src/routes/admin/smoke-observability.ts` | Enable production smoke with explicit confirmation gate. | AC-P1, AC-P2, AC-P3, AC-P4 |
| `apps/api/src/routes/admin/smoke-observability.test.ts` | Add production gate and redaction-safe behavior tests. | AC-P1, AC-P2, AC-P3, AC-P4 |
| `apps/api/wrangler.toml` | Document env-scoped Cloudflare Secret placement without storing values. | AC-P1 |
| Workflow `phase-02.md`, `phase-05.md`, `phase-09.md`, `phase-11.md` | Fix secret placement wording, staging evidence boundary, grep scope, and production channel evidence. | AC-P1 to AC-P6 |
| Phase 11 runtime templates | Materialize manifest-listed runtime evidence paths without claiming PASS. | AC-P5, AC-P6 |
| aiworkflow requirement references and indexes | Sync production smoke extension into canonical specs. | AC-P1 to AC-P6 |
