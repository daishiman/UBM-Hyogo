# Local Check Result

| Check | 結果 |
| --- | --- |
| 09e/09f 行数 | 09e 1039 / 09f 921（参考、AC 必須ではない） |
| 09e §章数（期待 7） | 7 PASS |
| 09f §章数（期待 3） | 3 PASS |
| 09e §X.1〜X.7 揃い（期待 42） | 42 PASS |
| 09f §X.1〜X.7 揃い（期待 14） | 14 PASS |
| 視覚値混入（fenced jsx 除外） | 0 PASS |
| login 5+1 状態 | 全数 PASS |
| profile 4 領域 | 揃い PASS |
| API trace（§X.4 vs 現行 API 正本） | 一致 PASS |
| 9 series link | 揃い PASS |
| 不変条件参照（consent / responseEmail） | 出現 PASS |
| markdown validation | NOT_CONFIGURED → artifacts.json parse PASS で代替（PASS_WITH_SUBSTITUTION） |
| `apps/`/`packages/` コード変更 | なし（docs-only） |
| typecheck / lint / build | スコープ外（docs-only） |
