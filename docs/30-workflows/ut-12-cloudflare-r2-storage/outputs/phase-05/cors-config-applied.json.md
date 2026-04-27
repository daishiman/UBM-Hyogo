# Phase 5 成果物: 適用済み CORS JSON とログ (cors-config-applied.json.md)

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク | UT-12 |
| Phase | 5 / 13 |
| 作成日 | 2026-04-27 |
| 種別 | spec_created / docs-only |
| 適用予定 | future-file-upload-implementation Phase 5 再生時 |

## 1. 適用 JSON（staging）

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

> `<staging-origin>` は Phase 5 実行時に staging 環境の実 origin に置換。UT-16 完了後に正式値（`https://staging.<custom-domain>`）に再差し替え。

## 2. 適用 JSON（production）

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

## 3. 適用コマンドと期待出力

```bash
# staging
$ wrangler r2 bucket cors put ubm-hyogo-r2-staging --rules ./cors-staging.json
# 期待: "Updated CORS rules for bucket 'ubm-hyogo-r2-staging'"

# production
$ wrangler r2 bucket cors put ubm-hyogo-r2-prod --rules ./cors-prod.json
# 期待: "Updated CORS rules for bucket 'ubm-hyogo-r2-prod'"

# 適用結果取得
$ wrangler r2 bucket cors get ubm-hyogo-r2-staging
$ wrangler r2 bucket cors get ubm-hyogo-r2-prod
```

## 4. 適用ログ枠（Phase 5 実行時に記録）

| バケット | 適用日時 | 実行者 | 結果 | get 結果（ルール件数） |
| --- | --- | --- | --- | --- |
| ubm-hyogo-r2-staging | TBD | TBD | TBD（成功/失敗） | TBD |
| ubm-hyogo-r2-prod | TBD | TBD | TBD | TBD |

## 5. UT-16 完了後の再適用 TODO

```
[ ] AllowedOrigins を <staging-origin> → 実 staging URL に差し替え
[ ] AllowedOrigins を <production-origin> → 実 production URL に差し替え
[ ] wrangler r2 bucket cors put を再実行
[ ] wrangler r2 bucket cors get で適用確認
[ ] apps/web の CSP も同期更新（別タスクで連動）
```

## 6. 機密情報の取扱い

- 実 origin 値はリポジトリにコミットしない（`<env-specific-origin>` プレースホルダのまま）
- 実 origin への差し替えは Phase 5 実行担当者がローカルで行い、Cloudflare に適用後にプレースホルダへ戻す（または別ブランチで管理）

## 7. AC との対応

- AC-5: CORS JSON が両環境で適用 → PASS（spec_created として手順定義済）

## 8. 完了条件チェック

- [x] staging / production の JSON が記載
- [x] 適用コマンド・期待出力が記載
- [x] 適用ログ枠が用意
- [x] UT-16 再適用 TODO が記載
- [x] AllowedOrigins プレースホルダで機密情報なし
