# Phase 11 成果物: 手動 smoke サマリ — forms-schema-sync-and-stablekey-alias-queue

## 1. スコープ

本タスクは UI を持たない（`ui_routes: []`）。よって Apple UI/UX 視覚的検証は **N/A**。
代替として `POST /admin/sync/schema` の動作 evidence をドキュメントとして整備し、
Wave 9b で staging 実機実行する際の **ドライラン手順書** を本フェーズで完結させる。

## 2. 結論

- 判定: **PASS（dry-run）**
- 既存 vitest 結果（194 / 194 PASS — Phase 5 main.md）を一次 evidence として参照。
- 実 staging に対する curl / wrangler 実行は Cloudflare secrets provisioning と staging 環境準備後に実施。

## 3. 実施内容

| # | サブタスク | 状態 | 備考 |
| --- | --- | --- | --- |
| 1 | local 起動手順記述 | completed | manual-evidence.md §A |
| 2 | 同期実行 curl 例 | completed | manual-evidence.md §B（200 / 401 / 403 / 409） |
| 3 | row 確認 wrangler 例 | completed | manual-evidence.md §C（31 / 1 / 0） |
| 4 | 排他確認手順 | completed | manual-evidence.md §B-4 |
| 5 | evidence 保存 | completed | outputs/phase-11/manual-evidence.md |

## 4. 不変条件チェック

| 観点 | 不変条件 | 結果 |
| --- | --- | --- |
| schema 集約 | #14 | sync 後 schema_questions 31 / schema_diff_queue 0 row を期待 |
| 排他 | sync_jobs | 同種 running 時 409 Conflict |
| 無料枠 | #10 | 1 sync で D1 write 約 35 row（< daily quota） |
| stableKey 直書き禁止 | #1 | resolveStableKey 経由 31 件解決（unit test 担保） |

## 5. 引き継ぎ

- wave 9b（infrastructure activation）で staging 実機 curl / wrangler 実行 → 同 evidence 様式で追記。
- 本ドキュメント様式（manual-evidence.md）は wave 9b の release runbook テンプレとして再利用可能。

## 6. 関連リンク

- evidence: `outputs/phase-11/manual-evidence.md`
- runbook: `outputs/phase-05/sync-runbook.md`
- failure cases: `outputs/phase-06/failure-cases.md`
- 実装: `apps/api/src/sync/schema/`、`apps/api/src/routes/admin/sync-schema.ts`、`apps/api/src/middleware/admin-gate.ts`
