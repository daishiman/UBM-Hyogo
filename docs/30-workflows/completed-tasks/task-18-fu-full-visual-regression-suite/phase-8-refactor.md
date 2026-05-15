[実装区分: 実装仕様書]

# Phase 8: リファクタリング

## 目的

routes 配列・viewport 定数・spec ループ構造を再点検し、再利用性と DRY を確保する。Phase 5 で実装した構造から実質的な改善が必要な場合のみ差分を出す。

---

## 入力

- `outputs/phase-5/implementation-notes.md`
- `outputs/phase-6/test-additions.md`

---

## 1. リファクタ候補

| # | 候補 | 採否 | 理由 |
|---|------|------|------|
| 1 | `VIEWPORTS` を `playwright/fixtures/viewports.ts` に抽出 | **採用**（Phase 2 で既に設計済み） | 単一情報源化 |
| 2 | `VISUAL_ROUTES` を `playwright/fixtures/visual-routes.ts` に抽出 | **採用**（Phase 2 で既に設計済み） | spec 簡素化 |
| 3 | spec の auth helper 呼び分けを共通化 | **不採用** | `adminLogin(context)` / `memberLogin(context)` の2分岐だけなので現状の明示分岐を優先 |
| 4 | `expect.toHaveScreenshot` の共通 option を helper に集約 | **採用** | mask セレクタ重複排除 |
| 5 | 3 project entry を `for-loop` で生成 | **不採用** | playwright config の静的解析を優先 |

---

## 2. helper 抽出: visual-helpers.ts

`stabilizePage()` / screenshot option の抽出は将来候補に留める。今回の local implementation は1 spec内で十分短いため、追加 helper file は作成しない。

```ts
export async function stabilizePage(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => document.fonts?.ready)
  await page.addStyleTag({
    content: '*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important;}',
  })
}

export const SCREENSHOT_OPTIONS = {
  fullPage: true,
  animations: 'disabled' as const,
  caret: 'hide' as const,
  scale: 'css' as const,
}
```

spec 側は `stabilizePage(page)` と `SCREENSHOT_OPTIONS` を import して短縮:

```ts
await stabilizePage(page)
await expect(page).toHaveScreenshot(`${route.slug}-${viewport}.png`, {
  ...SCREENSHOT_OPTIONS,
  mask: [page.locator('[data-visual-mask]'), page.locator('time')],
})
```

---

## 3. リファクタ後ファイル構成

```
apps/web/playwright/
├── fixtures/
│   ├── viewports.ts          # Phase 2
│   ├── visual-routes.ts      # Phase 2
│   └── visual-helpers.ts     # Phase 8（NEW）
└── tests/
    └── visual-full/
        └── full-visual.spec.ts
```

---

## 4. DoD

1. helper 抽出後も `pnpm typecheck` / `pnpm lint` PASS
2. spec 行数が helper 抽出前と比較して短縮されている（目安: spec 50 行以下）
3. baseline 再生成が不要（screenshot 出力は同一）

---

## 5. 成果物

- `outputs/phase-8/refactor.md`
