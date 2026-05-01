# Phase 6 outputs — 異常系一覧と検出方針

## 異常系 5 ケース（要約）

| ID | 名称 | 1次シグナル | 関連 AC |
| --- | --- | --- | --- |
| A | esbuild Host/Binary version mismatch 再発 | wrangler 起動時に version mismatch ログ | AC-1 |
| B | `PUBLIC_API_BASE_URL` 未設定（localhost fallback） | staging で 5xx / 空配列 | AC-5 |
| C | D1 migration 未 apply | `no such table` 等の SQL error | AC-3 / AC-4 |
| D | staging vars drift（古い preview URL 等） | URL Host 不一致 | AC-5 |
| E | member seed 0 件 | `/members` body が `[]` | AC-3 |

## 検出方針

| 観点 | 方針 |
| --- | --- |
| 一次検出 | curl status / API レスポンス body / wrangler stdout |
| 二次検出 | `bash scripts/cf.sh` 経由の vars dump / d1 migrations list / d1 execute |
| 切り分けの粒度 | matrix 行単位（route × env）で expected と乖離した行から起点 |
| 再現性 | 異常時は最低 1 回は再実行しフレーキー除外 |
| secret hygiene | API token / D1 ID 実値は出力させない / 残さない |

## 共通禁止事項（再掲）

- `wrangler` 直接実行禁止（`bash scripts/cf.sh` 経由のみ）
- 04a API 実装変更や 02b migration 新規追加は本タスクで行わない（scope out）
- evidence への実 ID / token / OAuth 値の混入禁止

## 復旧後の再実行

5 ケースいずれも復旧後に Phase 5 ランブック step 3〜10 を**最初から**再実行し、curl matrix を全 GREEN にして evidence を上書き保存する。

## 詳細

各ケースの切り分け手順 / 復旧アクション / AC trace は `phase-06.md` 本体を参照。
