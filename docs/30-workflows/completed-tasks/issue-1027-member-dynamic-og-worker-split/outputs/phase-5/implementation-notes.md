# Phase 5 実行結果サマリ — implementation-notes

対応: `phase-5.md`（TDD Green・実装）

## 変更対象（index.md 俯瞰表と整合）

- 新規 apps/og: 6（package.json / wrangler.toml / tsconfig.json / src/index.ts / src/render.tsx / src/member-source.ts）
- 編集 apps/web: 4（env.ts / seo/site-metadata.ts / members/[id]/page.tsx / wrangler.toml）
- CI 新規: `.github/workflows/og-cd.yml`
- 後方互換で拡張: `scripts/check-worker-size.sh`（位置引数にディレクトリを許容し `bash scripts/check-worker-size.sh apps/og/dist` で index.js + wasm を合算）
- 確認のみ: `pnpm-workspace.yaml`（`apps/*` glob 済み → apps/og 自動認識・編集不要）

## 主要シグネチャ

- `fetchMemberSummary(id, env): Promise<MemberSummary | null>`（service binding `API_SERVICE` 優先 → `PUBLIC_API_BASE_URL?.trim()` フォールバック → falsy なら null）
- `renderMemberOg(summary): Promise<Uint8Array>` / `renderDefaultOg(): Promise<Uint8Array>`（1200×630 PNG）
- Hono: `GET /members/:id`（try/catch で常に 200 image/png + Cache-Control）、`GET /health`（200 json）
- `buildMemberOgImageUrl(id): string | undefined`（`getPublicEnv().OG_IMAGE_BASE_URL?.trim()` 経由・末尾スラッシュ正規化・空は undefined）

## 重要な実装方針

- `BRAND_COLORS` は tokens.css 由来の値を複製（satori が CSS 変数非対応）。手動同期義務をコメント明記。
- env 参照は `getPublicEnv()` 経由のみ（process.env 直参照禁止・不変条件 #11）。
- `twitter.card` を `"summary"` → `"summary_large_image"` に戻す。
- INV-1（既存 API surface のみ）/ INV-2（D1 直アクセスなし）/ INV-3（web に next/og なし）遵守。

## CONST_005 網羅

変更対象ファイル / シグネチャ / 入出力 / テスト方針 / ローカル実行コマンド（§5.9）/ DoD（§5.10）を本 Phase で記載済み。
