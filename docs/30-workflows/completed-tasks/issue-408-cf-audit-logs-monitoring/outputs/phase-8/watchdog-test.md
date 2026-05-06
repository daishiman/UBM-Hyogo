# Watchdog テスト: 主 workflow 停止検知

## 目的

`cf-audit-log-monitor.yml`（主 workflow）が schedule で動かなくなった状況を意図的に作り出し、`cf-audit-log-monitor-watchdog.yml` が独立して alert Issue を起票することを確認する。

## 前提

- watchdog workflow は schedule（例: `0 */2 * * *` の 2 時間毎）で稼働
- watchdog の判定ロジック: 主 workflow の最後の `success` から経過時間が `WATCHDOG_THRESHOLD_HOURS`（既定 3h）を超えたら HIGH alert

## シナリオ W-1: 主 workflow を一時無効化

### 手順

```bash
# 1) 主 workflow を disable（schedule 起動を止める）
gh workflow disable cf-audit-log-monitor.yml

# 2) 既存最終成功からの経過時間を確認
gh run list --workflow=cf-audit-log-monitor.yml --status success --limit 1 \
  --json createdAt --jq '.[0].createdAt'

# 3) 閾値（3h）を超えるまで待機、または watchdog の閾値環境変数を一時的に短縮（テスト用）
#    本番閾値は触らず、テスト用 input で小さい threshold を渡す
gh workflow run cf-audit-log-monitor-watchdog.yml --ref dev \
  -f threshold_hours=0

# 4) watchdog run を確認
WD_ID=$(gh run list --workflow=cf-audit-log-monitor-watchdog.yml --limit 1 --json databaseId --jq '.[0].databaseId')
gh run watch "$WD_ID"
gh run view "$WD_ID" --json status,conclusion
```

### 期待結果

- watchdog run が `success` で完了
- 起票された alert Issue を確認:

```bash
gh issue list \
  --label "type:security,priority:high,bot:cf-audit-log-watchdog" \
  --json number,title,createdAt
```

- Issue title 例: `[cf-audit-log-watchdog] main workflow stalled (last success > 3h ago)`
- Issue body に主 workflow の最終 run id / 経過時間 / 復旧手順 link が含まれる

## シナリオ W-2: 復旧後の自動 close 確認（オプション）

### 手順

```bash
# 1) 主 workflow を re-enable
gh workflow enable cf-audit-log-monitor.yml

# 2) 主 workflow を 1 サイクル実走させる
gh workflow run cf-audit-log-monitor.yml --ref dev

# 3) watchdog を再 trigger（次の schedule を待たない）
gh workflow run cf-audit-log-monitor-watchdog.yml --ref dev
```

### 期待結果

- watchdog Issue が自動 `closed`（または body に復旧 timestamp 追記）
- 実装方針として close を採用するか追記のみとするかは Phase 5 実装で決定

## 副次確認

- watchdog 自身の認証失敗（監視 Token 失効等）も別 alert する設計か確認
  - watchdog 自身の failure はリポジトリ admin への notification（GitHub `actions failure` mail）で吸収する想定
  - 完全冗長化は本 MVP 範囲外として `unassigned-task` に申し送る（Phase 12）

## 終了条件

- W-1 が期待結果通り
- W-2 は実装方針確定後に PASS / 未実装 を区別

## 関連

- `outputs/phase-8/e2e-scenario.md`
- `outputs/phase-11/watchdog-alert.json`（runtime evidence 保存先）
