# Phase 9: 品質保証

## 目的

静的品質・リンク・parity を一括判定する。

## 検証コマンドと expected

| コマンド | expected |
| -------- | -------- |
| `mise exec -- pnpm typecheck` | pass（mint helper TS 含む） |
| `mise exec -- pnpm lint` | pass |
| `shellcheck -e SC2016 scripts/smoke/runtime-admin-web.sh scripts/cf.sh` | 重大警告なし |
| `go run github.com/rhysd/actionlint/cmd/actionlint@v1.7.7 .github/workflows/web-cd.yml` | エラーなし |
| `bash scripts/smoke/__tests__/runtime-admin-web.test.sh` | 全ケース PASS |
| `pnpm exec vitest run scripts/smoke/__tests__/mint-staging-session-cookie.spec.ts` | 全ケース PASS |
| `pnpm test:workflow-secrets`（redaction-check + workflow-env-scope） | pass（`admin-runtime-smoke` job の `CLOUDFLARE_API_TOKEN` は step-scoped。job-level env 禁止 gate を通過） |
| `bash scripts/verify-pr-ready.sh` | verify:phase12-compliance PASS / gate-metadata PASS / indexes:rebuild drift FAIL（generated indexes are intentionally uncommitted in this no-commit scope） |
| `pnpm exec node scripts/gate-metadata/validate.ts`（または `pnpm gate-metadata:validate`） | pass |
| `pnpm verify:phase12-compliance` | pass（本タスク root の 9 canonical heading + Phase 11 evidence） |

## 不変条件 parity チェック

| 不変条件 | 検証 |
| -------- | ---- |
| wrangler 直叩き禁止 | `grep -rn 'wrangler tail' scripts/smoke/` が 0 件（cf.sh 経由のみ） |
| JWT/cookie 非露出 | redaction grep gate + mint helper の echo 禁止 test |
| 新規 test は `*.spec.ts` / shell は `*.test.sh` | lefthook `block-test-suffix` を通過 |
| 既存 API surface 不変 | 新 endpoint なし。`/admin` + health のみ |

## 完了判定

- [x] 静的 9 コマンド pass
- [x] gate-metadata / phase12-compliance pass; verify-pr-ready residual is generated index drift only
- [x] 不変条件 parity pass
