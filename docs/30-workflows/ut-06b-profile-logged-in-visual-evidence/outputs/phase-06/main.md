# Phase 6 Output: 異常系検証

## failure cases

| ID | 状況 | 検出 | recovery |
| --- | --- | --- | --- |
| F-1 | session 不成立 | `/profile` が `/login` redirect | 05b fixture / staging mail を確認 |
| F-2 | `/me` or `/me/profile` 500 | 画面 error / API log | 上流 04b を blocked として扱う |
| F-3 | form/input/textarea/submit が >0 | DevTools count | 親 06b bug として blocked |
| F-4 | staging 未 deploy | staging URL 不達 | partial として M-14〜M-16 を後続化 |
| F-5 | secret 混入 | grep hit | evidence 破棄、snippet 修正、再取得 |
| F-6 | PII 過剰露出 | 目視 | 再取得またはマスク方針確認 |
| F-7 | parent diff conflict | git diff conflict | 親 workflow と整合後に再 diff |
| F-8 | `?edit=true` が rewrite | URL 観察 | AC 再確認 |
| F-9 | admin session で取得 | `/me` role | member session で再取得 |
| F-10 | `location.href` 出力 | txt grep / review | `pathname + search` へ修正 |
