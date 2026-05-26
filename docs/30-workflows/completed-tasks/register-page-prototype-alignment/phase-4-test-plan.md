---
phase: 4
title: テスト計画
workflow_id: register-page-prototype-alignment
status: draft
taskType: implementation
visualEvidence: VISUAL_ON_EXECUTION
---

# Phase 4 — テスト計画

[実装区分: 実装仕様書]

## 1. 目的

`/register` を `claude-design-prototype` の `MemberFormPage` 構成（Hero CTA → StepGrid → FormPreviewSections collapsible → FAQ → Bottom CTA）に整合させるための単体テスト・a11y テスト・回帰防止策を定義する。新規 3 component + 既存 2 component 更新分の test surface を網羅する。

## 2. テスト対象と方針

| 対象 | テスト種別 | テストファイル |
|------|-----------|----------------|
| RegisterHeroCallout (Hero CTA 化) | 単体（既存更新） | `apps/web/src/components/public/__tests__/RegisterHeroCallout.component.spec.tsx` |
| FormPreviewSections (collapsible 化) | 単体（既存更新） | `apps/web/src/components/public/__tests__/FormPreviewSections.component.spec.tsx` |
| RegisterStepGrid (新規) | 単体（新規） | `apps/web/src/components/public/__tests__/RegisterStepGrid.component.spec.tsx` |
| RegisterFaq (新規) | 単体（新規） | `apps/web/src/components/public/__tests__/RegisterFaq.component.spec.tsx` |
| RegisterBottomCTA (新規) | 単体（新規） | `apps/web/src/components/public/__tests__/RegisterBottomCTA.component.spec.tsx` |
| page.tsx 統合 | server-component smoke (任意) | `apps/web/app/(public)/register/__tests__/page.smoke.spec.ts`（既存追従。新規追加は最小限） |

## 3. 単体テストケース（要約表）

### RegisterHeroCallout

| ID | ケース | 期待 |
|----|--------|------|
| RC-01 | responderUrl が href に反映される | `getByRole('link', {name: /Google フォームを開く/})` が `responderUrl` を指す |
| RC-02 | target="_blank" + rel="noopener noreferrer" | 属性が維持される |
| RC-03 | publicConsent / rulesConsent 文字列の維持 | 画面に両文字列が存在 |
| RC-04 | data-component / data-role 属性 | `data-component="register-callout"`, `data-role="register-cta"` |
| RC-05 | a11y | axe 違反 0 件 |
| RC-06 | Hero 装飾要素 | `data-role="register-eyebrow"` または Chip "Google Forms" が描画 |

### FormPreviewSections (collapsible)

| ID | ケース | 期待 |
|----|--------|------|
| FPS-01 | 既存: section 数表示 | `sectionCount` 件を含むテキストが描画 |
| FPS-02 | 既存: stableKey 経由 field 描画 | `data-stable-key` が field 数分存在 |
| FPS-03 | 新規: 1番目セクションが open | `<details open>` が最初の section のみ |
| FPS-04 | 新規: summary クリックで展開 | `userEvent.click(summary)` で `open` 属性が toggle |
| FPS-05 | 新規: 集計 Chip | 公開 / 会員限定 / 全件のカウントが表示 |
| FPS-06 | a11y | axe 違反 0 件 |

### RegisterStepGrid

| ID | ケース | 期待 |
|----|--------|------|
| RSG-01 | 3 ステップ描画 | `data-role="register-step"` 要素が 3 件 |
| RSG-02 | STEP 番号 01/02/03 | mono font 番号が描画 |
| RSG-03 | data-component | `data-component="register-step-grid"` |
| RSG-04 | a11y | landmark / heading hierarchy が正しい |

### RegisterFaq

| ID | ケース | 期待 |
|----|--------|------|
| RF-01 | items prop の数だけ details 生成 | items.length 件 |
| RF-02 | summary クリックで開閉 | open 属性 toggle |
| RF-03 | デフォルト全 closed | 初期状態で open 要素なし |
| RF-04 | a11y | summary が button role を含む（details ネイティブ）|

### RegisterBottomCTA

| ID | ケース | 期待 |
|----|--------|------|
| RBC-01 | responderUrl href | RC-01 同様 |
| RBC-02 | target/rel | RC-02 同様 |
| RBC-03 | data-component | `data-component="register-bottom-cta"` |
| RBC-04 | inverted variant | `data-variant="inverted"` |

## 4. a11y / Snapshot 方針

- 各 spec 末尾に `await expectAxeClean(container)` 相当の helper（既存があれば利用、無ければ `axe(container)`+`toHaveNoViolations`）を追加。
- スナップショットは新規には作成しない（DOM 構造が token-driven のため、属性 / role / text ベース assertion で十分）。既存 snapshot がある場合は意図的更新としてレビュー対象に明示する。

## 5. Playwright smoke 方針

既存 `apps/web/playwright/tests/public-pages/` 等に `/register` smoke が存在すれば、5 セクション（hero-cta / step-grid / form-preview-sections / faq / bottom-cta）の `data-component` 属性検出 1 ケースに**限定追加**。既存ケース増分なしで attribute 確認だけを差し込めるなら新規 spec は作らない。Visual regression は本 PR では追加しない（既存 baseline 影響を最小化）。

## 6. testIds / data-component 命名規約

| 属性 | 値 |
|------|-----|
| data-component | `register-callout` / `register-step-grid` / `form-preview-sections` / `register-faq` / `register-bottom-cta` |
| data-role | `register-cta` / `register-step` / `register-faq-item` / `register-bottom-cta-link` |
| data-variant | `inverted`（Bottom CTA のみ）|

これらは Playwright smoke / visual harness からの参照点として固定する。

## 7. coverage 影響

新規 3 component は branches/lines/funcs/stmts 全て 90% 以上を目標。既存しきい値は降下させない（Phase 7 で再確認）。
