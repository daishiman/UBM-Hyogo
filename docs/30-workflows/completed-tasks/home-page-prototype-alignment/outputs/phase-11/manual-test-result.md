# Phase 11 Manual Test Result

## Status

`pass`（コード実装完了・ローカルビルド/テスト PASS・local runtime screenshot 取得済み）

## Implementation Summary

本サイクルで task-01 / task-02 のコード実装を完了:

- `apps/web/src/styles/legacy-public.css` に `home-page-prototype-alignment task-01` マーカー block を追加（PublicHeader / Stats / ZoneIntro / Timeline / MemberGrid / PublicFooter / home rhythm の selector / declaration を 226 行追加）
- `apps/web/src/components/public/CallToActionCTA.tsx` の `call-to-action-cta__*` BEM className / `cta-button--accent` を全廃し、`data-role="inner|copy|eyebrow|heading|body|cta-button"` / `data-variant="accent"` に統一
- `apps/web/src/styles/legacy-public.css` の `[data-component="call-to-action-cta"] .call-to-action-cta__*` selector 群を `[data-role="…"]` 形式に置換
- `apps/web/src/components/public/__tests__/CallToActionCTA.component.spec.tsx` に data-role 駆動構造と BEM className 残存禁止の assertion を追加

## Verification Result (local)

| 検証 | 結果 |
| --- | --- |
| `mise exec -- pnpm typecheck` | ✅ PASS |
| `mise exec -- pnpm lint` | ✅ PASS（dependency-cruiser / stableKey lint / tsc / eslint いずれも 0 violation） |
| `mise exec -- pnpm --filter @ubm-hyogo/web test`（public / CTA 含む全 873 件） | ✅ PASS（1 skipped・既存 skip） |
| `NEXT_PUBLIC_API_BASE_URL=… ENVIRONMENT=local mise exec -- pnpm --filter @ubm-hyogo/web build` | ✅ PASS（Next.js 16 webpack build / route inventory 出力済み） |
| HEX / negative letter-spacing grep（追加 CSS + OG token fix） | ✅ 0 件 |
| `pnpm verify:tokens` | ✅ PASS |

> review 中に `pnpm verify:tokens` が既存 OG image route の HEX 直書きを検出したため、同 cycle で OKLch 値へ置換し PASS まで確認した。

## 視覚的検証（Apple UI/UX 観点）

local `next start` + deterministic mock API で `/` を表示し、JavaScript 無効のサーバ HTML/CSS 表示としてスクリーンショットを取得した。JavaScript 有効時は既存 `/terms` env validation の prefetch 起因エラーが出るため、今回の CSS selector 検証対象から分離した。

### Screenshot Evidence

| Viewport | Path | Result |
| --- | --- | --- |
| desktop 1280x900 | `outputs/phase-11/screenshots/home-desktop-2026-05-23.png` | ✅ captured |
| mobile 390x844 | `outputs/phase-11/screenshots/home-mobile-2026-05-23.png` | ✅ captured |

### Runtime Layout Metrics

| Component | Desktop | Mobile |
| --- | --- | --- |
| `public-header` | 1280x67 / flex | 390x118 / flex |
| `hero` | 1120x322 / grid | 362x377 / grid |
| `stats` | 1120x145 | 362x531 |
| `zone-intro` | 1120x228 | 362x582 |
| `timeline` | 1120x173 | 362x173 |
| `member-grid` | 1120x158 / grid | 362x488 / grid |
| `call-to-action-cta` | 1120x180 | 362x317 |
| `public-footer` | 1280x111 / flex | 390x111 / flex |

視覚契約:

- **レイアウト一貫性**: `[data-page="home"]` で `max-width: 1200px` / `margin: 0 auto` を強制し、セクション間 vertical rhythm を `gap: 8px` で揃える
- **タイポグラフィ**: `--ubm-font-en` / `--ubm-font-serif` / `--ubm-text-xs|sm|md|lg` を経由した token 経由のみ。letter-spacing と font-weight をプロトタイプに合わせて固定
- **コントラスト**: `--ubm-color-text-primary` / `-secondary` / `-muted` の 3 段階を厳守し、border-default vs border-strong を意図的に使い分け
- **インタラクション**: `public-header nav a:hover` / `aria-current="page"` で focus / current state を視覚的に区別、`cta-button` は `min-height: 52px` で touch target を確保
- **レスポンシブ**: `@media (max-width: 900px)` / `(max-width: 600px)` の 2 breakpoint で stat-grid（4→2→1 column）、zone-list（3→1）、timeline grid を段階的に縮退

## Boundary / Followup

- staging deploy はユーザー承認後のみ実行するため未実施
- 既存 `pnpm verify:tokens` 失敗（opengraph-image route の HEX 直書き）は本タスク変更外。今回追加 CSS の HEX は 0 件
