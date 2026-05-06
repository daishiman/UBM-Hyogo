# Architecture Diagram (Phase 3 抜粋)

親: `docs/30-workflows/issue-408-cf-audit-logs-monitoring/outputs/phase-3/phase-3.md`

## Component Diagram

```
                       ┌────────────────────────────────────────────────┐
                       │  GitHub Actions (schedule: '0 * * * *')        │
                       │  .github/workflows/cf-audit-log-monitor.yml    │
                       └────────────────────────────────────────────────┘
                                              │
                ┌─────────────────────────────┼─────────────────────────────┐
                ▼                             ▼                             ▼
   ┌─────────────────────┐      ┌─────────────────────────┐      ┌────────────────────┐
   │ fetch.ts            │      │ analyze.ts              │      │ baseline.ts (weekly)│
   │ Cloudflare Audit API│ ───▶ │ D1 query + classify     │ ───▶ │ p99 / allowed_ip set│
   │ → D1 INSERT (idemp.)│      │ → D1 UPDATE severity    │      │ → cf_audit_baseline │
   └─────────────────────┘      │ → GitHub Issue create   │      └────────────────────┘
            │                   └─────────────────────────┘
            ▼                              │
   ┌─────────────────────┐                 ▼
   │ D1                  │      ┌─────────────────────┐
   │  cf_audit_log       │ ◀── │ issue-reporter.ts  │
   │  cf_audit_baseline  │      │ gh CLI / REST API   │
   └─────────────────────┘      └─────────────────────┘

   ┌──────────────────────────────────────────────────────────┐
   │ WATCHDOG (independent workflow, schedule: '15 * * * *')│
   │ .github/workflows/cf-audit-log-monitor-watchdog.yml      │
   │  - gh run list で cf-audit-log-monitor 直近成功時刻を取得 │
   │  - last_success > 2h なら type:security Issue を起票     │
   └──────────────────────────────────────────────────────────┘
```

## Sequence (1 hour tick)

```
Time   Actor                  Action
─────  ────────────────────  ─────────────────────────────────────────────────
T+0s   GitHub Actions cron   workflow trigger
T+5s   fetch.ts              CF API GET /audit_logs (cursor loop)
T+8s   fetch.ts              D1 INSERT OR IGNORE (event_id UNIQUE)
T+9s   analyze.ts            SELECT events for [T-1h, T]
T+10s  analyze.ts            SELECT cf_audit_baseline WHERE is_active=1
T+11s  analyze.ts            GHA meta cache load (24h TTL)
T+12s  analyze.ts            classify() per event
T+13s  analyze.ts            UPDATE severity + reportToGitHubIssue()
T+25s  analyze.ts            DELETE TTL (>30d)
T+27s  workflow              exit 0
```

## Sequence (Weekly baseline)

```
Time   Actor                  Action
─────  ────────────────────  ─────────────────────────────────────────────────
T+0s   GHA cron Sunday 00:00 workflow_dispatch with --baseline flag
T+1s   baseline.ts           SELECT events for last 7d
T+5s   baseline.ts           p99 / unique IP set / unique action set
T+6s   baseline.ts           UPDATE prior baseline → is_active=0
                              INSERT new baseline → is_active=1
```

## Trust boundary

| 境界 | 制御 |
| --- | --- |
| GitHub Actions ↔ Cloudflare API | `CF_AUDIT_TOKEN_PROD` (Audit Logs:Read のみ) |
| GitHub Actions ↔ D1 | Cloudflare API Token (D1:Edit を持つ deploy Token とは別経路で D1 HTTP API 利用) |
| GitHub Actions ↔ GitHub Issues | `GITHUB_TOKEN` (workflow scope, `permissions: issues: write`) |
| 1Password ↔ ローカル | `op run --env-file=.env` (実値はファイルに残らない) |
