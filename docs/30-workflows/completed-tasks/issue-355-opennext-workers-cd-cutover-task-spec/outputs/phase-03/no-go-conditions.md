# NO-GO 条件（NG-1〜NG-5）

`phase-03.md` 仕様の正本転写。production cutover 昇格を阻む明示的な NO-GO 条件を 5 件定義する。

| ID | 条件 | 対応 |
| --- | --- | --- |
| NG-1 | smoke S-01〜S-10 のうち 1 件でも FAIL | production cutover を保留。原因切分後に staging 再 deploy → smoke 再実行 |
| NG-2 | `apps/web/.open-next/worker.js` または `.open-next/assets/` が build 後に未生成 | build script の不具合と判定し、`opennextjs-cloudflare` バージョン / `patch-open-next-worker.mjs` を点検。NG 解消まで CD 改修 PR を merge しない |
| NG-3 | `wrangler deploy --env staging` が binding 解決失敗（`API_SERVICE` not found 等）で失敗 | apps/api-staging の存在 / wrangler.toml service binding の整合を再確認。staging cutover 中止 |
| NG-4 | staging URL が HTTP 5xx 連発 / observability ログに critical error | rollback（一次手段 `scripts/cf.sh rollback`）を即実行。production cutover 保留 |
| NG-5 | rollback 経路（T-40）が staging で実証できない | runbook S5 を再設計。production cutover 保留 |

## 判定タイミング

| 判定ポイント | 関連 NG |
| --- | --- |
| `pnpm build:cloudflare` 完了直後 | NG-2 |
| `wrangler deploy --env staging` 完了直後 | NG-3 |
| staging smoke 実行直後 | NG-1, NG-4 |
| staging rollback drill 実行直後 | NG-5 |

いずれか 1 件でも該当した場合、production cutover の自動進行は停止する。原因解消後に staging 段階から再実行する（fail-forward 不可）。

## RISK との対応

| NG | 主な対象 RISK |
| --- | --- |
| NG-1 | RISK-1 |
| NG-2 | RISK-5 |
| NG-3 | RISK-3 |
| NG-4 | RISK-1, RISK-2 |
| NG-5 | RISK-4 |
