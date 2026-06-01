# Phase 1: 要件定義（監査スコープ・inventory）

> 親骨格: NON_VISUAL / 監査タスク用 Phase Template（`.claude/skills/task-specification-creator/references/phase-template-audit-task.md`）

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 1 / 13 |
| 種別 | docs-only / 設計判定（NON_VISUAL） |
| implementation_mode | verify_existing |
| 前 Phase | なし |
| 次 Phase | 2（設計：ギャップ分析） |
| 主成果物 | outputs/phase-01/main.md |

## 目的

判定タスクの監査スコープを固定し、判定に必要な inventory（現行 ledger 群・UT-21 audit 観点・判定基準）を列挙する。実装タスクの「AC 固定」を「監査スコープ定義 + 正本候補列挙」に再解釈する。

## 実行タスク

1. **タスク分類の記録**: `taskType: NON_VISUAL` / `implementation_mode: verify_existing` / docs-only を明記。CLOSED Issue 由来のため `issue_closed_reason`（親 close-out 完了に伴う一括 CLOSED）/ `spec_purpose`（確定判定の証跡化）を記録する。
2. **監査スコープ inventory 抽出**: 棚卸し対象を root 区分付きで列挙する。
   - `apps/api/migrations/0003_auth_support.sql`（`sync_jobs` DDL）
   - `apps/api/migrations/0002_sync_logs_locks.sql`（`sync_job_logs` / `sync_locks` DDL）
   - `apps/api/src/jobs/_shared/sync-jobs-schema.ts`（`metrics_json` zod schema）
   - `apps/api/src/repository/syncJobs.ts`（lifecycle）
   - `apps/api/migrations/0014_notification_outbox.sql`（outbox 前例）
3. **UT-21 audit 観点の確定**: 原典 U02 §4.2 の 4 観点（実行ごと詳細 / outbox 失敗退避 / 後追い清書 / 行単位差分）を列挙する。
4. **判定基準の確定**: 原典 U02 §4.3 の 3 条件を逐語で固定する。
5. **AC への監査成果物の埋め込み**: AC-3（ギャップ表）/ AC-5（判定）/ AC-9（非存在実測）を「監査対象の具体的成果物」として AC に含める。
6. **既存コード命名規則の確認**: snake_case（DB 列 / テーブル）と camelCase（TS row mapping）の境界を記録する。
7. **4条件評価の一次結論**: 価値性 / 実現性 / 整合性 / 運用性を先に示す。

## 参照資料

- `docs/30-workflows/completed-tasks/issue-235-sync-audit-tables-necessity-judgement/index.md`
- `docs/30-workflows/unassigned-task/task-ut21-sync-audit-tables-necessity-judgement-001.md`
- `.claude/skills/task-specification-creator/SKILL.md`
- `.claude/skills/aiworkflow-requirements/SKILL.md`

## 統合テスト連携

- 本 Phase は docs-only / NON_VISUAL 判定タスクのため、新規統合テストは追加しない。
- 判定の一次証跡は Phase 11 の read-only 再現コマンドで取得する。

## 完了条件

- [ ] `taskType` / `implementation_mode` / docs-only を meta に明記
- [ ] 監査スコープ inventory（5 ファイル群）を root 区分付きで列挙
- [ ] UT-21 audit 観点 4 種・判定基準 3 条件を逐語固定
- [ ] CLOSED Issue 由来の `issue_closed_reason` / `spec_purpose` を記録
- [ ] 4条件の一次結論を記録

## 成果物/実行手順

- `outputs/phase-01/main.md`
