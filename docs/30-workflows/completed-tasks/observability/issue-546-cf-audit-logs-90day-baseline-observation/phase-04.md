# Phase 4: データ取得契約

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク ID | `issue-546-cf-audit-logs-90day-baseline-observation` |
| Phase | 4 |
| Phase 名 | データ取得契約 |
| taskType | `docs-only` |
| visualEvidence | `NON_VISUAL` |
| workflow_state | `spec_created` |

[実装区分: ドキュメントのみ]

## 目的

GitHub Actions、GitHub Issues、Cloudflare D1 から取得するデータ項目を固定する。

## 実行タスク

| Task | 内容 | 出力 |
| --- | --- | --- |
| 4-1 | 本 Phase の対象資料と既存実装を確認する | 確認メモ |
| 4-2 | docs-only / NON_VISUAL 境界を維持したまま成果物を更新する | Phase 成果物 |
| 4-3 | 完了条件と後続 Phase への引き渡し条件を確認する | 完了チェック |

## GitHub Actions 契約

```bash
gh api --paginate \
  repos/daishiman/UBM-Hyogo/actions/workflows/cf-audit-log-monitor.yml/runs \
  --jq '.workflow_runs[] | {databaseId:.id,status,conclusion,createdAt:.created_at,updatedAt:.updated_at,headSha:.head_sha,event,url:.html_url}' \
  | jq -s '.'
```

必須フィールド:

| field | 用途 |
| --- | --- |
| `createdAt` | 90 日 window と hourly gap 判定 |
| `conclusion` | success/failure/cancelled 集計 |
| `event` | schedule / workflow_dispatch の区別 |
| `url` | evidence 参照 |

90 日 hourly run は約 2160 件になるため、`gh run list --limit 500` では Gate-A の入力として不足する。必ず paginated API 出力を `jq -s '.'` で JSON 配列として保存し、90 日 window は保存後の JSON 配列から切り出す。

## GitHub Issue 契約

```bash
gh issue list --state all --label cf-audit --limit 200 \
  --json number,title,state,labels,createdAt,closedAt,url
```

`false-positive`、`confirmed`、`bot:cf-audit-log-monitor`、`bot:cf-audit-log-watchdog` label がある場合は判定に使う。label が未整備の場合、Phase 8 の欠測ルールに従い `manual_classification_required` とする。

## D1 read-only 契約

```sql
SELECT
  COUNT(*) AS total_events,
  SUM(CASE WHEN severity = 'HIGH' THEN 1 ELSE 0 END) AS high_count,
  SUM(CASE WHEN severity = 'MEDIUM' THEN 1 ELSE 0 END) AS medium_count,
  SUM(CASE WHEN severity = 'LOW' THEN 1 ELSE 0 END) AS low_count,
  MIN(occurred_at_ms) AS first_event_ms,
  MAX(occurred_at_ms) AS last_event_ms
FROM cf_audit_log
WHERE occurred_at_ms >= unixepoch('now','-90 days') * 1000;
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
| `phase-04.md` | Phase 4 の仕様・検証・引き渡し記録 |

## 統合テスト連携

本タスクは docs-only / NON_VISUAL の runtime observation 仕様であり、新規コード、API、D1 migration を追加しない。コードテストは追加せず、Phase 11 の read-only runtime evidence と Phase 12 の strict 7 files / link / redaction check を検証対象にする。

## 完了条件

- [ ] 取得する JSON field が固定されている。
- [ ] D1 query が `SELECT` のみである。
- [ ] raw audit JSON を Issue / PR / docs に貼らないことが明記されている。
