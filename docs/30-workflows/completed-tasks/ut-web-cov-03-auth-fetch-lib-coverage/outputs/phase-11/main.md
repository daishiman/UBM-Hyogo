# outputs phase 11: ut-web-cov-03-auth-fetch-lib-coverage

[実装区分: 実装 / NON_VISUAL evidence]

## 実測 coverage 抜粋

Source: `apps/web/coverage/coverage-summary.json`

| file | Stmts | Lines | Funcs | Branches | 判定 |
| --- | --- | --- | --- | --- | --- |
| apps/web/src/lib/auth.ts | 89.9 | 89.9 | 90 | 88.76 | PASS |
| apps/web/src/lib/auth/magic-link-client.ts | 100 | 100 | 100 | 100 | PASS |
| apps/web/src/lib/auth/oauth-client.ts | 100 | 100 | 100 | 100 | PASS |
| apps/web/src/lib/session.ts | 100 | 100 | 100 | 100 | PASS |
| apps/web/src/lib/fetch/authed.ts | 100 | 100 | 100 | 100 | PASS |
| apps/web/src/lib/fetch/public.ts | 100 | 100 | 100 | 100 | PASS |
| apps/web/src/test-utils/fetch-mock.ts | 97.87 | 97.87 | 100 | 92.3 | PASS |
| apps/web total | 78.72 | 78.72 | 74.87 | 86.75 | package-wide gap remains delegated |

## before/after 比較

| ファイル | before Lines | after Lines |
| --- | --- | --- |
| auth/fetch/session 対象6ファイル | 0% baseline | 89.9% 以上 |
| apps/web total | 39.39% baseline | 78.72% |

## evidence path

- `apps/web/coverage/coverage-summary.json`
- `apps/web/coverage/coverage-final.json`
- `docs/30-workflows/ut-web-cov-03-auth-fetch-lib-coverage/outputs/phase-11/manual-smoke-log.md`
- `docs/30-workflows/ut-web-cov-03-auth-fetch-lib-coverage/outputs/phase-11/link-checklist.md`

`visualEvidence: NON_VISUAL` のためスクリーンショットは取得しない。
