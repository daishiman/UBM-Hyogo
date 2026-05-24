---
phase: 9
title: Risks
workflow_id: ut-25-deriv-02-sa-key-expiry-monitoring
status: draft
---

# Phase 9: Risks — SA key 失効監視

[実装区分: 実装仕様書]

## 1. 識別済みリスク

| ID | リスク | 影響度 | 緩和策 |
| --- | --- | --- | --- |
| R-1 | 5xx / 429 / network timeout を 401/403 と誤分類し alert noise が発生する | 中 | classifier が `SheetsFetchError.status` で厳密一致のみ true、それ以外は `SHEETS_AUTH_OTHER` (`isAuthFailure: false`)。Phase 6 unit test で 429/500/network を網羅 |
| R-2 | UT-25-DERIV-01 の rotation 実施中、旧 key 無効化と新 key 上書きの間で一時的 401 が発火 | 高（誤呼び出し） | alert-relay 側で `category: 'sheets-auth'` への 10 分 mute 操作手順を runbook section 化（後述 §3）。rotation SOP 着手者へ申し送り |
| R-3 | 既存 `*/15` cron への相乗りで実行時間予算（≒30 秒）を超過し sync 本体を落とす | 中 | healthcheck は `spreadsheets.get?fields=spreadsheetId` の最小 read 1 call のみ。p95 < 1 秒の想定。`ctx.waitUntil` で本体実行と並行し本体完了を阻害しない |
| R-4 | health check 自身が secret 名 typo / binding 不在で 401 を出し誤陽性 | 高 | staging で先に 24 時間運転し true negative を確認。production 投入は staging 24h green 後 |
| R-5 | Cloudflare free plan の cron 3 本上限に手を入れてしまう（誤って 4 本目を追加） | 高 | Phase 7 quality gate で `grep -c '"\*' apps/api/wrangler.toml` を deploy 前後で比較し 3 本維持を assert |
| R-6 | alert-relay POST が失敗した場合に healthcheck が rethrow して cron 全体を落とす | 中 | `postAlertRelay` は try/catch で error を console.error に吐いて飲み込む（実装ガイド §1.3） |
| R-7 | dedup KV が複数 isolate を跨いで反映されず thundering alert | 低 | 既存 alert-relay dedup が UT-17 follow-up 002 で cross-isolate 対応済み。本タスクは流用のみ |
| R-8 | `SHEETS_AUTH_OTHER` の `console.error` が大量に出て Workers logs を圧迫 | 低 | `event: 'sheets.auth.transient'` として分離。alert pipeline には載せず log retention のみ |
| R-9 | 既存 throw 経路の破壊（catch 後 rethrow 忘れ） | 高 | Phase 6 regression spec で `expect(...).toThrow()` を 3 sync ジョブ全てに対し検証 |

## 2. unknown risk への姿勢

- staging dry-run で観測されなかった挙動が production で出る場合、Phase 11 evidence の baseline と比較して切り分け。
- production 投入後 24 時間は手動観測（Workers Analytics / logs）を維持。

## 3. rotation 中 alert mute 手順（runbook section ドラフト）

UT-25-DERIV-01 rotation SOP に組み込むべき必須セクション:

```md
### Pre-rotation: sheets-auth alert mute

rotation 作業前に以下を実行する:

1. Workers KV へ `alert:sheets-auth:mute=until_<ISO8601 +10min>` を put（既存 alert-relay の mute hook 経由）
2. rotation 完了後、`runSheetsAuthHealthcheck` を 1 回手動 trigger（`bash scripts/cf.sh ... -- ...` の dispatch エンドポイント）し ok=true を確認
3. mute key を削除

mute を忘れた場合: 旧 key 無効化〜新 key Cloudflare Secret 反映の間（通常 1-3 分）に 1-2 件の `SHEETS_AUTH_401_KEY_INVALID` alert が誤発火する。3 回 / 10 分の threshold には届きにくいが念のため。
```

詳細実装は UT-25-DERIV-01 のスコープ。本ワークフローは申し送り資料の提供までを担当。
