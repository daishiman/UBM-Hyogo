# Scheduled Reminder Issue Pattern

> **読み込み条件**: GitHub Actions の `schedule` / `workflow_dispatch` から `gh` CLI で
> 定期的に reminder Issue を起票したい場合（post-release 長期観測など）。
> **更新タイミング**: 雛形・idempotency key 戦略を変更した際、新規適用例を追加した際。

---

## 概要

GitHub Actions `schedule` + `workflow_dispatch` から `gh` CLI を使い、release tag を
idempotency key とした reminder Issue を自動起票するパターン。Cloudflare Workers cron 無料枠が
埋まっている場合や、副作用が GitHub 側で完結する観測系で採用する。

## 構成要素

| 役割 | 正本 |
| --- | --- |
| reminder workflow | `.github/workflows/post-release-observation-reminder.yml` |
| issue template | `scripts/observation/reminder-issue-template.md` |
| helper script | `scripts/observation/create-reminder-issue.sh` |
| manual checklist | `scripts/observation/check-thresholds.md` |

## Idempotency 設計

- release tag (`gh api repos/:owner/:repo/releases/latest --jq .tag_name`) を
  idempotency key として `gh issue list --search` で既存 issue を検索する。
- 既存ヒットがあれば create をスキップ。なければ
  `gh issue create --title ... --body-file ... --label observation,d7|d30` を実行。
- `schedule` と手動 `workflow_dispatch` のどちらから起動されても結果は同じになる。

## 関連

- 適用例: Issue #350 long-term production observation
- 上位 reference: `aiworkflow-requirements/references/post-release-long-term-observation.md`

---

## 対極パターン: schedule 降格 / HOLD 化（適用例: Issue #518 Cloudflare Audit Logs）

reminder Issue 自動起票の対極として、**自動 alerting 系 schedule を一時停止しつつ workflow / scripts / secret を保持する**降格パターンも本スキルの守備範囲とする。代表例は Issue #518 Cloudflare Audit Logs HOLD（`.github/workflows/cf-audit-log-monitor.yml`）。

### 三段階の物理的封鎖
schedule を残したまま flag 1 枚で抑止すると、設定ミス・取り違え 1 つで本番 alerting が走るため、以下を default とする:

1. `on.schedule` を完全削除し `workflow_dispatch` のみ残す（自動起動を物理的に不可能にする）
2. `inputs.dry_run` の `default: 'true'` を強制し、UI 既定値を fail-safe にする
3. job 冒頭に `if: inputs.dry_run == 'false'` で `exit 1` する input validation を入れ、`dry_run=false` を workflow 側で拒否する

### Watchdog ライフサイクル同期
死活監視 watchdog workflow（例: `cf-audit-log-monitor-watchdog.yml`）は対象 schedule とライフサイクルを同期させる。schedule 停止と同一 wave で削除し、再開条件チェックリストに「watchdog 復元」を明文で残す。watchdog 単独抑止は採らない。

### 再開条件 spec 固定
HOLD 解除条件を停止理由とは別の独立チェックリストとして spec / runbook に書く。Issue #518 の場合は以下 4 点（全て満たすまで再開しない）:
1. token misuse の具体的な兆候の発生
2. private な監視証跡置き場の用意
3. 無料枠を超えない実行頻度と保存先の設計確定
4. 監視結果を公開 Issue に出さない alerting 経路の用意

### 適用例 / 上位 reference
- 適用例: Issue #518 Cloudflare Audit Logs Monitoring HOLD（`docs/30-workflows/completed-tasks/issue-518-cf-audit-logs-monitoring-hold/`）
- 週次手動確認 runbook: `docs/30-workflows/runbooks/cf-audit-logs-weekly-manual-check.md`
- 苦戦知見: `aiworkflow-requirements/references/lessons-learned-issue-518-cf-audit-logs-hold-2026-05.md`（L-ISSUE518-001 〜 003）
- 上位 contract: `aiworkflow-requirements/references/observability-monitoring.md` §9
