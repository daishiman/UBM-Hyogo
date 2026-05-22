# Phase 6 — 実装手順（実施結果）

## 完了ステップ

1. ✅ `.github/workflows/cf-audit-log-monitor.yml` を Write tool で全面再生成（HOLD 解除 + 3 post-step + artifact upload）
2. ✅ `.github/workflows/cf-audit-log-7day-summary.yml` を新規作成
3. ✅ `docs/30-workflows/runbooks/cf-audit-logs-weekly-manual-check.md` を HOLD 解除版に更新（§1, §2）
4. ✅ `.claude/skills/aiworkflow-requirements/references/observability-monitoring.md` に §11.1 contract + 変更履歴追記
5. ✅ `.claude/skills/aiworkflow-requirements/references/task-workflow-active.md` の Issue #549 entry を 3 段昇格に更新
6. ✅ `docs/00-getting-started-manual/specs/15-infrastructure-runbook.md` に Issue #586 close-out section 追加
7. ✅ `docs/30-workflows/completed-tasks/issue-549-cf-audit-ml-production-switch/phase-13.md` に 2026-05-09 update 注記追加
8. ✅ `gh api -X POST` で production env に `CF_AUDIT_CLASSIFIER=ml` 設定（Gate-RUNTIME-CLASSIFIER-SET 通過）

## 実装に要した判断

- 仕様書の `--consecutive-hours 3` は実スクリプト `fallback-rate-alert.ts` の `--window=3` に mapping した（同義）
- `dry_run` 既定を `true` から `false` に切替え。production hourly run を有効化するため必須
- `cf-audit-log-7day-summary.yml` は `actions/download-artifact@v4` を使わない。同 action は same-run 前提のため、cross-run aggregation は `gh api workflows/cf-audit-log-monitor.yml/runs` + artifact zip download で実装し、件数 / fallback / leakage / classifier / skeleton metrics gate で安全側に倒す
