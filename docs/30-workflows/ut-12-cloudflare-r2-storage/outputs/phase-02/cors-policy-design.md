# Phase 2 成果物: CORS ポリシー設計 (cors-policy-design.md)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-12 |
| Phase | 2 |
| 作成日 | 2026-04-27 |
| 種別 | spec_created / docs-only |

## 1. 設計方針

- ブラウザから R2 への Presigned URL 経由直接アップロード（PUT）/ ダウンロード（GET）に対応する
- AllowedOrigins は環境別に厳格指定し、`*` を絶対に使わない
- AllowedMethods / AllowedHeaders / ExposeHeaders / MaxAgeSeconds は環境共通テンプレート化（Phase 8 で DRY 化）
- UT-16 完了前は `<env-specific-origin>` プレースホルダで記述、完了後に実値差し替え

## 2. CORS ルール（環境別 AllowedOrigins）

| 環境 | AllowedOrigins | 備考 |
| --- | --- | --- |
| local（開発） | `http://localhost:3000` | staging バケットのみに許可（production には許可しない） |
| staging | `<staging-origin>` | UT-16 完了後 staging.<custom-domain> に差し替え |
| production | `<production-origin>` | UT-16 完了後 <custom-domain> に差し替え |

> 暫定値は `<env-specific-origin>` プレースホルダで記述し、UT-16 完了後に Phase 12 implementation-guide の「CORS 再設定」手順に従って実値に差し替える。

## 3. 共通フィールド設計

| フィールド | 値 | 根拠 |
| --- | --- | --- |
| AllowedMethods | `GET`, `PUT`, `POST`, `HEAD` | Presigned URL は PUT、GET はダウンロード、POST は multipart 用 |
| AllowedHeaders | `Content-Type`, `Content-Length`, `Authorization`, `x-amz-content-sha256`, `x-amz-date`, `x-amz-acl` | AWS S3 互換 SDK 利用時に必要 |
| ExposeHeaders | `ETag`, `Content-Length`, `Content-Type` | クライアント側で整合性確認に使用 |
| MaxAgeSeconds | `3600` | preflight キャッシュ 1 時間 |

## 4. CORS JSON サンプル（staging 用）

```json
[
  {
    "AllowedOrigins": ["<staging-origin>"],
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

## 5. CORS JSON サンプル（production 用）

```json
[
  {
    "AllowedOrigins": ["<production-origin>"],
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

## 6. CORS 適用手順（Phase 5 で実行する想定）

```bash
# staging
wrangler r2 bucket cors put ubm-hyogo-r2-staging --rules ./cors-staging.json

# production
wrangler r2 bucket cors put ubm-hyogo-r2-prod --rules ./cors-prod.json

# 確認
wrangler r2 bucket cors get ubm-hyogo-r2-staging
wrangler r2 bucket cors get ubm-hyogo-r2-prod
```

## 7. UT-16 完了後の再設定ルール

1. Phase 12 implementation-guide の「CORS 再設定 runbook」を参照
2. UT-16 で確定した本番ドメインを取得
3. `cors-staging.json` / `cors-prod.json` の AllowedOrigins を実値に差し替え
4. `wrangler r2 bucket cors put` を再実行
5. 適用後 `wrangler r2 bucket cors get` で確認
6. apps/web の CSP も同期更新（別タスクで連動）

## 8. 異常系設計（Phase 6 で検証）

| ケース | 期待挙動 | 対応 Phase |
| --- | --- | --- |
| 許可外 origin からの PUT | preflight で 403 / OPTIONS 失敗 | Phase 6 FC-01 |
| AllowedHeaders 不足の Header | preflight で `Access-Control-Allow-Headers` ミスマッチ → 失敗 | Phase 6 FC-01 |
| `*` 設定混入 | Phase 9 で grep 検出 → BLOCKER 判定 | Phase 9 secret hygiene |

## 9. 機密情報チェック

- `<staging-origin>` / `<production-origin>` を実値に差し替えた状態で本書をコミットしない
- AllowedOrigins に Cloudflare Account ID やトークン値が含まれることはない（origin URL のみ）

## 10. 完了条件チェック

- [x] AllowedOrigins が環境別に列挙されている（プレースホルダ）
- [x] AllowedMethods / Headers が用途と紐付けて定義されている
- [x] CORS JSON サンプルが staging / production の双方で記載
- [x] 適用手順 (`wrangler r2 bucket cors put`) が記載
- [x] UT-16 完了後の再設定ルールが明示
- [x] `*` を使わない方針が記載
- [x] 機密情報の直書きなし
