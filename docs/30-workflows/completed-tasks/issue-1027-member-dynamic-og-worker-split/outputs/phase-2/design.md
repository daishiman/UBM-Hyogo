# Phase 2 成果物: 設計

本ファイルは `phase-2.md`（仕様）の実行結果サマリ。

## 確定設計

- **新規 Worker** `apps/og`（`@ubm-hyogo/og`）= Hono + `workers-og`（satori+resvg-wasm）。
- **API 契約**: `GET /members/:id` → `200 image/png`(1200×630) / `GET /health` / 失敗時 default 画像で 200。
- **member 取得**: service binding `API_SERVICE`（推奨）/ `PUBLIC_API_BASE_URL` fetch（フォールバック）。read-only、新フィールドなし。
- **web 統合**: `env.ts` に `OG_IMAGE_BASE_URL`、`site-metadata.ts` に `buildMemberOgImageUrl()`、member 詳細 `page.tsx` で `ogImagePath` 切替 + `twitterCard: summary_large_image`、`wrangler.toml` var 追加。
- **CI**: `og-cd.yml`（build → size gate → deploy）。
- **配色**: tokens.css 由来の `BRAND_COLORS` 定数（satori は CSS 変数非対応のため複製・コメント明記）。

## ライブラリ

`workers-og` 採用。Phase 4 冒頭で wasm 初期化 smoke、失敗時 satori+`@resvg/resvg-wasm` 直叩きへ。

## SubAgent lane

lane-1: phase 4-7 / lane-2: phase 8-11 / lane-3: phase 12-13 / validation 直列。
