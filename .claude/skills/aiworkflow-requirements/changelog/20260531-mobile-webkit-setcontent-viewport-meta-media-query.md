# mobile-webkit e2e: `page.setContent` ハーネスは viewport meta 無しだと `@media (max-width)` が発火しない

- 日時: 2026-05-31
- ブランチ: `feat/issue-1006-members-selected-filters-chip-ux-hardening`（PR #1047）
- 関連: `task-specification-creator/changelog/20260531-mobile-webkit-setcontent-viewport-meta-media-query.md`
- 事象: PR #1047 で `e2e (mobile-webkit)` のみ fail（`e2e-tests-coverage-gate` は連鎖 fail）。`members-selected-filters-chip-ux.spec.ts` の mobile 縦積みテストが `expect(bar).toHaveCSS('flex-direction', 'column')` で失敗。locator は resolve するが computed `flex-direction` が `row` のまま（14 回 retry → timeout）。desktop-chromium / desktop-firefox では同テスト pass。
- 根本原因: ハーネスを `page.setContent(html)` で描画しており HTML に `<meta name="viewport">` が無い。`mobile-webkit` プロジェクトは `devices['iPhone 13']`（`isMobile: true`）を使うため、viewport meta が無いと **レイアウトビューポートが既定の ~980px にフォールバック**し、`page.setViewportSize({width:390})` で device 幅を 390 にしても CSS の `@media (max-width: 640px)` は 980px に対して評価され発火しない。`isMobile: false` の desktop プロジェクトはレイアウト幅 = set viewport 幅となるため発火し pass する（= プロジェクト差で表面化）。
- 修正: ハーネス HTML の `<head>` に `<meta name="viewport" content="width=device-width, initial-scale=1" />` を 1 行追加。実プロダクトの `/members` は Next.js が viewport meta を自動付与するため**実機は元々正常**で、欠落していたのは `setContent` ハーネス側のみ（テスト不備であり product バグではない）。
- 検証: `@playwright/test` の `webkit` + `devices['iPhone 13']` を直接使う最小スクリプトで `meta=NO → flex-direction=row` / `meta=YES → flex-direction=column` を再現確認。
- 教訓（汎用化候補）: **`page.setContent` ベースの component-harness で responsive `@media` を検証する場合は viewport meta を必ず HTML に含める。** isMobile デバイスでの media query 評価はレイアウトビューポート基準であり、`setViewportSize` だけでは不十分。`docs/00-getting-started-manual` の visual/e2e harness ガイドへ前提として明記候補。
