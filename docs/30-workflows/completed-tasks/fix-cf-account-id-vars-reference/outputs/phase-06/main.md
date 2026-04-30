# Phase 6: 異常系検証

## 想定異常系

| # | 異常ケース | 発生条件 | 検出方法 | 対応 |
| --- | --- | --- | --- | --- |
| E-1 | `vars.CLOUDFLARE_ACCOUNT_ID` 未登録 | Variable が削除された | wrangler が空文字 accountId で動き Authentication error [code:10000] | `gh variable set CLOUDFLARE_ACCOUNT_ID --body <id>` で再登録 |
| E-2 | yaml 構文エラー | sed 誤適用 / 手書きで quote 崩れ | actionlint / yamllint / yaml.safe_load 失敗 | revert + 再修正 |
| E-3 | 異なる account への誤登録 | Variable 値が別 Cloudflare account のもの | wrangler-action 実行で `Authentication error` または `404` | `gh variable list` で実値を確認、正しい ID に更新 |
| E-4 | `CLOUDFLARE_API_TOKEN` 期限切れ・スコープ不足 | Token 更新漏れ | wrangler が 401/403 で失敗 | 別タスク（API Token スコープ監査）で対応（scope out） |
| E-5 | `vars.` を `secrets.` 環境にコピペで再混入 | 将来の編集時 | grep 検査を CI gate に組込（将来対応） | 本タスクでは scope out。Phase 12 unassigned-task として記録候補 |

## 本修正自体のフォルトトレランス
- 同名の Variable と Secret が同居していた場合、GitHub の context は別空間（`vars.X` / `secrets.X`）として独立管理されるため、参照側を `vars.` に固定すれば衝突しない。
- Account ID は CI ログに既出のため、誤って Secret 化しても情報秘匿効果は得られない（phase-01 参照）。
