# Phase 9: 品質保証

## 目的

静的品質・リンク・parity を一括判定する。

## 検証コマンドと expected

| コマンド | expected |
| -------- | -------- |
| `mise exec -- pnpm typecheck` | pass（mint helper TS / `resolveEnvPrefix` 含む）|
| `mise exec -- pnpm lint` | pass |
| `shellcheck -e SC2016 scripts/smoke/runtime-admin-web.sh` | 重大警告なし |
| `go run github.com/rhysd/actionlint/cmd/actionlint@v1.7.7 .github/workflows/web-cd.yml` | エラーなし |
| `bash scripts/smoke/__tests__/runtime-admin-web.test.sh` | staging 既存ケース + production TC-PA〜PH + FP-P1〜P4 全件 PASS |
| `pnpm exec vitest run scripts/smoke/__tests__/mint-staging-session-cookie.spec.ts` | staging 既存ケース + production TC-P1〜P7 + FP-P5〜P6 全件 PASS |
| `pnpm test:workflow-secrets`（redaction-check + workflow-env-scope）| pass（`admin-runtime-smoke-production` job の `CLOUDFLARE_API_TOKEN` は step-scoped）|
| `bash scripts/verify-pr-ready.sh` | verify:phase12-compliance PASS / gate-metadata PASS / indexes:rebuild drift FAIL（generated indexes are intentionally uncommitted in this no-commit scope）|
| `pnpm gate-metadata:validate` | pass |
| `pnpm verify:phase12-compliance` | pass（本タスク root の 9 canonical heading + Phase 11 evidence）|

## 不変条件 parity チェック

| 不変条件 | 検証 |
| -------- | ---- |
| wrangler 直叩き禁止 | `grep -rn 'wrangler tail' scripts/smoke/` が 0 件（cf.sh 経由のみ）|
| JWT/cookie 非露出 | redaction grep gate + mint helper の echo 禁止 test（staging + production 両方）|
| 新規 test は `*.spec.ts` / shell は `*.test.sh` | lefthook `block-test-suffix` を通過。本タスクは既存ファイル拡張のみ |
| 既存 API surface 不変 | 新 endpoint なし。`/admin`（既存 route）のみ |
| env-scope gate（`scripts/__tests__/workflow-env-scope.test.sh`）| `CLOUDFLARE_API_TOKEN` を job-level に置かない gate を通過 |
| `apps/web` env 不変条件 | 本タスクは web ソース変更を伴わない |

## 完了判定

- [x] 静的 10 コマンド pass
- [x] gate-metadata / phase12-compliance pass; verify-pr-ready residual is generated index drift only
- [x] 不変条件 parity pass（cross-env leak 防止含む）
