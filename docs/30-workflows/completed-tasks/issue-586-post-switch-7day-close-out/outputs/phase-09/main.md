# Phase 9 — 運用準備 / observability

## pass_runtime_synced 昇格手順

| 段階 | 条件 | アクション |
| --- | --- | --- |
| `implemented_local_runtime_pending` | 本サイクル merge 前 | Phase 11/12 evidence + SSOT 4 ファイル更新 |
| `pass_boundary_synced_runtime_pending` | merge 後 D+0 | 1 hour 後の `gh run list --workflow cf-audit-log-monitor.yml --limit 5` で hourly run success + artifact upload を確認 |
| `pass_runtime_synced` | D+7 | `cf-audit-log-7day-summary.yml` の自動 trigger / 手動 trigger で 168 snapshots 集約 → evidence PR 起票 → SSOT 4 ファイルを `pass_runtime_synced` で再 commit |

## daily check（D+1 / D+3 / D+5）

```
gh run list --workflow cf-audit-log-monitor.yml --limit 25 --json databaseId,conclusion,createdAt
```

success rate と artifact 件数を `outputs/phase-11/evidence/hourly-run-daily-check.md` に追記する。

## D+7 evidence trigger

```
gh workflow run cf-audit-log-7day-summary.yml
```

または scheduled run（`cron '0 1 */7 * *'`）の自動起動を待つ。
