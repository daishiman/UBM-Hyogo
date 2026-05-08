# Grep Gate Result

検証日時: 2026-05-07
正本: phase-11 evidence

## 結果サマリ

| Test | 期待 | 実測 | 結果 |
| --- | --- | --- | --- |
| T1-09e §章数 | 7 | 7 | PASS |
| T1-09f §章数 | 3 | 3 | PASS |
| T2-09e §X.1〜X.7 揃い | 6×7=42 | 42 | PASS |
| T2-09f §X.1〜X.7 揃い | 2×7=14 | 14 | PASS |
| T3 視覚値混入（fenced jsx 除外） | 0 | 0 | PASS（`grep-visual-values.log`: `GREP_ZERO_HITS_OUTSIDE_FENCED_CODE`） |
| T4 login 5+1 状態語列挙 | input/sent/unregistered/deleted/rules_declined/error 全数 | 全数 | PASS |
| T4 profile 4 領域 | banner/summary/request/delete | 揃い | PASS |
| T5 API trace（§X.4 vs 現行 API 正本） | 完全一致 | 一致 | PASS |
| T6-09e mermaid block | 動的画面分（§1/§2/§3/§6） | 4 | PASS（§4 register / §5 privacy は静的派生のため mermaid 省略可） |
| T6-09f mermaid block | ≥2 | 2 | PASS |
| T7 9 series link（09b/09c/09d/09a） | 全 §X.7 | 揃い | PASS |
| T8 markdown validation | lint script 未定義時は代替証跡 | NOT_CONFIGURED → artifacts.json parse PASS で代替 | PASS_WITH_SUBSTITUTION |
| T9 不変条件参照 | publicConsent / rulesConsent / responseEmail 出現 | 全数出現（複数箇所で） | PASS |

## 行数（参考）

- 09e: 行数は `wc-lines.log` に記録（公開 6 画面 + §99 の完全 blueprint）
- 09f: 行数は `wc-lines.log` に記録（会員 2 画面 + §99 の完全 blueprint）

行数 inventory は AC-1/AC-2 の hard gate ではない。「完全 blueprint として存在する」が AC 充足条件であり PASS。

## 結論

全 AC PASS。下流 task-11..14 が「09e/09f §X を読んで 1 ファイル書ける」決定論的状態を満たす。
