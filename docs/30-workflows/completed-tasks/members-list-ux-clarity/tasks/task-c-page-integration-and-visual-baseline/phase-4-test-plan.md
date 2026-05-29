<!-- workflow: members-list-ux-clarity / task: C / phase: 4 -->

[実装区分: 実装仕様書]

# Phase 4 — テスト計画 (Task C)

> 前提: Phase 1-3

## 1. 検証戦略

| 種別 | 対象 | ツール |
| ---- | ---- | ------ |
| vitest (page integration) | `apps/web/app/(public)/members/page.spec.tsx` | vitest + @testing-library/react |
| Playwright (visual baseline) | `apps/web/playwright/tests/members-ux-clarity.spec.ts` | Playwright `toHaveScreenshot()` |
| Playwright (regression) | `apps/web/playwright/tests/members-prototype-alignment.spec.ts` | 既存 spec を rename 追従 |
| typecheck | 全 ws | `pnpm typecheck` |
| lint | 全 ws | `pnpm lint` |
| design tokens gate | apps/web | `pnpm verify-design-tokens` (CI) |

## 2. vitest — page.spec.tsx 更新点

### 2.1 追加 assertion

| AC | 検証内容 |
| -- | -------- |
| C-AC-1 | `MemberFilters` のレンダ結果に `data-role="result-count"` 要素が存在し、適切なテキストが含まれる |
| C-AC-2 | `[data-role="pagination-meta"]` 要素が存在し、`aria-hidden="true"` 属性を持つ |
| C-AC-3 | `MemberFilters` 呼び出しに `totalCount` / `displayedCount` props が渡る（mock 経由 or 出力 DOM 経由） |

### 2.2 検証手段の選択

| 方式 | 採否 |
| ---- | ---- |
| `MemberFilters` を `vi.mock` で差し替えて props を記録 | 採用候補 (props 直接検証) |
| 実 `MemberFilters` を render して `[data-role="result-count"]` のテキストを assertion | 採用 (Task B が既に動いている前提で integration 確認) |

採用: **render-based assertion**。`MemberFilters` 実装は Task B で完成しているため、page.spec.tsx は integration test として実物 component を render し、最終 DOM を検証する。

### 2.3 テスト追加リスト (page.spec.tsx)

```ts
describe("/members page integration with MemberFilters result count", () => {
  it("renders result-count live region with total and displayed count when ok", async () => {
    // listMembers mock: total=10, items.length=10
    const { findByRole } = renderPage();
    const output = await findByRole("status"); // <output aria-live="polite">
    expect(output).toHaveTextContent(/10 件中 10 件/);
  });

  it("renders result-count as '該当者なし' when zero items", async () => {
    // listMembers mock: total=0, items.length=0
    const { findByRole } = renderPage();
    const output = await findByRole("status");
    expect(output).toHaveTextContent(/該当者なし/);
  });

  it("keeps pagination-meta as aria-hidden machine-readable", async () => {
    const { container } = renderPage();
    const meta = container.querySelector('[data-role="pagination-meta"]');
    expect(meta).toBeTruthy();
    expect(meta).toHaveAttribute("aria-hidden", "true");
  });
});
```

## 3. Playwright — `members-ux-clarity.spec.ts`

### 3.1 spec 一覧 (24 test)

| viewport | density | state | snapshot 名 |
| -------- | ------- | ----- | ----------- |
| mobile (375) | comfy / dense / list | empty / filtered | `members-ux-clarity-mobile-{density}-{state}.png` × 6 |
| tablet (768) | comfy / dense / list | empty / filtered | `members-ux-clarity-tablet-{density}-{state}.png` × 6 |
| desktop (1024) | comfy / dense / list | empty / filtered | `members-ux-clarity-desktop-{density}-{state}.png` × 6 |
| wide (1440) | comfy / dense / list | empty / filtered | `members-ux-clarity-wide-{density}-{state}.png` × 6 |

### 3.2 共通設定

- project: `visual-chromium` (既存)
- `fullPage: true`
- `maxDiffPixelRatio: 0.01`
- mask: `[data-role="pagination-meta"]`, `time`
- 必要に応じて `[data-role="result-count"]` も mask（Phase 5 で seed 確認後に決定）
- `await page.waitForSelector('[data-page="members"]')` で hydration 待機

### 3.3 既存 spec の追従

`members-prototype-alignment.spec.ts` への変更（Task B rename 追従が必要な場合のみ）:

| 旧 | 新 |
| -- | -- |
| `[data-component="selected-tags-bar"]` | `[data-component="selected-filters-bar"]` |
| `SelectedTagsBar` import | `SelectedFiltersBar` import |

新規 expect の追加候補:
- `[data-role="result-count"]` が `<output>` 要素であること
- `aria-live="polite"` 属性確認

## 4. ローカル実行コマンド

```bash
# typecheck / lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# page.spec.tsx (vitest)
mise exec -- pnpm --filter @ubm-hyogo/web vitest run "app/(public)/members/page.spec.tsx"

# Playwright (smoke 1 viewport だけで動作確認)
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test members-ux-clarity --project=visual-chromium --grep "desktop comfy empty"

# Playwright 全 24 test (baseline 不在時は --update-snapshots を user-gated で)
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test members-ux-clarity --project=visual-chromium
```

## 5. CI gate

| gate | 期待結果 |
| ---- | -------- |
| `verify-design-tokens` | GREEN (tokens 不変) |
| `playwright-smoke` | GREEN (visual diff 0) |
| typecheck / lint | GREEN |

## 6. 受入確認順序

1. Task A/B 実装完了確認 (`git diff` で `MemberFilters` props 確認)
2. page.tsx 差分適用
3. page.spec.tsx 追加 → vitest GREEN
4. `members-ux-clarity.spec.ts` 作成 → local smoke 1 viewport
5. `members-prototype-alignment.spec.ts` 追従 (rename あれば)
6. typecheck / lint GREEN
7. Gate-C で Linux runner baseline 撮影 (user-gated)

## DoD

- [x] vitest 追加 assertion が AC ごとに列挙されている
- [x] Playwright 24 test の軸 (4×3×2) が表で示されている
- [x] mask 対象が明示されている
- [x] ローカル実行コマンドが揃っている
- [x] CI gate 期待結果が明示されている
