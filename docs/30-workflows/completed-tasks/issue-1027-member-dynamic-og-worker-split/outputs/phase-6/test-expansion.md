# Phase 6 実行結果サマリ — test-expansion

対応: `phase-6.md`（fail path / 回帰 guard / 補助コマンド）

## 追加 fail path（全て default 200 へ収束）

- OG-X-1 フォント欠落 / OG-X-2 API タイムアウト（AbortSignal）/ OG-X-3 不正 id（encodeURIComponent）/ OG-X-4 fullName 空 / OG-X-5 壊れ JSON / OG-X-6 occupation のみ。
- いずれも 4xx/5xx を返さず `200 image/png`（default OG）にフォールバック（INV-5）。

## ヘッダ回帰固定

- OG-H-1/2: `Cache-Control`（成功/default とも `public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800`）。
- OG-H-3: `Content-Type: image/png`（成功・default 双方）。OG-H-4: /health は `application/json`。

## size gate

- SIZE-1: `bash scripts/check-worker-size.sh apps/og/dist`（index.js + wasm 合算）超過時 CI fail（3MiB gzip 予算・実測 717KiB PASS）。
- SIZE-2: web 側 size gate も #1027 後 GREEN 維持（next/og 非混入で非膨張）。

## web 回帰 / env

- WEB-REG-3/4: `next/og` / `ImageResponse` / `@vercel/og` が apps/web に 0 件。
- WEB-REG-5: `site-metadata.ts` に process.env 直参照なし（getPublicEnv 経由）。
- ENV-1/2: `OG_IMAGE_BASE_URL` optional・不正 URL は parse error。

## 補助コマンド

og test / web 回帰 + site-metadata / `rg next/og` / build + size gate（§6.6）を列挙済み。
