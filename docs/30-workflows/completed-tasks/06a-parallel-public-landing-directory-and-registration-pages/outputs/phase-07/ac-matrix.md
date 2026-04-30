# ac-matrix.md — AC × test × runbook × failure

| AC | 内容 | unit | contract | E2E | static | runbook step | failure |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AC-1 | 4 ルート 200/404 分岐 | - | C-01〜C-03 | E-01〜E-07 | - | 2-5 | F-01 |
| AC-2 | URL ベース遷移成立 | - | C-01 | E-01〜E-07 | - | layout + Link | - |
| AC-3 | 6 検索 query が URL に表現 + reload で復元 | U-01, U-04, U-06 | C-02 | E-03, E-04 | - | 3 (FilterBar) | F-04, F-05 |
| AC-4 | density は `comfy/dense/list` のみ | U-03 | - | - | S-03 | 3, 6 | F-04 |
| AC-5 | tag は repeated query で AND | U-04, U-05 | - | - | - | 3 (toApiQuery) | - |
| AC-6 | 不明 query は初期値 fallback | U-02, U-03 | - | - | - | 3 (zod catch) | F-04, F-05, F-06, F-07 |
| AC-7 | window.UBM 0 件 | - | - | - | S-01 | 6 (ESLint) | - |
| AC-8 | stableKey 直書き 0 件 | - | - | - | S-03 | 6 (ESLint) | - |
| AC-9 | localStorage 正本 0 件 | - | - | - | S-02 | 6 (ESLint) | F-15 |
| AC-10 | `/members/[id]` public field のみ | - | C-04 | E-05, E-06 | - | 4 | F-09〜F-12 |
| AC-11 | `/register` responderUrl + form-preview | - | C-05 | E-07 | - | 5 | F-08 |
| AC-12 | 09-ui-ux 検証マトリクス | - | - | E-01〜E-07 | - | UI primitives | - |

## 未トレース 検出

- なし（AC-1〜AC-12 全て test ID と紐付け済み）

## 不変条件 → AC 対応

| 不変条件 | 関連 AC |
| --- | --- |
| #1 (stableKey) | AC-8 |
| #5 (D1 直接禁止) | AC-1, AC-10 |
| #6 (window.UBM) | AC-7 |
| #8 (URL query 正本) | AC-3, AC-9 |
| #9 (`/no-access` 不採用) | (AC-11 で /login 誘導) |
| #10 (無料枠) | AC-3 (URL ベース → Cache-Control 効果) |
