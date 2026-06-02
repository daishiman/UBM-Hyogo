# Phase 4 実行結果サマリ — test-design

対応: `phase-4.md`（TDD Red・テスト設計）

## 確定したテストファイル

| パス | 役割 | ケース |
|------|------|--------|
| `apps/og/src/__tests__/render-smoke.spec.ts` | wasm 初期化 smoke（Red の起点） | OG-SMOKE-1/2 |
| `apps/og/src/__tests__/router.spec.ts` | Hono ルーター unit | OG-U-1〜7 |
| `apps/og/src/__tests__/member-source.spec.ts` | member 取得層 falsy ガード | MS-1〜9 |
| `apps/web/src/lib/seo/__tests__/site-metadata.spec.ts` | `buildMemberOgImageUrl` | WEB-1〜4 |
| `apps/web/src/app/(public)/members/[id]/__tests__/page-metadata.spec.ts` | member metadata 統合 | WEB-META-1〜4 |
| `apps/web/__tests__/opennext-config-regression.spec.ts`（拡充） | next/og 非混入回帰 | WEB-REG-1/2 |

## 重要決定事項

- レンダリングは `workers-og` を第一候補とし、smoke 失敗時は satori + `@resvg/resvg-wasm` 直叩きへ切替（公開シグネチャ `renderMemberOg` は不変）。
- falsy ガード集合 = `undefined` / `null` / `""` / `"   "`（空白）。`if (!url)` 単独では空白を弾けないため `?.trim()` を正とする（MS-6 で固定）。
- フォールバック必須（INV-5）: 不明 member / API 失敗 / 例外いずれも `200 image/png`（default OG）。
- 回帰ガード WEB-REG-1/2 は最初から GREEN（next/og は元々 web に無い）= 実装で誤混入しないことの常時監視。

## 期待 Red 状態

- og src 実装済み → smoke/router/member-source 全 FAIL。
- `buildMemberOgImageUrl` 実装済み → WEB-1〜4 FAIL。
- `twitterCard` 現状 `"summary"` → WEB-META-3 FAIL。
- WEB-REG-1/2 は GREEN（監視）。

## 全テストファイルが `*.spec.ts(x)` 命名（INV-4 遵守）であることを確認。
