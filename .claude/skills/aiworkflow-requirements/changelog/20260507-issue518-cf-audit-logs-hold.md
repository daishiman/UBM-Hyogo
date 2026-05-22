# 2026-05-07 Issue #518 Cloudflare Audit Logs HOLD

Cloudflare Audit Logs monitoring の正本状態を Issue #518 に合わせて `HOLD / manual-check-only` へ更新した。

- `.github/workflows/cf-audit-log-monitor.yml` は hourly schedule を削除し、`workflow_dispatch` のみ残す。`dry_run` 既定値は `true`。
- `.github/workflows/cf-audit-log-monitor-watchdog.yml` は削除。
- `scripts/cf-audit-log/*` と D1 `cf_audit_*` schema は保持し、週次手動確認と再開時に再利用する。
- 週次手動確認の正本 runbook は `docs/30-workflows/runbooks/cf-audit-logs-weekly-manual-check.md`。
- 自動監視の再開は private evidence store、free-tier 内の頻度、非公開 alert 経路、misuse 兆候の条件成立後に限定する。
