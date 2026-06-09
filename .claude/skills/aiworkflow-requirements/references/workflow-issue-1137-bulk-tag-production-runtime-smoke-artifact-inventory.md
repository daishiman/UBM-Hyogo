# workflow-issue-1137-bulk-tag-production-runtime-smoke Artifact Inventory

## Summary

| 項目 | 値 |
| --- | --- |
| workflow | `docs/30-workflows/completed-tasks/issue-1137-bulk-tag-production-runtime-smoke/` |
| status | `implemented_local_runtime_pending / implementation / NON_VISUAL` |
| issue | #1137 CLOSED 維持 |
| purpose | issue-1081 の staging bulk tag mutation runtime smoke を production Workers + `ubm-hyogo-db-prod` real D1 用へ拡張 |

## Implementation

| 種別 | パス |
| --- | --- |
| runner | `scripts/smoke/runtime-tag-bulk.sh` |
| seed | `apps/api/migrations/seed/bulk-tag-production-seed.sql` |
| cleanup | `apps/api/migrations/seed/bulk-tag-production-cleanup.sql` |
| CI | `.github/workflows/production-runtime-smoke.yml` |
| test | `scripts/smoke/__tests__/runtime-tag-bulk.test.sh` |
| evidence | `docs/30-workflows/completed-tasks/issue-1137-bulk-tag-production-runtime-smoke/outputs/phase-11/evidence/runtime-tag-bulk-test.log`, `runtime-tag-bulk-actionlint.log` |

## Gates

- Local shell test: `bash scripts/smoke/__tests__/runtime-tag-bulk.test.sh` PASS.
- Workflow lint: `go run github.com/rhysd/actionlint/cmd/actionlint@v1.7.7 .github/workflows/production-runtime-smoke.yml` PASS.
- Production real D1 seed / mutation / cleanup evidence remains user-gated.
- Commit / push / PR remain user-gated.

## Invariants

- Existing staging fixture prefix `e2e_test_issue1081_` and staging seed/cleanup SQL remain unchanged.
- Production fixture prefix is `e2e_test_prod_tagbulk_` only.
- Production runner requires `PRODUCTION_API_BASE`, `PRODUCTION_ADMIN_BEARER`, `ubm-hyogo-db-prod`, production host allowlist, and dual marker `BULK_TAG_PRODUCTION_SMOKE_APPROVAL=issue-1137-production-bulk-tag-smoke` plus `BULK_TAG_PRODUCTION_SMOKE_CONFIRM=I_UNDERSTAND_THIS_MUTATES_PRODUCTION_D1`.

## Lessons Learned

| # | Lesson | How to apply |
| --- | --- | --- |
| L-I1137-001 | issue 本文が dead worktree path（`…/task-20260603-180735-wt-10/…`）、存在しないパッケージ名 `@repo/api`、単値 response（実 contract は `{batchId, results:[].status}`）を参照していた。issue 本文を正としてコード化すると誤った guard / コマンド / 集計を実装する。 | 正本順位 1（実コードの contract / guard）で issue 本文を上書きし、乖離点を index.md 冒頭の「issue 本文と最新コードの乖離」表に明示してから実装する。パッケージ名・response shape・既存 guard 行番号は着手時に実ファイルで再確認する。 |
| L-I1137-002 | production host allowlist を部分文字列一致で評価すると `https://example.test/path/api.ubm-hyogo.workers.dev` のような path 埋め込み URL を誤許可する。 | host を `${BASE#*://}` → `%%/*`（path 除去）→ `%%:*`（port 除去）で抽出し、anchored regex `^(ubm-hyogo-api\.[A-Za-z0-9-]+\.workers\.dev\|api\.ubm-hyogo\.workers\.dev)$` で評価する。回帰は test `production-host-substring-refused` で固定。 |
| L-I1137-003 | production 経路を別 runner へ派生させると staging guard が複製され drift する。#922 `runtime-admin-web.sh` の単一 runner env 分岐が先例。 | 単一 runner を `staging\|production` で env 分岐し、`assert_staging_guard` は逐語不変で温存。`main()` で env により `assert_production_guard` へ分岐する。staging path 非退化（AC-6）を local test で固定する。 |
| L-I1137-004 | production real D1 への write を伴う smoke は、local 実装完了と production 実走を同一サイクルで混ぜると誤実行リスクが残る。 | runner / SQL fixture / CI job / local stub test / Phase 11 evidence ledger は同一 cycle で実装し `implemented_local_runtime_pending` へ昇格。real D1 seed/mutation/cleanup evidence は runner 内 dual marker + GitHub `environment: production-runtime-smoke` 承認の二重 gate で user-gated に残す（先送りではなく副作用境界の実行タイミング分離）。 |
| L-I1137-005 | staging / production で env 変数名（`STAGING_API_BASE` / `PRODUCTION_API_BASE` 等）が異なるため、分岐ごとに直書きすると重複する。また production 既定 OUT_DIR で明示 `--out-dir` を上書きする事故が起きやすい。 | `configure_environment` で env-prefix 間接参照（`${!api_base_var}`）に集約し変数名を 1 箇所で解決する。OUT_DIR は staging 既定値のときだけ production 既定へ振替え、利用者の明示指定は上書きしない。 |
