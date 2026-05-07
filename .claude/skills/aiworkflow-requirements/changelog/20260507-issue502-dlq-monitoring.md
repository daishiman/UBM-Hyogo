# Issue #502 schema alias back-fill DLQ monitoring runbook

| version | date | summary |
| --- | --- | --- |
| v2026.05.07-issue502-dlq-monitoring | 2026-05-07 | schema alias back-fill Queue / DLQ 監視 runbook と D1 集計 SQL 3 種を正本化、`references/dlq-monitoring.md` を新規追加し、Cloudflare Queue / DLQ binding 名 + D1 schema_diff_queue 監視列 + 異常しきい値（DLQ >= 1 / retry >= 3 / exhausted 24h）を skill から逆引き可能化。`topic-map.md` / `keywords.json` / `quick-reference.md` / `resource-map.md` / `task-workflow-active.md` / `SKILL.md` / `LOGS/_legacy.md` を同一 wave で同期。実 D1 SQL / dash runtime evidence は user approval 後に取得する。 |

## 反映内容

- `references/dlq-monitoring.md` を新規追加し、Cloudflare Queue / DLQ 観測手順 + D1 集計 SQL 3 種 + しきい値（DLQ ≥ 1 / retry ≥ 3 / exhausted 24h）を正本化。
- runbook 本体は `docs/runbooks/dlq-monitoring/schema-alias-backfill.md` に配置（6 章構造: 監視対象 / dash 手順 / 集計 SQL 3 種 / しきい値 / エスカレーション / しきい値見直し基準）。
- Phase 11 evidence は `docs/30-workflows/issue-502-ut-07b-fu-01-followup-dlq-monitoring-dashboard/outputs/phase-11/` を正本とする。local grep / SQL template / dash 手順 evidence は取得済み、D1 アクセスを伴う実 SQL 実行と dash runtime 確認はユーザー承認後に実施する。
- `last_error` 列は集計 SQL から除外（OAuth エラー本文混入リスク回避）。要約のみ runbook / references に記録。
- `wrangler` 直接実行は禁止し、`bash scripts/cf.sh` ラッパー経由に一本化。
- GitHub Issue #502 は CLOSED 維持。PR 文面は `Refs #502` のみ（`Closes #502` 不可）。
