# Phase 8 成果物: DRY 適用後差分 (dry-applied-diff.md)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-12 |
| Phase | 8 / 13 |
| 作成日 | 2026-04-27 |
| 種別 | spec_created / docs-only |

## 1. wrangler.toml: Before / After

### Before（Phase 2 設計時点 / コメントなし）

```toml
[env.staging]
[[env.staging.r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "ubm-hyogo-r2-staging"

[env.production]
[[env.production.r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "ubm-hyogo-r2-prod"
```

### After（DRY 化後 / コメント付き正本）

```toml
# apps/api/wrangler.toml（R2 関連抜粋）
#
# 設計根拠:
# - binding 名 R2_BUCKET は全環境共通（UPPER_SNAKE_CASE）
# - bucket_name は環境別に分離（採用案A: 環境別 2 バケット）
# - apps/web/wrangler.toml には R2 設定を追加しない（不変条件 5）
# - 詳細: docs/30-workflows/ut-12-cloudflare-r2-storage/outputs/phase-05/binding-name-registry.md

[env.staging]
[[env.staging.r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "ubm-hyogo-r2-staging"

[env.production]
[[env.production.r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "ubm-hyogo-r2-prod"
```

> TOML の table-of-arrays 仕様により `binding = "R2_BUCKET"` 行は完全 DRY 化できない。コメントで設計根拠を一元管理することで等価とする。

## 2. CORS JSON: Before / After

### Before（Phase 2 設計時点 / 環境別 JSON で全項目記述）

```json
// staging
[
  {
    "AllowedOrigins": ["<staging-origin>"],
    "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
    "AllowedHeaders": ["Content-Type", "Content-Length", "Authorization", "x-amz-content-sha256", "x-amz-date", "x-amz-acl"],
    "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"],
    "MaxAgeSeconds": 3600
  }
]

// production（同じ Methods / Headers / Expose / MaxAge を再記述）
[
  {
    "AllowedOrigins": ["<production-origin>"],
    "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
    "AllowedHeaders": ["Content-Type", "Content-Length", "Authorization", "x-amz-content-sha256", "x-amz-date", "x-amz-acl"],
    "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"],
    "MaxAgeSeconds": 3600
  }
]
```

### After（DRY 化後 / 共通テンプレ + AllowedOrigins のみ環境差し替え）

#### `cors-template.json`（共通テンプレ・コミット可能）

```json
[
  {
    "AllowedOrigins": ["<env-specific-origin>"],
    "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
    "AllowedHeaders": [
      "Content-Type",
      "Content-Length",
      "Authorization",
      "x-amz-content-sha256",
      "x-amz-date",
      "x-amz-acl"
    ],
    "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"],
    "MaxAgeSeconds": 3600
  }
]
```

#### 環境別生成手順（適用前にローカルで生成）

```bash
# staging
sed 's|<env-specific-origin>|<staging-origin>|g' cors-template.json > cors-staging.json
wrangler r2 bucket cors put ubm-hyogo-r2-staging --rules cors-staging.json

# production
sed 's|<env-specific-origin>|<production-origin>|g' cors-template.json > cors-prod.json
wrangler r2 bucket cors put ubm-hyogo-r2-prod --rules cors-prod.json
```

> 生成後の `cors-staging.json` / `cors-prod.json` は実 origin を含むため**コミットしない**。

## 3. 差分サマリー

| 設定 | 重複行数 Before | 重複行数 After | 削減率 |
| --- | --- | --- | --- |
| wrangler.toml `[[r2_buckets]]` | 4 行 ×2 環境 = 8 行 | 4 行 ×2 環境 + 共通コメント 5 行 | 機構的削減はなし（コメントで根拠一元化） |
| CORS JSON | 全項目 ×2 環境 = ~40 行 | 共通テンプレ 1 個 + AllowedOrigins 差し替え | ~50% 削減 |

## 4. 適用前の再確認

- `apps/web/wrangler.toml` には R2 設定が含まれないこと（不変条件 5）
- `binding = "R2_BUCKET"` が両環境で同一
- `bucket_name` が `ubm-hyogo-r2-{prod,staging}` で 01b 命名整合

## 5. AC との対応

- AC-1: 命名 PASS
- AC-2: wrangler.toml diff PASS
- AC-5: CORS テンプレ化 PASS（MINOR: UT-16 完了後 origin 差し替え）

## 6. 完了条件チェック

- [x] wrangler.toml Before/After
- [x] CORS JSON Before/After
- [x] 共通テンプレ化方針
- [x] 差分サマリー
- [x] 機密情報の直書きなし
