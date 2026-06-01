# Phase 1 Output: 要件定義（監査スコープ・inventory）

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | task-ut21-sync-audit-tables-necessity-judgement-001 |
| Phase | 1 / 13 |
| taskType | NON_VISUAL / docs-only / 設計判定 |
| implementation_mode | verify_existing |
| issue_closed_reason | 親 close-out（Issue #234）完了に伴う Wave 1 一括 CLOSED。本タスク固有の解決により CLOSED したわけではなく、確定判定の証跡は未記録だった |
| spec_purpose | `sync_audit_logs` / `sync_audit_outbox` 新設要否の確定判定を成果物として記録し、親 close-out §(d) の「保留」を閉じる |

## 1. 真の論点（1 文固定）

> UT-21 が前提とした二段監査テーブル（`sync_audit_logs` + `sync_audit_outbox`）を **今 新設すべきか**、それとも最新コードの `sync_jobs` ledger 群で audit 観点を充足できるため **新設不要** と確定できるか。

- `what`: 監査テーブル新設要否の判定。
- `how`: 現行 ledger 群の棚卸し × UT-21 audit 観点のギャップ分析 × 判定基準 4.3 適用。
- `why now`: 親 close-out が「保留（U02 委譲）」のまま閉じており、確定判定の証跡が欠落しているため。
- `why this way`: コードを変えずに判定（docs-only）で閉じられる論点であり、実需が出るまで新設を遅延させるのが最小コスト。

## 2. 監査スコープ inventory（root 区分付き）

| # | パス | root | 役割 | 棚卸し観点 |
| --- | --- | --- | --- | --- |
| I-1 | `apps/api/migrations/0003_auth_support.sql` | apps/api（D1 DDL） | `sync_jobs` 本体 ledger | カラム構成・status 遷移 |
| I-2 | `apps/api/migrations/0002_sync_logs_locks.sql` | apps/api（D1 DDL） | `sync_job_logs`（run 単位カウント）/ `sync_locks`（TTL ロック） | カウント列・index |
| I-3 | `apps/api/src/jobs/_shared/sync-jobs-schema.ts` | apps/api（TS） | `metrics_json` zod schema / PII 禁止キー | 構造化キー・検証 |
| I-4 | `apps/api/src/repository/syncJobs.ts` | apps/api（TS） | `sync_jobs` lifecycle（start/succeed/fail/findLatest/listRecent） | 書込経路・失敗記録 |
| I-5 | `apps/api/migrations/0014_notification_outbox.sql` | apps/api（D1 DDL） | `notification_outbox`（既存 outbox 前例） | 実需ベース新設の運用根拠 |

> いずれも `apps/api` 配下（不変条件 #5 整合）。`apps/web` から D1 を参照する記述は持ち込まない。

## 3. UT-21 audit 観点（原典 U02 §4.2 逐語）

| 観点 | UT-21 仕様での扱い | 判定対象の問い |
| --- | --- | --- |
| O-1 実行ごとの詳細ログ | `sync_audit_logs` 行ごと書き込み | `metrics_json` + `sync_job_logs` で代替可能か |
| O-2 audit 書き込み失敗時 retry | `sync_audit_outbox` で best-effort 蓄積 | `sync_jobs` 自体の書込失敗リカバリ経路が必要か |
| O-3 後追い清書 | outbox → audit_logs へ flush | O-2 が不要なら同じく不要 |
| O-4 個別行レベル差分追跡 | row 単位 audit row | `metrics_json` の集計値で足りるか |

## 4. 判定基準（原典 U02 §4.3 逐語固定）

以下のいずれかが該当する場合のみ新設を検討する:

1. 行単位の差分追跡が運用上の必須要件である。
2. `sync_jobs` テーブル自体への書き込み失敗を別経路で記録する必要がある。
3. 監査要件（外部監査・コンプラ）で「実行履歴を別テーブルに分離する」要請がある。

該当しない場合: `metrics_json` の構造化と `sync_jobs` の retention 方針で足りる。

## 5. 命名規則の境界

- D1 DDL: snake_case（`job_id` / `job_type` / `metrics_json` / `error_json` / `sync_job_logs`）。
- TS row mapping: camelCase（`jobId` / `jobType` / `metricsJson`）。`SELECT_COLS` で `AS` エイリアス変換。
- 判定文書では DDL は snake_case、コード参照は camelCase を維持し混在させない。

## 6. AC への監査成果物の埋め込み

| AC | 監査成果物 | 生成 Phase |
| --- | --- | --- |
| AC-3 | UT-21 観点 × ledger ギャップ表 | Phase 2 |
| AC-4 | 判定基準 3 条件の該当/非該当 | Phase 2 |
| AC-5 | 最終判定（一意） | Phase 2 / 5 |
| AC-9 | `sync_audit_*` 非存在 rg/grep 出力 | Phase 4 |

## 7. 4条件評価（一次結論）

| 条件 | 一次結論 | 根拠（詳細は Phase 7 / 10） |
| --- | --- | --- |
| 価値性 | PASS | 「保留」状態を確定判定へ閉じ、将来の再 litigation コストと過剰実装リスクを同時に下げる |
| 実現性 | PASS | 最新コード実測で判定可能。コード変更ゼロで本サイクル内完結 |
| 整合性 | PASS | 親 close-out §(d) 解除条件と矛盾せず、不変条件 #4 / #5 を変更しない |
| 運用性 | PASS | 解除条件を明記し、将来実需時の受け皿（別実装タスク）を定義する |

## 8. carry-over 確認

- 前タスク成果物: 親 close-out `ut21-forms-sync-conflict-closeout`（completed-tasks 配下）。本タスクはその Phase 2 §(d) で委譲された判定の確定。
- 差異: 親は「保留方針 + 解除条件」を設計したのみ。本タスクは「最新コード実測 → 確定判定」を新規に行う。
