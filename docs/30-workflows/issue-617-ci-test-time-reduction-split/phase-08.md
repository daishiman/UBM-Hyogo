# Phase 8: scripts/coverage-guard.sh の --group 対応

## 変更対象

- `scripts/coverage-guard.sh`

## 追加仕様

### 既存引数（維持）

- `--changed` / `--package <name>` / `--threshold <n>` / `--no-run`

### 追加引数

- `--group <web|api-unit|api-d1|packages>`
  - 対応する package / config を選択して実行
  - 内部で `pnpm --filter <pkg> run <script>` を呼ぶ

### group → 実行スクリプト マッピング

| group | filter | script |
| --- | --- | --- |
| web | `@ubm-hyogo/web` | `test:coverage:web` |
| api-unit | `@ubm-hyogo/api` | `test:coverage:unit` |
| api-d1 | `@ubm-hyogo/api` | `test:coverage:d1` |
| packages | `./packages/*` (workspace filter) | `test:coverage` |

### 集約モード

- `--no-run` モード時は test 実行をスキップし、各 package の `coverage/coverage-summary.json` のみ集計（既存挙動を維持）
- `apps/api/coverage/coverage-summary.json`（merge 後）が無く unit/d1 が存在する場合は ENV ERROR ではなく、`scripts/coverage-merge.mjs` を呼んで merge を試みる helper を追加する

## 検証

```bash
bash scripts/coverage-guard.sh --group web
bash scripts/coverage-guard.sh --group api-unit
bash scripts/coverage-guard.sh --group api-d1
bash scripts/coverage-guard.sh --group packages
bash scripts/coverage-guard.sh --no-run
```

期待: 各 group が対応 package のみ実行し、`--no-run` は集計だけ実施。

## 完了条件

- `--group` 引数が動作
- 既存 `--changed` / `--package` / `--threshold` / `--no-run` を破壊しない
- aggregate 時の merge fallback が動く
