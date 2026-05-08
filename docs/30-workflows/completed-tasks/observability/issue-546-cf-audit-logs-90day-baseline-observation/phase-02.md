# Phase 2: 既存仕様・runtime 基盤調査

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | `issue-546-cf-audit-logs-90day-baseline-observation` |
| Phase | 2 |
| Phase 名 | 既存仕様・runtime 基盤調査 |
| taskType | `docs-only` |
| visualEvidence | `NON_VISUAL` |
| workflow_state | `spec_created` |

[実装区分: ドキュメントのみ]

## 目的

90 日観測に使う既存ファイル、workflow、D1 schema、正本仕様を特定する。

## 実行タスク

| Task | 内容 | 出力 |
| --- | --- | --- |
| 2-1 | 本 Phase の対象資料と既存実装を確認する | 確認メモ |
| 2-2 | docs-only / NON_VISUAL 境界を維持したまま成果物を更新する | Phase 成果物 |
| 2-3 | 完了条件と後続 Phase への引き渡し条件を確認する | 完了チェック |

## 調査対象

| 対象 | 確認内容 |
| --- | --- |
| `.github/workflows/cf-audit-log-monitor.yml` | hourly schedule、manual dispatch、fetch/analyze command、heartbeat variable |
| `.github/workflows/cf-audit-log-monitor-watchdog.yml` | 2h stale heartbeat issue 起票条件 |
| `scripts/cf-audit-log/baseline.ts` | baseline helper と 90 日集計で使う指標 |
| `scripts/cf-audit-log/analyze.ts` | classifier と alert issue 生成の現行挙動 |
| `scripts/cf-audit-log/d1-client.ts` | `cf_audit_log` / `cf_audit_baseline` access contract |
| `apps/api/migrations/0014_create_cf_audit_log.sql` | base schema |
| `apps/api/migrations/0016_cf_audit_log_classification.sql` | classifier metadata schema |
| `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` | 正本同期対象 |
| `.claude/skills/aiworkflow-requirements/references/database-schema-cf-audit-log.md` | D1 監視ストア正本 |
| `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` | 運用判断同期対象 |

## 実行コマンド

```bash
rg -n "cf-audit-log|cf_audit_log|CF_AUDIT|baseline|classifier" .github scripts apps docs .claude/skills/aiworkflow-requirements -S
sed -n '1,140p' .github/workflows/cf-audit-log-monitor.yml
sed -n '1,120p' .github/workflows/cf-audit-log-monitor-watchdog.yml
sed -n '1,220p' apps/api/migrations/0014_create_cf_audit_log.sql
sed -n '1,120p' apps/api/migrations/0016_cf_audit_log_classification.sql
sed -n '1,180p' .claude/skills/aiworkflow-requirements/references/database-schema-cf-audit-log.md
```

## 参照資料

- `docs/30-workflows/completed-tasks/observability/issue-546-cf-audit-logs-90day-baseline-observation/index.md`
- `.claude/skills/task-specification-creator/references/task-type-decision.md`
- `.claude/skills/task-specification-creator/references/phase-12-spec.md`
- `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md`
- `.claude/skills/aiworkflow-requirements/references/database-schema-cf-audit-log.md`

## 成果物

| 成果物 | 内容 |
| --- | --- |
| `phase-02.md` | Phase 2 の仕様・検証・引き渡し記録 |

## 統合テスト連携

本タスクは docs-only / NON_VISUAL の runtime observation 仕様であり、新規コード、API、D1 migration を追加しない。コードテストは追加せず、Phase 11 の read-only runtime evidence と Phase 12 の strict 7 files / link / redaction check を検証対象にする。

## 完了条件

- [ ] 調査対象ファイルが `index.md` の対象ファイル表と一致する。
- [ ] 観測に必要な既存実装が揃っていることを確認する。
- [ ] 不足がある場合は Phase 12 で未タスク化し、本仕様書内では推測実装しない。
