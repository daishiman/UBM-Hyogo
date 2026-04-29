# Phase 7 — AC マトリクス

| AC | 内容 | test ID | runbook | failure |
|---|---|---|---|---|
| AC-1 | 5 つの AuthGateState (input/sent/unregistered/rules_declined/deleted) | resolve-gate-state.test, auth-routes.test R1-R3 | S3.1, S6 | F-02, F-03, F-04 |
| AC-2 | unregistered 判定 (identity 無し) | resolve-gate-state.test R1 | S3.1 | F-02 |
| AC-3 | rules_declined / deleted の優先度 | resolve-gate-state.test R2/R3 | S3.1 | F-03, F-04 |
| AC-4 | token 15 分 TTL + 64hex | issue-magic-link.test, schemas zod | S3.3, S6.1 | F-13 |
| AC-5 | expired -> reason=expired | verify-magic-link.test T-02 | S3.4 | F-13 |
| AC-6 | already_used (二重使用) | verify-magic-link.test T-03 | S3.4 | F-14 |
| AC-7 | `/no-access` route 不在 + D1 直参照不在 | no-access-fs-check.sh | S9 | (静的検証) |
| AC-8 | secret hygiene (MAIL_PROVIDER_KEY 等は env のみ) | (Phase 9 H-01〜H-05) | S6.4 | F-10 |
| AC-9 | not_found / resolve_failed | verify-magic-link.test T-04/T-05, auth-routes.test F-09 | S3.4 | F-12, F-15 |
| AC-10 | resolve-session 失敗時に session 未発行 / admin lookup | resolve-session.test RS-01〜05 | S3.2 | F-16 |
