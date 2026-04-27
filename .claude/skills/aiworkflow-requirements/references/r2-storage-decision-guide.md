# Cloudflare R2 ストレージ採用案 決定フロー

> 親仕様書: [deployment-cloudflare.md](deployment-cloudflare.md)
> 役割: R2 ストレージ設計における採用案の判断フロー（UT-12 フィードバックに基づくテンプレ）

## 概要

Cloudflare R2 ストレージを導入する際に、以下の3つの主要な設計判断を行う。
本ガイドでは ubm-hyogo での決定と、他プロジェクトが参考にできる判断フローを提示する。

---

## 判断ポイント一覧

| 判断 | 採用案 | 概要 |
| --- | --- | --- |
| A | 環境別 2 バケット | production / staging で別バケットを持つ |
| D | 専用 R2 Token | `Account > Workers R2 Storage > Edit` の最小権限 token を専用作成 |
| F | プライベート + Presigned URL | バケットを private にし、`apps/api` 経由で presigned URL または proxy を発行 |

---

## 採用案 A: 環境別 2 バケット

### 判断フロー

```
本番とステージングで同じバケットを共有するか？
├─ 共有する → データ混在・誤削除のリスク。特別な理由がなければ非推奨
└─ 分ける → 採用案 A を選択
              ├─ production bucket: ubm-hyogo-r2-prod
              └─ staging bucket: ubm-hyogo-r2-staging
```

### wrangler.toml テンプレート

```toml
[[env.staging.r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "ubm-hyogo-r2-staging"

[[env.production.r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "ubm-hyogo-r2-prod"
```

**ubm-hyogo での決定**: 採用（環境分離を優先）

---

## 採用案 D: 専用 R2 Token

### 判断フロー

```
既存の Cloudflare API Token（Pages / Workers 用）に R2 権限を付与するか？
├─ 付与する → Token の権限が広くなりすぎる。最小権限原則に反する
└─ 分ける → 採用案 D を選択
              Cloudflare Dashboard → My Profile → API Tokens → Create Token
              → テンプレート: "Edit Cloudflare Workers" ではなく Custom Token
              → 権限: Account > Workers R2 Storage > Edit（他は付与しない）
```

**ubm-hyogo での決定**: 採用（最小権限 token を専用作成）

---

## 採用案 F: プライベートバケット + Presigned URL / Proxy

### 判断フロー

```
ファイルをブラウザから直接 R2 にアクセスさせるか？
├─ 直接アクセス → バケットを public にする必要がある。認証制御が困難
└─ API 経由のみ → 採用案 F を選択
                   ├─ Presigned URL: apps/api で期限付き署名 URL を生成し、クライアントに返す
                   │   - GET: R2 オブジェクトへの期限付き読み取り URL
                   │   - PUT: アップロード用の期限付き書き込み URL（直接アップロード）
                   └─ Proxy: apps/api が R2 から取得してクライアントに流す
                       - ファイルサイズが大きい場合は Workers の CPU 制限に注意
```

### Presigned URL 生成例（Hono + R2 binding）

```typescript
// apps/api/src/routes/storage.ts
app.get("/api/files/:key/presigned", async (c) => {
  const key = c.req.param("key");
  // R2 binding は env から取得
  const url = await c.env.R2_BUCKET.createPresignedUrl("GET", key, {
    expiresIn: 3600, // 1時間
  });
  return c.json({ url });
});
```

**ubm-hyogo での決定**: 採用（private bucket + `apps/api` 経由の presigned URL）

---

## CORS テンプレート

環境別に `AllowedOrigins` を差し替える。実ドメインは secrets / environment 管理に寄せる。

```json
[
  {
    "AllowedOrigins": ["<env-specific-origin>"],
    "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
    "AllowedHeaders": ["Content-Type", "Content-Length", "Authorization"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

---

## 変更履歴

| 日付 | バージョン | 変更内容 |
| ---- | ---------- | -------- |
| 2026-04-27 | 1.0.0 | UT-12 skill-feedback-report に基づく初版作成 |
