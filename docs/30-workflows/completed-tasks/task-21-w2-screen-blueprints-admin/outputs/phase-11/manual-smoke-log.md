# manual-smoke-log.md

## 判定

NON_VISUAL docs-only workflow のためブラウザ screenshot smoke は対象外。代替として `outputs/phase-11/evidence/` の構造・grep・API parity evidence を manual smoke log として採用する。

## 実施内容

| gate | evidence | 結果 |
| --- | --- | --- |
| 09g 行数 / section structure | `evidence/structure.json` | PASS |
| 視覚値混入 0 件 | `evidence/visual-grep.log` | PASS |
| API contract parity | `evidence/api-parity.diff` | PASS |
| confirm Modal a11y strings | `evidence/a11y-strings.log` | PASS |
| schema apply 二段確認 | `evidence/schema-two-stage.log` | PASS |
| markdown lint fallback | `evidence/lint.log` | PASS |

## screenshot

該当なし。仕様書 markdown の contract repair であり、`apps/web` UI の描画変更を含まない。
