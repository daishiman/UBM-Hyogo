# Phase 6: 実装 — cf-audit-log-monitor-watchdog.yml 削除

`[実装区分: 実装仕様書]`

判定根拠: schedule 停止により監視対象が消失するため、watchdog 自体を削除する必要がある。docs だけでは GitHub Actions の自動発火を止められない。

---

## 目的

`.github/workflows/cf-audit-log-monitor-watchdog.yml` を `git rm` で削除し、stale heartbeat 検知 Issue 自動起票を停止する。

## 変更対象ファイル

| パス | 種別 |
| --- | --- |
| `.github/workflows/cf-audit-log-monitor-watchdog.yml` | 削除 |

## 実行手順

```bash
git rm .github/workflows/cf-audit-log-monitor-watchdog.yml
```

## 関数 / シグネチャ

該当なし（ファイル削除）。

## 入出力 / 副作用

- 削除前: `15 * * * *` cron で発火し `CF_AUDIT_LAST_SUCCESS_AT` の鮮度を確認、`> 7200s` で公開 Issue を起票
- 削除後: 発火なし / Issue 起票なし

## 連動する考慮

- `CF_AUDIT_LAST_SUCCESS_AT` GitHub Variable は削除しない（再開時に再利用）。runbook（Phase 7）で扱いを明記。
- ラベル `bot:cf-audit-log-watchdog` を使う既存 Issue は手動 close 推奨（本タスクではスコープ外。issue 一覧確認は Phase 12 で実施）。

## テスト方針

- `git status` で `deleted: .github/workflows/cf-audit-log-monitor-watchdog.yml` が表示
- `ls .github/workflows/cf-audit-log-monitor-watchdog.yml` が `No such file` を返す
- `find .github/workflows -name 'cf-audit-log-monitor-watchdog.yml'` が空

## ローカル実行・検証コマンド

```bash
git rm .github/workflows/cf-audit-log-monitor-watchdog.yml
git status --short .github/workflows/
ls .github/workflows/cf-audit-log-monitor-watchdog.yml 2>&1   # No such file
```

## DoD

- AC-4: ファイルが削除され `git status` で `deleted` 表示
- 他 workflow が watchdog を参照していないこと（grep 確認）
  ```bash
  grep -r "cf-audit-log-monitor-watchdog" .github/ docs/ scripts/ || echo "no remaining reference"
  ```
