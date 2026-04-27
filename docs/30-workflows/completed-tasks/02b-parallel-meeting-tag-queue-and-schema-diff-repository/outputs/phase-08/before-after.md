# Phase 8: before-after

## 共通化した箇所
| 箇所 | before | after |
| --- | --- | --- |
| UNIQUE 違反検出 | 各 repo で文字列マッチ | `_shared/db.ts: isUniqueConstraintError` |
| boolean 変換 | `r.active === 1` を散在 | `intToBool / boolToInt` ヘルパー |
| SELECT 句 | テンプレ重複 | repo 局所の `SELECT_COLS` 定数 |

## あえて DRY 化しなかった箇所
- `map(r) => domain` 関数: repository ごとに型が違うため手書きキープ
- 状態遷移マップ (tagQueue): 1 箇所しか無いので抽象化不要
