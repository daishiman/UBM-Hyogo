<!-- workflow: members-list-ux-clarity / task: C / phase: 5 -->

[実装区分: 実装仕様書]

# Phase 5 — 実装手順 (Task C: page-integration-and-visual-baseline)

> 前提: Phase 1-4
> CONST_005 必須項目を完備

## 1. 変更対象ファイル一覧

### 1.1 新規

| パス | 内容 |
| ---- | ---- |
| `apps/web/playwright/tests/members-ux-clarity.spec.ts` | 4 viewport × 3 density × 2 state visual baseline (24 test) |

### 1.2 編集

| パス | 差分概要 |
| ---- | -------- |
| `apps/web/app/(public)/members/page.tsx` | `MemberFilters` 呼び出しに `totalCount` / `displayedCount` prop 追加。`<p data-role="pagination-meta">` に `aria-hidden="true"` 付与 |
| `apps/web/app/(public)/members/page.spec.tsx` | `getByRole("status")` 経由の件数表示 assertion 追加、`pagination-meta` の `aria-hidden` 検証追加 |
| `apps/web/playwright/tests/members-prototype-alignment.spec.ts` (条件付) | Task B で `SelectedTagsBar` → `SelectedFiltersBar` rename された場合のみ selector 追従 |

### 1.3 削除

なし。

## 2. 着手前の前提確認 (R-C-1 対策)

```bash
# Task A 完了確認
grep -n "sublabel\|HelpHint" apps/web/src/components/public/DensityToggle.client.tsx

# Task B 完了確認: MemberFilters props に totalCount / displayedCount が含まれるか
grep -n "totalCount\|displayedCount\|result-count" apps/web/src/components/public/MemberFilters.client.tsx

# SelectedFiltersBar rename 影響確認
git grep -n "SelectedTagsBar\|selected-tags-bar" apps/web/
```

Task A/B 未完了の場合は本 task 着手を中止し、依存タスクの完了を待つ。

## 3. page.tsx 差分方針

### 3.1 件数 prop 注入

```diff
       <MemberFilters
         initial={search}
         topTags={listResult.ok ? listResult.data.topTags : []}
+        totalCount={listResult.ok ? listResult.data.pagination.total : 0}
+        displayedCount={listResult.ok ? listResult.data.items.length : 0}
       />
```

### 3.2 pagination-meta 縮退

```diff
-      <p data-role="pagination-meta">
+      <p data-role="pagination-meta" aria-hidden="true">
         {listResult.ok
           ? `${listResult.data.pagination.total} 件中 ${listResult.data.items.length} 件表示`
           : "メンバー件数を読み込めませんでした"}
       </p>
```

### 3.3 件数 0 件時の挙動

| listResult | UI |
| ---------- | -- |
| `ok` かつ items 0 件 | `EmptyState` (既存) + `MemberFilters` の `<output>` が "該当者なし" を announce |
| `ok` かつ items ≥1 | `MemberGrid` + `<output>` が "X 件中 Y 件を表示しています" |
| `!ok` | `SectionError` + `<output>` は totalCount=0/displayedCount=0 で "該当者なし" 相当を表示 |

`MemberFilters` 側で `totalCount=0` の出力は Task B 仕様。本 task は prop 渡しのみ。

## 4. page.spec.tsx 期待値更新方針

### 4.1 既存 assertion 維持

- h1 "メンバー一覧"
- `data-page="members"`
- `data-role="lead"`
- `EmptyState` 出現 (0 件時)
- `SectionError` 出現 (fetch エラー時)

### 4.2 追加 assertion

```ts
// 件数 ok ケース
it("propagates totalCount and displayedCount to MemberFilters live region", async () => {
  // listMembers mock: pagination.total=10, items.length=10
  const { findByRole } = await renderPage(/* defaults */);
  expect(await findByRole("status")).toHaveTextContent(/10 件中 10 件/);
});

// pagination-meta aria-hidden
it("marks pagination-meta as aria-hidden machine-readable", async () => {
  const { container } = await renderPage();
  const meta = container.querySelector('[data-role="pagination-meta"]');
  expect(meta).toHaveAttribute("aria-hidden", "true");
});
```

### 4.3 mock 戦略

- 既存 page.spec.tsx の `listMembers` mock パターンを踏襲
- `MemberFilters` は実物を render し、`getByRole("status")` で `<output>` を取得
- Task B 側の component spec とは責務を分離: Task C は **page.tsx が prop を正しく渡しているか** のみ検証

## 5. Playwright spec 新規作成

### 5.1 ファイルパス・命名

| 項目 | 値 |
| ---- | -- |
| パス | `apps/web/playwright/tests/members-ux-clarity.spec.ts` |
| project 名 | `visual-chromium` (既存・新設不要) |
| snapshotPathTemplate | 既存 `visual-chromium` のデフォルト |
| snapshot 名 | `members-ux-clarity-{viewport}-{density}-{state}.png` |
| storageState | 不要 (public route) |

### 5.2 spec 雛形

```ts
import { expect, test } from "@playwright/test";

const VIEWPORTS = {
  mobile:  { width: 375,  height: 812 },
  tablet:  { width: 768,  height: 1024 },
  desktop: { width: 1024, height: 768 },
  wide:    { width: 1440, height: 900 },
} as const;

const DENSITIES = ["comfy", "dense", "list"] as const;

const STATES = [
  { id: "empty",    query: "q=__none__" },
  { id: "filtered", query: "q=&zone=0_to_1" },
] as const;

test.describe("members-ux-clarity visual baseline", () => {
  test.setTimeout(60_000);

  for (const [vpName, vp] of Object.entries(VIEWPORTS) as Array<
    [keyof typeof VIEWPORTS, (typeof VIEWPORTS)[keyof typeof VIEWPORTS]]
  >) {
    for (const density of DENSITIES) {
      for (const state of STATES) {
        test(`${vpName} ${density} ${state.id}`, async ({ page }) => {
          await page.setViewportSize(vp);
          const url = `/members?${state.query}&density=${density}`;
          await page.goto(url);
          await page.waitForSelector('[data-page="members"]');
          // 件数の hydration 完了を待つ
          await page.waitForSelector('[data-role="result-count"]', { state: "attached" });
          await expect(page).toHaveScreenshot(
            `members-ux-clarity-${vpName}-${density}-${state.id}.png`,
            {
              fullPage: true,
              mask: [
                page.locator('[data-role="pagination-meta"]'),
                page.locator("time"),
              ],
              maxDiffPixelRatio: 0.01,
            },
          );
        });
      }
    }
  }
});
```

### 5.3 storageState

不要（public route）。`visual-chromium` project はデフォルトで storageState 未設定。

## 6. ローカル実行コマンド

```bash
# 0. Task A/B 完了確認 (上記 § 2)

# 1. typecheck / lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint

# 2. vitest (page.spec.tsx)
mise exec -- pnpm --filter @ubm-hyogo/web vitest run "app/(public)/members/page.spec.tsx"

# 3. Playwright smoke (1 viewport)
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test members-ux-clarity \
  --project=visual-chromium \
  --grep "desktop comfy empty"

# 4. Playwright 全 24 test (baseline 存在前提)
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test members-ux-clarity \
  --project=visual-chromium

# 5. design tokens gate
mise exec -- pnpm verify-design-tokens
```

## 7. baseline 取得手順

| ステップ | 担当 | コマンド / 操作 |
| -------- | ---- | --------------- |
| 1 | 開発者 (本 task) | spec ファイル commit (baseline PNG なし) |
| 2 | 開発者 | ローカル smoke で spec ロジック確認 (`--grep "desktop comfy empty"` 等) |
| 3 | **user-gated (Gate-C)** | Linux runner で `playwright test members-ux-clarity --update-snapshots` を実行し、24 PNG を生成 |
| 4 | **user-gated** | 生成 PNG を commit / push（both-or-none preflight: spec と baseline を **同一 PR** 内で完結） |

> **D'+0 リセット運用**: ローカル macOS で生成した PNG は commit しない。CI Linux runner 生成分のみが baseline 正本。

> **both-or-none preflight**: `members-ux-clarity.spec.ts` の commit と baseline PNG の commit を同一 PR / 同一 push にまとめる。spec のみ commit / baseline 未撮影状態の中間状態を CI gate で検知させない。

## 8. 検証順序 (TDD-ish)

1. page.spec.tsx に追加 assertion → 赤化（page.tsx 未変更状態で）
2. page.tsx に `totalCount` / `displayedCount` prop と `aria-hidden="true"` 追加 → 緑化
3. `members-ux-clarity.spec.ts` 配置 → 1 viewport で smoke 実行（baseline 未生成のため初回は `--update-snapshots`）
4. typecheck / lint → GREEN
5. (条件付) `members-prototype-alignment.spec.ts` の selector 追従
6. 全 spec 緑化を確認

## 9. DoD

- [ ] page.tsx に `totalCount` / `displayedCount` prop が追加されている
- [ ] page.tsx の `<p data-role="pagination-meta">` に `aria-hidden="true"` が付与されている
- [ ] page.spec.tsx に `getByRole("status")` 経由の件数表示 assertion が追加されている
- [ ] page.spec.tsx に `pagination-meta` の `aria-hidden` 検証が追加されている
- [ ] `members-ux-clarity.spec.ts` が 4 viewport × 3 density × 2 state = 24 test で構成されている
- [ ] mask が `pagination-meta` / `time` に適用されている
- [ ] storageState 不要が明示されている
- [ ] ローカル実行コマンドがすべて記述されている
- [ ] baseline 取得が user-gated (Linux runner) で明示されている
- [ ] both-or-none preflight 方針が明示されている
- [ ] `pnpm typecheck` / `pnpm lint` / `verify-design-tokens` が GREEN
