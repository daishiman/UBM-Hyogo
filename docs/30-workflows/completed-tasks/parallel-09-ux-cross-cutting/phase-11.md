# Phase 11: VISUAL evidence（Playwright snapshot 取得）

[実装区分: 実装仕様書]

> **実装区分判定根拠**: Phase 6 で実装した 4 primitive + 1 hook + globals.css 規則を、**実 Playwright を起動して 6 種類の scaled visual snapshot を撮影し evidence として固定する** Phase。本タスクは VISUAL タスクであるため、phase-11/visual-verification-skip.md は採用せず、必ず 6 種 snapshot を取得する。

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | parallel-09-ux-cross-cutting (G9-1〜G9-9) |
| Phase 番号 | 11 / 13 |
| Phase 名称 | VISUAL evidence（Playwright snapshot 取得） |
| 作成日 | 2026-05-15 |
| 担当 | delivery |
| 前 Phase | 10 (リファクタ) |
| 次 Phase | 12 (正本同期) |
| 状態 | pending |
| タスク種別 | implementation / **VISUAL** |

---

## 目的

Phase 6 / 10 で完成した 4 primitive + globals.css 規則の視覚的振る舞いを、Playwright で **6 種類の scaled visual snapshot** として取得し、PR レビューと将来の regression 防止のための evidence として `outputs/phase-11/screenshots/` に固定する。

本 Phase は VISUAL タスク必須対応であり、`visual-verification-skip.md` の適用は **不可**。

---

## 11-1. 撮影対象 6 種

| # | 撮影対象 | primitive | scale | ファイル名 |
| --- | --- | --- | --- | --- |
| 1 | FormField error 表示 | FormField (G9-1) | 1x / 2x | `01-formfield-error.png` / `01-formfield-error@2x.png` |
| 2 | Icon 4 sizes 並列 | Icon (G9-4) | 1x / 2x | `02-icon-4sizes.png` / `02-icon-4sizes@2x.png` |
| 3 | Breadcrumb trail (3 階層 + 最終 aria-current) | Breadcrumb (G9-5) | 1x / 2x | `03-breadcrumb.png` / `03-breadcrumb@2x.png` |
| 4 | focus-visible outline (button / a / input) | globals.css (G9-7) | 1x / 2x | `04-focus-visible.png` / `04-focus-visible@2x.png` |
| 5 | Pagination disabled state (prev disabled + next enabled) | Pagination (G9-3) | 1x / 2x | `05-pagination-disabled.png` / `05-pagination-disabled@2x.png` |
| 6 | EmptyState (icon + title + description + action) | EmptyState (G9-2) | 1x / 2x | `06-empty-state.png` / `06-empty-state@2x.png` |

> 各 evidence は **1x (default) + 2x (devicePixelRatio: 2)** の 2 枚を取得し、合計 12 枚を `outputs/phase-11/screenshots/` 配下に配置する。

---

## 11-2. Playwright spec 構成

### 新規 / 編集 spec ファイル

`apps/web/tests/visual/parallel-09-primitives.spec.ts`（新規）

```ts
import { test, expect } from "@playwright/test";

const SHOTS = [
  { id: "01-formfield-error", route: "/visual-harness/formfield-error", selector: '[data-component="form-field"]' },
  { id: "02-icon-4sizes", route: "/visual-harness/icon-4sizes", selector: '[data-visual="icon-grid"]' },
  { id: "03-breadcrumb", route: "/visual-harness/breadcrumb", selector: 'nav[aria-label="breadcrumb"]' },
  { id: "04-focus-visible", route: "/visual-harness/focus-visible", selector: '[data-visual="focus-grid"]' },
  { id: "05-pagination-disabled", route: "/visual-harness/pagination-disabled", selector: '[data-component="pagination"]' },
  { id: "06-empty-state", route: "/visual-harness/empty-state", selector: ".ui-empty-state" },
] as const;

for (const shot of SHOTS) {
  test(`${shot.id} (1x)`, async ({ page }) => {
    await page.goto(shot.route);
    const el = await page.locator(shot.selector);
    await expect(el).toHaveScreenshot(`${shot.id}.png`, { maxDiffPixels: 0 });
  });

  test(`${shot.id} (2x)`, async ({ browser }) => {
    const ctx = await browser.newContext({ deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto(shot.route);
    const el = await page.locator(shot.selector);
    await expect(el).toHaveScreenshot(`${shot.id}@2x.png`, { maxDiffPixels: 0 });
    await ctx.close();
  });
}
```

### 撮影用 fixture ページ（dev/test 環境のみ）

| route | 内容 |
| --- | --- |
| `/visual-harness/formfield-error` | FormField を error 状態（aria-invalid=true + helper text）で配置 |
| `/visual-harness/icon-4sizes` | Icon を sm / md / lg / xl の 4 サイズ横並びで配置 |
| `/visual-harness/breadcrumb` | Breadcrumb を 3 階層（Home / Section / Current）で配置 |
| `/visual-harness/focus-visible` | button / a / input の各要素に強制 focus 適用 |
| `/visual-harness/pagination-disabled` | Pagination の prev disabled + next enabled 状態 |
| `/visual-harness/empty-state` | EmptyState に icon + title + description + action 全 props 指定 |

> fixture ページは `apps/web/app/visual-harness/[name]/page.tsx` 配下に配置し、production build では `process.env.NODE_ENV === "production"` で 404 化する。App Router の `_` prefix folder は private route になるため使わない。

---

## 11-3. 撮影手順

### Step 1: dev サーバ起動

```bash
mise exec -- pnpm --filter @ubm-hyogo/web dev &
# http://127.0.0.1:3000 で起動
```

### Step 2: Playwright 実行（baseline 確立）

```bash
# 初回 baseline 取得
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  apps/web/tests/visual/parallel-09-primitives.spec.ts \
  --update-snapshots
```

### Step 3: snapshot を outputs/phase-11/screenshots/ にコピー

```bash
mkdir -p docs/30-workflows/parallel-09-ux-cross-cutting/outputs/phase-11/screenshots
cp apps/web/tests/visual/__snapshots__/parallel-09-primitives.spec.ts/*.png \
  docs/30-workflows/parallel-09-ux-cross-cutting/outputs/phase-11/screenshots/

ls docs/30-workflows/parallel-09-ux-cross-cutting/outputs/phase-11/screenshots/
# 期待: 12 ファイル (6 種 × 2 scale)
```

### Step 4: regression 確認（再実行で diff 0）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  apps/web/tests/visual/parallel-09-primitives.spec.ts
# 期待: 12 test 全 PASS / diff 0
```

### Step 5: dev サーバ停止

```bash
pkill -f "next dev" || true
```

---

## 11-4. evidence ディレクトリ構成

```
outputs/phase-11/
├── screenshots/
│   ├── 01-formfield-error.png
│   ├── 01-formfield-error@2x.png
│   ├── 02-icon-4sizes.png
│   ├── 02-icon-4sizes@2x.png
│   ├── 03-breadcrumb.png
│   ├── 03-breadcrumb@2x.png
│   ├── 04-focus-visible.png
│   ├── 04-focus-visible@2x.png
│   ├── 05-pagination-disabled.png
│   ├── 05-pagination-disabled@2x.png
│   ├── 06-empty-state.png
│   └── 06-empty-state@2x.png
├── visual-evidence-summary.md
└── playwright-report.html
```

---

## 11-5. visual-evidence-summary.md 構成案

```markdown
# parallel-09 Visual Evidence Summary

- 撮影日時: 2026-05-15 JST
- Playwright バージョン: <pnpm exec playwright --version 出力>
- ブラウザ: Chromium (Playwright bundled)
- 環境: macOS / dev サーバ http://127.0.0.1:3000

## Snapshot 一覧

| # | id | 撮影対象 | 1x ファイル | 2x ファイル | サイズ判定 |
| --- | --- | --- | --- | --- | --- |
| 1 | 01-formfield-error | FormField error 表示 | 01-formfield-error.png | 01-formfield-error@2x.png | OK |
| 2 | 02-icon-4sizes | Icon sm/md/lg/xl 並列 | 02-icon-4sizes.png | 02-icon-4sizes@2x.png | OK |
| 3 | 03-breadcrumb | Breadcrumb 3 階層 | 03-breadcrumb.png | 03-breadcrumb@2x.png | OK |
| 4 | 04-focus-visible | focus-visible outline | 04-focus-visible.png | 04-focus-visible@2x.png | OK |
| 5 | 05-pagination-disabled | Pagination disabled | 05-pagination-disabled.png | 05-pagination-disabled@2x.png | OK |
| 6 | 06-empty-state | EmptyState フル props | 06-empty-state.png | 06-empty-state@2x.png | OK |

## OKLch token 使用確認

- 01: `--ubm-color-danger` (border + helper text 色)
- 04: `--ubm-color-accent` (focus outline 色)
- 06: `--ubm-color-text-secondary` (description 色)

## 設計判断

- regression 検出感度を最大化するため `maxDiffPixels: 0` を採用
- 1x + 2x の 2 scale 取得は Retina ディスプレイ環境での antialiasing 差異を回避するため
```

---

## 11-6. 検証コマンド

```bash
# evidence ファイル数
find docs/30-workflows/parallel-09-ux-cross-cutting/outputs/phase-11/screenshots -name "*.png" | wc -l
# 期待: 12

# Playwright report が存在
ls docs/30-workflows/parallel-09-ux-cross-cutting/outputs/phase-11/playwright-report.html

# evidence summary が存在
ls docs/30-workflows/parallel-09-ux-cross-cutting/outputs/phase-11/visual-evidence-summary.md

# fixture ページが production build から除外されている
grep -rn "visual-harness" apps/web/app | head
```

---

## 11-7. リスク・制約

| リスク | 対策 |
| --- | --- |
| fixture page が production にリリースされる | `apps/web/app/visual-harness/[name]/page.tsx` で `process.env.NODE_ENV === "production"` ガードを実装し、production では `notFound()` を返す |
| Retina 差異で snapshot diff | 1x / 2x の 2 枚取得 + `maxDiffPixels: 0`（厳密一致）で false positive を許容 |
| OKLch 色がブラウザ依存 | Playwright bundled Chromium に固定し、OS / ブラウザ間差異を排除 |
| dev サーバ起動失敗 | Step 1 で port 3000 が空いていることを `lsof -i:3000` で事前確認 |
| baseline 更新の運用混乱 | `--update-snapshots` 実行時は必ず evidence summary に「baseline 更新」と理由を記録 |

---

## 11-8. DoD

- [ ] 6 種 × 2 scale = 12 PNG ファイルが `outputs/phase-11/screenshots/` に存在
- [ ] `visual-evidence-summary.md` に撮影環境 / 各 snapshot の説明 / OKLch token 視覚確認が記録
- [ ] `playwright-report.html` が `outputs/phase-11/` に保存
- [ ] `apps/web/tests/visual/parallel-09-primitives.spec.ts` が新規追加され Step 4 で diff 0
- [ ] fixture ページに production ガードが実装されている
- [ ] `outputs/phase-11/visual-verification-skip.md` を **作らない**（VISUAL タスクのため）

---

## 統合テスト連携

| 連携先 | 連携内容 | 本 Phase での扱い |
| --- | --- | --- |
| Phase 9 | visual baseline 確立 | Step 2 `--update-snapshots` で baseline 化、Step 4 で regression 確認 |
| Phase 10 | リファクタ後の振る舞い不変確認 | Step 4 で diff 0 確認 |
| Phase 13 | PR 本文の Screenshots セクション | 12 PNG への相対 path リンクを PR 本文に転記 |
| parallel-03 | Visual snapshot 設計の整合 | parallel-03 visual spec と命名規約 / scale 規約が一致していることを確認 |

---

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | `docs/30-workflows/parallel-09-ux-cross-cutting/phase-09.md`「Step 6」 | visual baseline 確立判定 |
| 必須 | `docs/30-workflows/parallel-09-ux-cross-cutting/phase-10.md` | リファクタ後の振る舞い不変ベースライン |
| 必須 | `apps/web/src/styles/tokens.css` | OKLch token 視覚反映確認 |
| 必須 | `apps/web/playwright.config.ts` | Playwright プロジェクト設定 |
| 参考 | `docs/30-workflows/ui-prototype-alignment-mvp-recovery/improvements/parallel-09-ux-cross-cutting/spec.md`「7. テスト方針 - Playwright (visual)」 | 撮影対象の元定義 |

---

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| evidence | `outputs/phase-11/screenshots/*.png` (12 枚) | 6 種 × 2 scale visual snapshot |
| evidence | `outputs/phase-11/playwright-report.html` | Playwright test 実行 report |
| ドキュメント | `outputs/phase-11/visual-evidence-summary.md` | 撮影環境 + snapshot 説明 + OKLch token 視覚確認 |
| コード | `apps/web/tests/visual/parallel-09-primitives.spec.ts` | Playwright spec |
| コード | `apps/web/app/visual-harness/[name]/page.tsx` | 撮影用 fixture page（production ガード付） |
| メタ | `artifacts.json` | phase-11 を completed に更新 |

---

## 完了条件

- [ ] 12 PNG ファイルが配置済
- [ ] visual-evidence-summary.md / playwright-report.html / spec ファイル / 6 fixture page が揃っている
- [ ] Step 4 regression テストで diff 0
- [ ] fixture ページが production build に含まれない（grep で production ガード確認）

---

## タスク100%実行確認【必須】

- [ ] 全実行タスクが completed
- [ ] 全成果物が指定パスに配置済み
- [ ] 全完了条件にチェック
- [ ] artifacts.json の phase-11 を completed に更新

---

## 次 Phase 引き継ぎ事項

- 次: Phase 12（正本同期）
- 引き継ぎ事項:
  - 12 PNG への相対 path リンクを Phase 13 PR 本文「Screenshots」セクションに転記
  - `visual-evidence-summary.md` の OKLch token 視覚確認結果を Phase 12 system-spec-update-summary に転記
  - fixture page の production ガード実装パターンを Phase 12 implementation-guide に「YAGNI を超えて必要だった抽象」として記録
- ブロック条件: 12 PNG のいずれかが欠落 / fixture ページが production ガード未実装 / Step 4 regression FAIL のいずれかが発生した場合は実行しない
