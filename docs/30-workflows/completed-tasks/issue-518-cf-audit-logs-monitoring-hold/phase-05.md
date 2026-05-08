# Phase 5: 実装 — cf-audit-log-monitor.yml 編集

`[実装区分: 実装仕様書]`

判定根拠: 既存 main マージ済み YAML の編集が中核。schedule トリガー削除と dry_run default 変更でこのタスクの主要効果（自動稼働停止 / 公開 Issue 露出停止）が発生する。

---

## 目的

`.github/workflows/cf-audit-log-monitor.yml` を編集し、hourly schedule を停止、`workflow_dispatch` の `dry_run` 既定値を `true` に変更、HOLD 経緯コメントをファイル冒頭に追加する。

## 変更対象ファイル

| パス | 種別 |
| --- | --- |
| `.github/workflows/cf-audit-log-monitor.yml` | 編集 |

## 編集内容（厳密差分）

### Edit 1: ファイル冒頭に HOLD コメント追加

```yaml
# HOLD: Issue #518 により hourly schedule を停止し、週次手動確認へ縮退中。
# 再開条件は docs/30-workflows/runbooks/cf-audit-logs-weekly-manual-check.md の
# 「再開条件チェックリスト」を参照。
# 手動起動: gh workflow run cf-audit-log-monitor.yml -f dry_run=true
name: cf-audit-log-monitor
```

### Edit 2: `on.schedule` ブロックを削除

変更前:
```yaml
on:
  schedule:
    - cron: '0 * * * *'
  workflow_dispatch:
    inputs:
```
変更後:
```yaml
on:
  workflow_dispatch:
    inputs:
```

### Edit 3: `inputs.dry_run.default` を `true` に変更

変更前:
```yaml
      dry_run:
        description: Skip GitHub Issue creation in analyze step.
        required: false
        type: boolean
        default: false
```
変更後:
```yaml
      dry_run:
        description: Skip GitHub Issue creation in analyze step (HOLD 中は true 必須)。
        required: false
        type: boolean
        default: true
```

### 残す箇所

- `permissions` / `concurrency` / `jobs.fetch-and-analyze` の全ステップ（fetch / analyze / heartbeat 更新）は無編集
- `inputs.since` / `inputs.until` も無編集

## 関数 / シグネチャ

なし（YAML 編集のみ。scripts/cf-audit-log は無編集）。

## 入出力 / 副作用

- 編集前: hourly cron で自動起動 → fetch + analyze + GH Issue 起票 + heartbeat 更新
- 編集後: schedule 起動なし。手動 `workflow_dispatch` 起動時は `dry_run=true` 既定で Issue 起票 skip。heartbeat は手動 run 成功時のみ更新

## テスト方針

- 静的: `actionlint .github/workflows/cf-audit-log-monitor.yml` が PASS
- 構文: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/cf-audit-log-monitor.yml'))"` または `yq` で YAML パース
- 差分確認: `git diff .github/workflows/cf-audit-log-monitor.yml` で 3 箇所の編集が反映されている

## ローカル実行・検証コマンド

```bash
actionlint .github/workflows/cf-audit-log-monitor.yml
git diff .github/workflows/cf-audit-log-monitor.yml | head -60
yq '.on' .github/workflows/cf-audit-log-monitor.yml          # → schedule キーが存在しないこと
yq '.on.workflow_dispatch.inputs.dry_run.default' .github/workflows/cf-audit-log-monitor.yml   # → true
```

## DoD

- AC-1: `on.schedule` 削除済み
- AC-2: `inputs.dry_run.default = true`
- AC-3: 冒頭に HOLD コメント追加
- `actionlint` PASS
- `git diff` で意図通りの変更のみ表示
