# Cloudflare Audit Logs 週次手動確認 Runbook

## 1. 背景と目的

Issue #518 により、Issue #408 で導入した Cloudflare Audit Logs の hourly 自動監視は HOLD とする。GitHub Actions の schedule 実行と公開 Issue 自動起票を止め、必要時だけ手動で確認できる経路を残す。

## 2. 運用ステータス

| 項目 | 状態 |
| --- | --- |
| 自動監視 | HOLD |
| `cf-audit-log-monitor.yml` | `workflow_dispatch` のみ。`dry_run` 既定値は `true` |
| `cf-audit-log-monitor-watchdog.yml` | 削除 |
| `scripts/cf-audit-log/*` | 保持。手動確認と再開時に再利用 |
| D1 `cf_audit_*` tables | 保持。rollback しない |
| GitHub Issue alerting | HOLD 中は無効。`dry_run=false` は workflow 側で拒否する |

## 3. 週次手動確認手順

### 3.1 前提

- Cloudflare Account ID と `CF_AUDIT_TOKEN_PROD` / `CF_AUDIT_D1_TOKEN_PROD` の権限が有効であること。
- 実 token 値、bearer header、full IP、credential-like value は証跡に保存しない。
- 公開 Issue を作らないため、通常確認は `dry_run=true` で行う。

### 3.2 経路 A: workflow_dispatch

```bash
gh workflow run cf-audit-log-monitor.yml -f dry_run=true
gh run list --workflow=cf-audit-log-monitor.yml --limit=5
```

`since` / `until` を指定する場合は UTC ISO timestamp を使う。

```bash
gh workflow run cf-audit-log-monitor.yml \
  -f dry_run=true \
  -f since=2026-05-07T00:00:00Z \
  -f until=2026-05-07T01:00:00Z
```

### 3.3 経路 B: local 実行

```bash
mise exec -- pnpm exec tsx scripts/cf-audit-log/fetch.ts \
  --since 2026-05-07T00:00:00Z \
  --until 2026-05-07T01:00:00Z

mise exec -- pnpm exec tsx scripts/cf-audit-log/analyze.ts --window 1h --dry-run
```

local 実行でも secret 値を shell history、markdown、artifact に残さない。

### 3.4 確認する検知パターン

| パターン | 確認観点 |
| --- | --- |
| unexpected IP authentication success | redacted IP prefix と event timestamp |
| 403 failure spike | p99 x 1.5 を超える failure count |
| off-hours token use | JST 09:00-19:00 外かつ rotation window 外 |
| dedupe behavior | 同一 finding が多重 Issue 化されないこと |

## 4. 関連 GitHub Variables / Secrets

| 名前 | HOLD 中の扱い |
| --- | --- |
| `CF_AUDIT_LAST_SUCCESS_AT` | schedule 停止により自動更新しない。手動 workflow 成功時のみ更新され得る |
| `CF_AUDIT_TOKEN_PROD` | 保持。Audit Logs Read 専用 |
| `CF_AUDIT_D1_TOKEN_PROD` | 保持。監視 workflow 専用 D1 書き込み |

## 5. 再開条件チェックリスト

- [ ] Cloudflare token misuse の具体的な兆候が出た
- [ ] private な監視証跡置き場を用意できた
- [ ] 無料枠を超えない実行頻度と保存先を明確に設計できた
- [ ] 監視結果を公開 Issue に出さない alerting 経路を用意できた

## 6. 再開手順

1. `.github/workflows/cf-audit-log-monitor.yml` に `on.schedule` を復元する。
2. `inputs.dry_run.default` を `false` に戻す。
3. `Enforce HOLD dry-run mode` step を削除し、alerting 経路を再開する。
4. `git checkout <PRE_518_MERGE_SHA> -- .github/workflows/cf-audit-log-monitor-watchdog.yml` で watchdog を復元する。
5. HOLD コメントを削除する。
6. main merge 後、初回 hourly tick を `gh run list --workflow=cf-audit-log-monitor.yml` で確認する。
7. 本 runbook を `docs/30-workflows/runbooks/_archive/` へ移動する。

## 7. Runbook archive policy

HOLD / restart 系 runbook は、対象 workflow が再開または恒久廃止され、現在の運用手順として参照しなくなった時点で `docs/30-workflows/runbooks/_archive/` へ移動する。移動時は active な正本仕様（`task-workflow-active.md`、関連 quick-reference/resource-map、対象 workflow の Phase 12 summary）から archive 後のパスへ参照を更新し、現行手順と履歴手順が混在しないようにする。

## 8. 関連リンク

- 親 spec: `docs/30-workflows/completed-tasks/U-FIX-CF-ACCT-01-DERIV-04-audit-logs-monitoring.md`
- HOLD 仕様: `docs/30-workflows/issue-518-cf-audit-logs-monitoring-hold/index.md`
- Issue #518: `https://github.com/daishiman/UBM-Hyogo/issues/518`
