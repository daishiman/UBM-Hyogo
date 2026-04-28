# 未タスク検出 — forms-schema-sync-and-stablekey-alias-queue

## 1. 概要

本タスクは Phase 1〜10 の設計と Phase 5 で示した実装ランブック範囲で完結している。
基本的に **「該当なし（未タスクなし）」** が結論。
ただし、本タスクの downstream（07b alias 管理 UI / 06c admin schema page）および
wave 9b（infra activation）への引き継ぎ事項は明示しておく。

## 2. 検出結果

| 検出項目 | 引き取り先 | 状態 | 備考 |
| --- | --- | --- | --- |
| `schema_aliases` テーブル DDL | 07b-parallel-schema-diff-alias-assignment-workflow | 未タスク作成済み | `docs/30-workflows/unassigned-task/task-03a-schema-aliases-ddl-001.md` |
| back-fill 戦略（既存 response の stableKey 再マップ） | 07b-parallel-schema-diff-alias-assignment-workflow | 引き取り済 | 本タスクスコープ外（response sync は 03b、再マップは 07b） |
| sync 共通モジュール（`_shared/ledger.ts`） | 03b-parallel-forms-response-sync と共同保守 | 確認要 | 03a / 03b 双方で sync_jobs ledger を使用するため重複防止策を後続調整で確定 |
| `/admin/schema` UI（schema_questions / schema_diff_queue 表示） | 06c admin schema page | 引き取り済 | 本タスクは API 側のみ。UI は 06c |
| alias 管理 UI（unresolved → stableKey 割当） | 07b schema-diff-alias-assignment-workflow | 引き取り済 | 本タスクは queue 投入まで |
| `/admin/sync/schema` の expose 設定（admin router 統合） | 04c admin-backoffice-api-endpoints | 引き取り済 | 本タスクで route 実装は完了、上位 admin router 統合は 04c |
| Cloudflare secrets provisioning / staging 実 Forms smoke | wave 9b infrastructure activation | 引き取り済 | `makeDefaultSchemaSyncDeps` は実装済み。本番値投入と実環境 smoke は 9b |
| ESLint custom rule（stableKey 直書き禁止の静的検証） | wave 8b lint config | 未タスク作成済み | `docs/30-workflows/unassigned-task/task-03a-stablekey-literal-lint-001.md` |
| E2E（`/admin/schema` 経由の手動同期） | wave 8b | 引き取り済 | Phase 10 H-3 |
| `/admin/sync/schema` 運用ドキュメント / token rotation 手順 | wave 9b | 引き取り済 | Phase 10 H-4。本ガイドの Part 2「運用」を雛形として転用 |
| 02b/02c/旧03a workflow 削除の意図確認 | docs workflow maintainer | 未タスク作成済み | `docs/30-workflows/unassigned-task/task-03a-workflow-relocation-audit-001.md` |

## 3. 結論

- 本タスク内で **未割当（不明な責務）として残るものはない**。
- 上記 10 件はすべて downstream タスクまたは後続 wave の既知スコープに該当し、
  Phase 10 の保留事項（H-1〜H-4）と整合する。
- 07b / 06c / 04c / wave 8b / wave 9b の着手時に本ファイルを参照すること。
