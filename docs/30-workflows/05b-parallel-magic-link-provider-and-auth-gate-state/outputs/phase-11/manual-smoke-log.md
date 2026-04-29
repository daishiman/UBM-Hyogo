# Phase 11 Manual Smoke Log

## 判定

NON_VISUAL/API task。`artifacts.json` の `ui_routes: []` により、画面 screenshot は対象外。

## 実施ログ

| ID | 実施内容 | evidence | 結果 |
| --- | --- | --- | --- |
| M-01 | 未登録 email の gate 判定 | `curl-unregistered.txt` | PASS |
| M-02 | rules 未同意 email の gate 判定 | `curl-rules-declined.txt` | PASS |
| M-03 | 削除済み member の gate 判定 | `curl-deleted.txt` | PASS |
| M-04 | 有効 email の Magic Link 発行 | `curl-sent.txt` | PASS |
| M-05 | Magic Link verify 成功 | `callback-success.txt` | PASS |
| RL-01 | rate limit | `rate-limit.txt` | PASS |
| FS-01 | `/no-access` route 不在 + apps/web D1 直参照不在 | `no-access-check.txt` | PASS |

## dev server / screenshot

`wrangler dev` と screenshot smoke は未実施。理由は UI route を持たず、Hono direct fetch + Vitest + fs-check が本タスクの受入条件を直接検証しているため。
