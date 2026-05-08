# Implementation Guide

## Part 1: 中学生レベル

Cloudflare Audit Logs の自動監視は、毎時間 GitHub Actions を動かして、怪しい token 利用がないか確認する仕組みだった。今回は Issue #518 の判断で、常時動かすほどの必要性がまだ高くないため、自動実行を止めた。

ただし、全部を捨てたわけではない。確認用の scripts と D1 table は残したので、必要なときは手動で確認できる。手動確認では `dry_run=true` を使い、公開 GitHub Issue を勝手に作らない。

再開する条件は、具体的な misuse 兆候、非公開の証跡置き場、無料枠を超えない頻度、公開 Issue 以外の alert 経路がそろうこと。

## Part 2: 技術者レベル

### Workflow

- `.github/workflows/cf-audit-log-monitor.yml`
  - `on.schedule` を削除
  - `workflow_dispatch` は保持
  - `inputs.dry_run.default` を `true` に変更
  - HOLD 中は `dry_run=false` を workflow 側で拒否
  - HOLD コメントを冒頭に追加
- `.github/workflows/cf-audit-log-monitor-watchdog.yml`
  - schedule 停止により heartbeat 監視対象が消えるため削除

### Retained Runtime Assets

- `scripts/cf-audit-log/*` は無編集保持
- D1 `cf_audit_log` / `cf_audit_baseline` / `cf_audit_finding_dedupe` は保持
- `CF_AUDIT_TOKEN_PROD` / `CF_AUDIT_D1_TOKEN_PROD` は保持し、手動確認時のみ使用

### Manual Check

正本 runbook: `docs/30-workflows/runbooks/cf-audit-logs-weekly-manual-check.md`

```bash
gh workflow run cf-audit-log-monitor.yml -f dry_run=true
mise exec -- pnpm exec tsx scripts/cf-audit-log/analyze.ts --window 1h --dry-run
```

### Restart

1. `on.schedule` を復元
2. `dry_run.default` を `false` に戻す
3. `Enforce HOLD dry-run mode` step を削除
4. watchdog workflow を git history から復元
5. 初回 hourly tick と watchdog evidence を Phase 11 で取得
