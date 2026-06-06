# Phase 12 Main — issue-1081-bulk-tag-real-d1-runtime-smoke

## タスク要約

issue #1081「bulk tag real D1 runtime smoke」の実装仕様書。`POST /admin/members/tags/bulk`（`apps/api/src/routes/admin/members.ts`・issue-1036 で landed 済）を Cloudflare Workers staging + `ubm-hyogo-db-staging` real D1 に対して実走させ、bulk assign / 再送 no-op / unassign / audit count parity / cleanup の runtime 証跡を自動取得する基盤を新設した。endpoint 実装自体は変更しない。本サイクルで runner / seed・cleanup SQL / CI job / local test のコード化と local evidence 取得まで完了し、staging 実走証跡取得のみ user-gated。

issue 本文の `200 + assigned` 単値記述・`@repo/api` は実装と乖離しており、実 contract（`200 + {batchId, results:[{memberId,tagId,status}]}`、`@ubm-hyogo/api`）へ最適化した。test fixture prefix は親タスク衝突回避のため `e2e_test_issue1081_` に固定する。

## 成果物

- 仕様書 13 phase（`outputs/phase-1..13/phase-N.md`）
- strict 7 outputs（本 dir）
  1. `main.md`
  2. `implementation-guide.md`
  3. `system-spec-update-summary.md`
  4. `documentation-changelog.md`
  5. `unassigned-task-detection.md`
  6. `skill-feedback-report.md`
  7. `phase12-task-spec-compliance-check.md`
- `artifacts.json` / `outputs/artifacts.json`（gates: Gate-A passed / Gate-B pending / Gate-C pending）
- Phase 11 evidence ledger（`outputs/phase-11/phase-11.md` + local evidence 2 件 present / staging runtime evidence pending）

## 実装対象（本サイクルで実装済み）

| # | 区分 | パス | 概要 |
| - | ---- | ---- | ---- |
| 1 | NEW | `scripts/smoke/runtime-tag-bulk.sh` | staging bulk tag mutation smoke runner（seed→assign→retry noop→unassign→audit count→cleanup の orchestration + contract assert + redaction + production guard） |
| 2 | NEW | `apps/api/migrations/seed/bulk-tag-staging-seed.sql` | `e2e_test_issue1081_*` synthetic member / tag を staging real D1 へ投入 |
| 3 | NEW | `apps/api/migrations/seed/bulk-tag-staging-cleanup.sql` | `e2e_test_issue1081_%` データを 6 テーブルから削除（全 WHERE prefix 限定） |
| 4 | EDIT | `.github/workflows/runtime-smoke-staging.yml` | `bulk-tag-runtime-smoke` job 追加（`environment: staging-runtime-smoke` 承認 gate） |
| 5 | NEW | `scripts/smoke/__tests__/runtime-tag-bulk.test.sh` | runner の引数 parse / production guard / redaction / contract assertion 関数の local 検証（real D1 接続なし） |

> 成果物 1〜5 のコード化は本サイクルで完了。runbook + Phase 11 evidence ledger は本 dir 内に同梱する。

## 状態

- workflow_state: `implemented_local_evidence_captured`（コード実装・local smoke test・actionlint 完了。staging real D1 実走は user-gated）
- Gate-A: passed（spec compliance）
- Gate-B: pending（staging deploy + real D1 seed/mutation/cleanup の実走証跡 = user-gated）
- Gate-C: pending（commit / push / PR = user-gated・Phase 13）
- issue #1081: CLOSED 維持（本仕様書作成で state を変更しない）
- visualEvidence: NON_VISUAL（CI / runtime smoke gate 追加。UI 表示物の変更なし）
