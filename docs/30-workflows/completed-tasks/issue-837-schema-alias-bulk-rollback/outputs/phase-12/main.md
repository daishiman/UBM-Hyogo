# Phase 12 main — issue-837-schema-alias-bulk-rollback

## サマリ

本 Phase 12 パッケージは Issue #837「schema alias 複数一括 rollback」の `implemented_local_evidence_captured` UI task（VISUAL / runtime screenshot pending）close-out 成果物群である。

- workflow_state: `implemented_local_evidence_captured`
- taskType: `implementation` / visualEvidence: `VISUAL`
- implementation_mode: `feature-extension`（既存 single rollback endpoint `POST /admin/schema/aliases/:aliasId/rollback` を client-side bounded fan-out で呼び出す。新 endpoint / D1 変更なし）
- local evidence: `outputs/phase-11/typecheck-local.txt`, `outputs/phase-11/focused-vitest-local.txt`
- PR base: `dev`。commit / push / PR / Issue mutation は user-gated。

automation-30 再検証で、初稿の `spec_created` close-out が CONST_004/005 と矛盾することを検出したため、同サイクルで apps/web 実装・focused tests・正本仕様同期まで完了した。runtime screenshot / staging smoke は user-gated evidence として残す。

## Phase 12 タスク完了状況

| Task | 名称 | 状況 | 成果物 |
| --- | --- | --- | --- |
| Task 1 | 実装ガイド作成（Part 1/Part 2 + 視覚証跡） | completed | [`implementation-guide.md`](implementation-guide.md) |
| Task 2 | システム仕様更新サマリ（Step 1-A〜1-C + Step 2） | completed | [`system-spec-update-summary.md`](system-spec-update-summary.md) |
| Task 3 | ドキュメント更新履歴 | completed | [`documentation-changelog.md`](documentation-changelog.md) |
| Task 4 | 未タスク検出レポート（0件でも出力必須） | completed | [`unassigned-task-detection.md`](unassigned-task-detection.md) |
| Task 5 | スキルフィードバックレポート（改善点なしでも出力必須） | completed | [`skill-feedback-report.md`](skill-feedback-report.md) |
| Task 6 | Phase 12 仕様準拠チェック | completed | [`phase12-task-spec-compliance-check.md`](phase12-task-spec-compliance-check.md) |

## same-wave sync

| Step | 本タスクでの扱い |
| --- | --- |
| Step 1-A | aiworkflow / task-specification-creator LOGS と indexes を同波更新 |
| Step 1-B | 実装状況テーブルに `implemented_local_evidence_captured` を記録 |
| Step 1-C | #778 / #776 / source unassigned-task の current facts を更新 |
| Step 2 | `rollbackSchemaAliasBulk` / `SchemaDiffBulkRollbackModal` / `useSchemaDiffBulkRollbackSelection` と manual specs 01/11 を反映 |

## スコープ境界

本サイクルで閉じた範囲:

- `apps/web/src/lib/admin/api.ts` への `rollbackSchemaAliasBulk` helper 追加。
- 新規 `SchemaDiffBulkRollbackModal.tsx` / `useSchemaDiffBulkRollbackSelection.ts`。
- `SchemaDiffPanel.tsx` の HistoryPane への bulk rollback mode 統合（checkbox / select-all / 件数バッジ / 50 件上限 alert）。
- focused tests: API helper / hook state machine / modal / panel regression。
- specs / aiworkflow ledgers / source unassigned consumed trace。

スコープ外:

- batch parent-child audit log 構造（API/D1 変更を要するため。per-alias audit で AC 充足）。
- recompute trigger（followup-005）/ rollback notification（followup-007）として独立分離済み。

## user-gated 境界

authenticated runtime screenshot、staging smoke、commit、push、PR、CLOSED Issue mutation は user 明示承認後に実行する。
