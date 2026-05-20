# Unassigned task detection + fold-state sync

## fold-state sync（既存 unassigned-task）

| パス | 同期内容 |
| --- | --- |
| docs/30-workflows/unassigned-task/followup-issue-720-001-prod-env-monitor-secret-cleanup.md | `status: consumed_via_issue_772_runtime_restoration_spec` / `consumed_at: 2026-05-17` / `consuming_workflow: docs/30-workflows/issue-772-cf-audit-monitor-runtime-restoration-and-cleanup/` を メタ情報セクションに追記。CLOSED Issue #772 を reopen しない fold-state sync 運用に従う（issue-720 Phase 12 知見 §4.3）。 |

## 新規発生候補（runtime 段階で発見されうるもの）

### UT-772-001: `cf-audit-log-7day-summary.yml` 168h 集約復旧確認

- **発火条件**: 本タスクで hourly 6 連続 success が達成された後、`cf-audit-log-7day-summary.yml` の 168h 集約が引き続き fail する場合
- **対応**: 別 followup issue / workflow として切り出し、本タスク完了時に状態が確定するまで保留
- **記録場所**: 本ファイル

### UT-772-002: repo-level variables 値踏襲時の振る舞い乖離

- **発火条件**: production env 既設値 (`CF_AUDIT_CLASSIFIER=ml` 等) を repo-level に踏襲した後、hourly が classifier 関連で fail する場合
- **対応**: variables 値の見直しを別 followup として記録。本タスクスコープ内では対応しない
- **記録場所**: 本ファイル

### UT-772-003: 観測中の transient failure 取扱

- **発火条件**: 6h 観測中に Cloudflare API incident / runner 障害等の transient failure が混入し 6 連続 success が達成できない場合
- **対応**: 観測延長 + 原因を別 incident 記録に分離。本タスクの evidence は 6 連続達成後に確定
- **記録場所**: 本ファイル

## 不変条件

1. CLOSED Issue #772 は reopen しない
2. 上記 UT-* は runtime 段階で発火が確認された場合のみ正式 unassigned-task として `docs/30-workflows/unassigned-task/` に書き出す
3. fold-state sync の文言は task-specification-creator skill 規定の `consumed_via_*` を採用
