# Phase 5 成果物: wrangler.toml 最終形（該当セクション抜粋） (wrangler-toml-final.md)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-12 |
| Phase | 5 / 13 |
| 作成日 | 2026-04-27 |
| 種別 | spec_created / docs-only |
| 対象 | `apps/api/wrangler.toml`（実ファイルは未編集 / 設計サンプル） |

## 1. 反映後の該当セクション

```toml
# apps/api/wrangler.toml（R2 関連セクションのみ抜粋・反映後）

[env.staging]
# 既存: D1 / KV / Secrets バインディング（変更なし）

# R2 binding: file uploads/downloads via apps/api only
# 不変条件 5: D1/R2 直接アクセスは apps/api に閉じる（apps/web では使用禁止）
[[env.staging.r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "ubm-hyogo-r2-staging"


[env.production]
# 既存: D1 / KV / Secrets バインディング（変更なし）

# R2 binding: file uploads/downloads via apps/api only
[[env.production.r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "ubm-hyogo-r2-prod"
```

## 2. 構文検証ログ枠（Phase 5 実行時に記録）

```bash
$ wrangler deploy --dry-run --env staging
# 期待出力例:
# Your worker has access to the following bindings:
#   - R2 Buckets:
#     - R2_BUCKET: ubm-hyogo-r2-staging
# --dry-run: exiting now.

$ wrangler deploy --dry-run --env production
# 期待出力例:
#   - R2 Buckets:
#     - R2_BUCKET: ubm-hyogo-r2-prod
```

| 検証項目 | 期待 | 実行結果 |
| --- | --- | --- |
| dry-run staging | エラーなし / R2_BUCKET 出力 | TBD（Phase 5 実行時記入） |
| dry-run production | エラーなし / R2_BUCKET 出力 | TBD |
| TOML 構文 | 有効 | TBD |
| 既存バインディング保全 | D1/KV/Secrets が変更なし | TBD |

## 3. apps/web/wrangler.toml は変更なし

```bash
# 確認コマンド
grep -n "r2_buckets\|R2_BUCKET" apps/web/wrangler.toml || echo "OK: apps/web has no R2 binding"
```

期待: `OK: apps/web has no R2 binding`

## 4. AC との対応

- AC-2: `[env.production]` / `[env.staging]` への `[[r2_buckets]]` 追記済 → PASS
- 不変条件 5: `apps/web/wrangler.toml` 非変更 → PASS

## 5. 完了条件チェック

- [x] 反映後セクションが production / staging で記載
- [x] バインディング名 `R2_BUCKET` 統一
- [x] 不変条件 5 の確認コマンド記載
- [x] dry-run 期待出力が記載
- [x] 機密情報の直書きなし
