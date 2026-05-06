# Phase 06 — 異常系検証

## ケース別挙動
| 異常系 | 期待挙動 | 確認 |
| --- | --- | --- |
| `--release` 不正（`1.2.3`） | exit 1 + stderr `invalid release: 1.2.3` | unit test |
| `--commit` 不正（`zzzzzzz`） | exit 1 + stderr `invalid commit: zzzzzzz` | unit test |
| `--evidence` 欠落 | exit 1 + stderr `missing required field: evidence` | unit test |
| `--evidence` 指定 path が存在しない | exit 1 + stderr `evidence path not found: <p>` | unit test |
| `--evidence` 指定 path に `main.md` なし | exit 1 + stderr `evidence main.md not found: <p>` | unit test |
| `--occurred-at` 不正 ISO8601 | exit 1 + stderr `invalid occurred-at: <v>` | unit test |
| `--out` 書き込み不可 | exit 2 + stderr `failed to write: <out>` | 設計上保証（fs エラーをキャッチ） |
| `--rollback-evidence` 欠落 | exit 1 + stderr `missing required field: rollback-evidence` | 実装で網羅 |

## blame 排除 gate
- 出力 markdown が `responsible|blame|fault|責任|誰が悪い` を含まないことを test で assert
- template には人名 placeholder / 「誰が」列を一切配置しない

## 冪等性
- `validateInput` / `renderTemplate` を pure 関数として 2 回実行同値を assert
- `Date.now()` / `process.env` / 乱数は使用なし
