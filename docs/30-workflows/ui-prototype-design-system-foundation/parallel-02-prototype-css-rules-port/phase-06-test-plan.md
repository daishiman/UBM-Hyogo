---
phase: 6
title: テスト方針 — visual snapshot / hover force / a11y
workflow_id: ui-prototype-design-system-foundation
sub_workflow: parallel-02-prototype-css-rules-port
status: spec_created
---

# Phase 6 — テスト方針

[実装区分: 実装仕様書]

## 1. テスト戦略

CSS 規則のみの追加であるため、テストの主軸は **Playwright visual snapshot** とする。Vitest の DOM スナップショットでは CSS の hover/focus 描画を捉えられないため、Playwright で実描画を撮影する。

## 2. テスト種別と対象

| 種別 | 対象 | 目的 |
|------|------|------|
| Playwright visual snapshot | tag pill selected / member card default / member card hover / visibility public/member/admin | 視覚回帰 |
| Playwright a11y (axe) | tag pill list / member card grid / visibility section | aria-selected が screen reader に伝搬していること |
| Vitest (DOM) | (本件のみでは不要 — markup 側 PR で別途付与) | — |
| 静的 lint | `apps/web/src/styles/globals.css` | stylelint (もし設定があれば) で構文確認 |
| token grep | `grep -rEn 'bg-\[#\|text-\[#\|border-\[#' apps/web/src` | HEX 直書きなしを確認 |

## 3. Playwright visual snapshot 詳細

### 3.1 撮影 scenario

| Scenario | route | 撮影 state | 撮影方法 |
|----------|-------|----------|---------|
| tag-pill-selected | `/(public)/members?tag=foo` | active tag に `aria-selected="true"` | 通常 screenshot |
| member-card-default | `/(public)/members` | 一覧 grid を nominal state で撮影 | 通常 screenshot |
| member-card-hover | `/(public)/members` | 1 枚目のカードに hover | `page.locator(...).hover({ force: true })` 後撮影 |
| visibility-public | `/(public)/members/[id]` | 既定 (全 section が public) | 通常 screenshot |
| visibility-member / admin | (fixture seed で section に admin/member を含めた状態) | 同上 | 通常 screenshot |

### 3.2 hover の取り扱い

CSS `:hover` は Playwright の `page.hover()` で発火する。

```ts
await page.locator('[data-component="member-card"]').first().hover({ force: true });
await page.waitForTimeout(200); // transition 完了待ち (var(--ubm-dur-fast) = .15s)
await expect(page).toHaveScreenshot('member-card-hover.png');
```

`force: true` を使用する理由: layout shift や element の visibility 確認をスキップしたい場合、また prototype の transition 時間が短いため早期完了を保証するため。

### 3.3 reduced motion 環境

`@media (prefers-reduced-motion: reduce)` でも CSS が壊れないことを確認:

```ts
await page.emulateMedia({ reducedMotion: 'reduce' });
// 同じ snapshot を撮影しても base 状態 (transition なし) になることを期待
```

## 4. a11y テスト

```ts
import AxeBuilder from '@axe-core/playwright';

test('tag pill aria-selected', async ({ page }) => {
  await page.goto('/members?tag=foo');
  const results = await new AxeBuilder({ page })
    .include('[data-component="tag-pill"]')
    .analyze();
  expect(results.violations).toEqual([]);
});
```

期待値: `aria-selected` 属性に対する axe rule 違反が 0 件。

## 5. baseline 管理

- 初回実装時に baseline screenshot を `e2e/__screenshots__/parallel-02/` 配下に commit
- diff 許容閾値: `maxDiffPixelRatio: 0.02` (transition のサブピクセル差吸収)
- baseline 更新は本サブワークフローの実装 PR で同時に行う

## 6. 不要なテスト (明示)

| 不要なテスト | 理由 |
|------------|------|
| CSS 構文 unit test | 既存 build pipeline で接続される `next build` が構文 fail を検知 |
| 各 token 値の数値検証 | tokens.css を `--ubm-*` 経由でしか参照しないため、token 側変更を本件が破壊しない (token 検証は task-08 / parallel-01 の責務) |
| markup 属性付与の Vitest | 別サブワークフロー (serial-05) で担保 |

## 7. テスト実行コマンド

```bash
# Playwright visual
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --grep "parallel-02"

# Playwright a11y
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --grep "a11y"

# baseline 更新 (intentional)
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --update-snapshots --grep "parallel-02"
```

## 8. flaky 対策

| 原因 | 対策 |
|------|------|
| transition の中途撮影 | `waitForTimeout(200)` でフェード完了を待つ |
| font の読み込み遅延 | `await page.evaluate(() => document.fonts.ready)` を撮影前に挿入 |
| emoji rendering 差 | OS / browser ごとに emoji glyph が異なるため、baseline は CI 環境 (linux + Chromium) 固定で生成する |
