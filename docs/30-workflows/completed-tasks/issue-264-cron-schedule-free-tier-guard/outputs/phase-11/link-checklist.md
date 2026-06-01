# Phase 11 — link / reference checklist（NON_VISUAL）

本サイクル着手前に、本仕様書が参照する正本の実在を確認するチェックリスト。

| # | 参照 | 種別 | 実在確認コマンド | 状態 |
| --- | --- | --- | --- | --- |
| 1 | `apps/api/wrangler.toml` の 3 cron セクション | 実装対象 | `grep -n 'crons =' apps/api/wrangler.toml` | 確認済（L14/91/173） |
| 2 | `apps/api/src/index.ts` scheduled handler | 参照 | `grep -n 'scheduled' apps/api/src/index.ts` | 確認済（L420-541） |
| 3 | `apps/api/src/jobs/sync-forms-responses.ts` | 参照 | `test -f apps/api/src/jobs/sync-forms-responses.ts` | 確認済 |
| 4 | `apps/api/src/sync/scheduled.ts`（legacy Sheets, 手動限定） | 参照 | `test -f apps/api/src/sync/scheduled.ts` | 確認済 |
| 5 | `deployment-cloudflare.md`（free-plan 3-cron 上限） | system spec | `grep -n '3 本' .claude/skills/aiworkflow-requirements/references/deployment-cloudflare.md` | 確認済（L85-89/269） |
| 6 | `U-UT01-02-cron-interval-staging-measurement.md`（supersede 対象） | 原仕様 | `test -f docs/30-workflows/unassigned-task/U-UT01-02-cron-interval-staging-measurement.md` | 確認済 |
| 7 | 新規 test 配置先 `apps/api/src/sync/` | 実装先 | `test -d apps/api/src/sync` | 確認済 |

> すべて live 参照。dead link / stale path 0 件。新規作成ファイルは `wrangler-cron-schedule.guard.spec.ts` のみ（本サイクル）。
