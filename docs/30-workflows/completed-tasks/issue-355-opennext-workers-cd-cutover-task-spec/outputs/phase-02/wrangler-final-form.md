# `apps/web/wrangler.toml` 最終形（テキスト仕様）

Phase 2 設計の中核成果。現状を最終形として固定する。下表の section が揃っていれば AC-5 を満たす。

## 構造

| section | 値 / 構造 | 役割 |
| --- | --- | --- |
| トップ `name` | `ubm-hyogo-web` | Workers script 名（プロジェクトデフォルト） |
| トップ `main` | `.open-next/worker.js` | OpenNext 生成 entrypoint |
| トップ `compatibility_date` | `2025-01-01` | Workers runtime 互換日 |
| トップ `compatibility_flags` | `["nodejs_compat"]` | OpenNext 必須 flag |
| `[assets]` | `directory = ".open-next/assets"` / `binding = "ASSETS"` / `not_found_handling = "single-page-application"` | 静的アセット配信 |
| `[observability]` | `enabled = true` | Workers 観測 |
| `[vars]` | `ENVIRONMENT = "production"` | デフォルト環境変数 |
| `[env.staging]` | `name = "ubm-hyogo-web-staging"` | staging Workers script 名 |
| `[env.staging.vars]` | `ENVIRONMENT="staging"` / `PUBLIC_API_BASE_URL` / `INTERNAL_API_BASE_URL` | staging 用 API URL |
| `[[env.staging.services]]` | `binding = "API_SERVICE"` / `service = "ubm-hyogo-api-staging"` | service binding |
| `[env.staging.assets]` | root と同型 | staging asset 配信 |
| `[env.staging.observability]` | `enabled = true` | staging 観測 |
| `[env.production]` 配下一式 | staging と同型・production 値 | production 用 |

## 必須要件

- `main = ".open-next/worker.js"` を維持すること
- `[assets]` セクション（root / staging / production の 3 箇所）に `directory = ".open-next/assets"` が存在すること
- `[[env.<stage>.services]]` で `API_SERVICE` binding が `ubm-hyogo-api-<stage>` を指していること
- `compatibility_flags = ["nodejs_compat"]` を含むこと（OpenNext 必須）

## 禁止事項

- `pages_build_output_dir` を再導入しない（AC-5 違反）
- D1 binding（`[[d1_databases]]`）を追加しない（不変条件 #5: apps/web は D1 直接アクセス禁止）

## 検証コマンド

```bash
# AC-5 静的検証
grep -n "pages_build_output_dir" apps/web/wrangler.toml   # 結果ゼロを期待
grep -n 'main = ".open-next/worker.js"' apps/web/wrangler.toml   # 1 件ヒットを期待
grep -n '\[\[d1_databases\]\]' apps/web/wrangler.toml   # 結果ゼロを期待（不変条件 #5）
```

## Phase 1 / 既実装との整合

Phase 1 P50 調査で `apps/web/wrangler.toml` は既に OpenNext 形式で整備済み（`main = ".open-next/worker.js"` 設定済 / `pages_build_output_dir` 不在 / `[assets]` 完備）。本ファイルは「現状維持を最終形として固定する」ことを明文化する役割であり、新規追加・破壊的変更は不要。
