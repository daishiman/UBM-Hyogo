# Phase 2: 設計

> workflow: `issue-1126-bulk-tag-picker-viewport-baseline-expansion`
> 前提: Phase 1（要件定義）を満たすこと。採用設計は B案（per-test viewport 切替 + snapshot 名 viewport suffix）。

---

## 1. 設計方針（B案）

同一 spec 内で `page.setViewportSize()` を切り替え、各 viewport ごとに
viewport suffix 付きの snapshot 名で baseline を撮る。viewport 別の project 複製（A案）は採らない。

| 観点 | 設計 |
|------|------|
| 既存 desktop baseline | project default（1280×800）の無 suffix `bulk-tag-picker-{assign,unassign}-mode.png` を**温存**。capture 経路に手を入れない |
| 新規 baseline | 同一 spec 内で mobile / tablet / wide の 3 viewport をループし、各 2 状態を撮る（計 6 枚） |
| viewport 切替 | `page.setViewportSize({ width, height })` を各イテレーション先頭で呼ぶ |
| state 管理 | mode は picker の state として永続するため、viewport ごとに fresh page load で assign mode から始めて撮る |
| read-only | タグ apply を行わず `bulk-tag-result` count 0 を assert（既存と同一） |
| 既存資産再利用 | viewport 値は `viewports.ts` を正本にし、`wide` のみ additive 追加。`admin-members-prototype-redesign.spec.ts` の VIEWPORTS ループ + setViewportSize + filename suffix を同型として踏襲 |

### 状態所有権

| 要素 | 所有 |
|------|------|
| viewport 値（mobile/tablet/wide/desktop） | `apps/web/playwright/fixtures/viewports.ts`（単一正本） |
| mode（付与/解除）の現在値 | picker component（`BulkActionBar.tsx`）の内部 state。spec は button click + `aria-pressed` 確認でのみ操作 |
| baseline PNG | Playwright snapshot ディレクトリ（`{testDir}/{testFileName}-snapshots/...`） |
| 回帰検出トリガ | `staging-visual-authenticated` project の glob（config / CI 無改修） |

---

## 2. viewport 表

| 名称 | width × height | suffix | 採用根拠 |
|------|----------------|--------|----------|
| desktop（既存・温存） | 1280 × 800 | （無 suffix） | `staging-visual-authenticated` project の default viewport（`playwright.config.ts`）。既存 baseline と同値で AC③ の温存対象 |
| mobile | 390 × 844 | `-mobile` | `viewports.ts` の既存 `mobile`。iPhone 13 系の縦長 viewport（config の `mobile-webkit` / `visual-full-chromium-mobile` と整合） |
| tablet | 768 × 1024 | `-tablet` | `viewports.ts` の既存 `tablet`。iPad portrait 相当（`visual-full-chromium-tablet` と整合） |
| wide | 1920 × 1080 | `-wide` | **新規追加**。フル HD ワイドデスクトップ。desktop（1280）より広い列幅で picker グリッドが横に伸びるレイアウトを回帰検出する |

> desktop は B案でも引き続き project default viewport（=実装上 `page.setViewportSize()` を呼ばない無 suffix capture）として残す。
> mobile / tablet / wide のみ `setViewportSize()` で明示切替する。

---

## 3. snapshot 命名規約

### 既存（温存・変更しない）

```
bulk-tag-picker-assign-mode.png
bulk-tag-picker-unassign-mode.png
```

`SNAP.assign` / `SNAP.unassign` 定数として保持。viewport suffix を付けない（desktop = 無 suffix）。

### 新規（追加）

```
bulk-tag-picker-assign-mode-mobile.png
bulk-tag-picker-unassign-mode-mobile.png
bulk-tag-picker-assign-mode-tablet.png
bulk-tag-picker-unassign-mode-tablet.png
bulk-tag-picker-assign-mode-wide.png
bulk-tag-picker-unassign-mode-wide.png
```

命名形式: `bulk-tag-picker-{assign,unassign}-mode-{mobile,tablet,wide}.png`

### Playwright による自動 suffix 付与

`staging-visual-authenticated` project は `snapshotPathTemplate` を持つ:

```
{testDir}/{testFileName}-snapshots/{arg}-authenticated-staging-visual-{platform}{ext}
```

`{arg}` に上記 logical 名（例 `bulk-tag-picker-assign-mode-mobile`）が入り、
project / platform suffix（`-authenticated-staging-visual-chromium-linux`）が
Playwright により自動付与される。最終的なファイル名は次の形になる:

```
bulk-tag-picker-assign-mode-mobile-authenticated-staging-visual-chromium-linux.png
```

したがって spec 側で記述する snapshot 名は logical 名（viewport suffix まで）に留め、
project / platform suffix は記述しない（既存 desktop baseline と同一規約）。

---

## 4. spec 差分設計

対象: `apps/web/playwright/tests/visual-staging-authenticated/admin-members-bulk-tag-authenticated.spec.ts`

### 4.1 定数導入

```typescript
import { VIEWPORTS } from "../../fixtures/viewports";

// 既存 desktop（project default 1280×800・無 suffix）に加える responsive matrix。
// 値は viewports.ts を正本として再利用する（mobile / tablet は既存・wide は本タスクで追加）。
const RESPONSIVE_VIEWPORTS = [
  { name: "mobile", ...VIEWPORTS.mobile },
  { name: "tablet", ...VIEWPORTS.tablet },
  { name: "wide", ...VIEWPORTS.wide },
] as const;
```

### 4.2 共通ヘルパ（picker を撮れる状態にする）

既存 test 本体の DOM 操作（member 選択 → region 取得 → animations 無効化）を
viewport ループから再利用できるよう、helper に切り出す（実装意図の擬似コード）。

```typescript
type Page = import("@playwright/test").Page;
type Locator = import("@playwright/test").Locator;

async function prepareBulkRegion(page: Page): Promise<Locator> {
  await page.goto("/admin/members", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "会員管理" })).toBeVisible({
    timeout: 10_000,
  });

  const memberCheckboxes = page.locator('tbody input[type="checkbox"]');
  await expect(
    memberCheckboxes.nth(1),
    "at least two member rows are required",
  ).toBeVisible({ timeout: 10_000 });
  await memberCheckboxes.nth(0).check();
  await memberCheckboxes.nth(1).check();

  const bulkRegion = page.getByRole("region", { name: "一括操作" });
  await expect(bulkRegion).toBeVisible({ timeout: 10_000 });
  const tagPicker = bulkRegion.getByRole("region", {
    name: "タグ一括付与・解除",
  });
  await expect(tagPicker).toBeVisible();
  await expect(
    tagPicker.getByText("付与可能なタグがありません"),
    "staging tag master must expose at least one tag for a meaningful picker baseline",
  ).toHaveCount(0);

  await page.addStyleTag({ content: disableAnimations });
  return bulkRegion;
}

// mode を解除（unassign）へ切替える。
async function switchToUnassignMode(page: Page): Promise<void> {
  const bulkRegion = page.getByRole("region", { name: "一括操作" });
  const modeGroup = bulkRegion.getByRole("group", { name: "付与モード" });
  await modeGroup.getByRole("button", { name: "解除" }).click();
  await expect(
    modeGroup.getByRole("button", { name: "解除" }),
  ).toHaveAttribute("aria-pressed", "true");
}
```

### 4.3 既存 desktop test（温存）

既存 test（`SNAP.assign` / `SNAP.unassign`）はそのまま残す。capture 名・経路を変更しない。
（リファクタで helper を共有する場合も、snapshot 名は無 suffix を厳守する。）

```typescript
test("staging /admin/members bulk tag picker assign/unassign baselines", async ({
  page,
}) => {
  const bulkRegion = await prepareBulkRegion(page);

  // desktop = project default 1280×800・setViewportSize は呼ばない（無 suffix 温存）
  await expect(bulkRegion).toHaveScreenshot(SNAP.assign, {
    animations: "disabled",
    maxDiffPixelRatio: 0.05,
  });
  // 既存の Phase 11 evidence PNG copy も従来どおり維持する

  await switchToUnassignMode(page);
  await expect(bulkRegion).toHaveScreenshot(SNAP.unassign, {
    animations: "disabled",
    maxDiffPixelRatio: 0.05,
  });
  await expect(page.getByTestId("bulk-tag-result")).toHaveCount(0);
});
```

### 4.4 新規 viewport ループ test（追加）

```typescript
for (const vp of RESPONSIVE_VIEWPORTS) {
  test(`staging /admin/members bulk tag picker assign/unassign baselines (${vp.name})`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });

    const bulkRegion = await prepareBulkRegion(page);

    // prepareBulkRegion(page) は毎回 fresh page load から始まり、assign mode を開始点にする。
    await expect(bulkRegion).toHaveScreenshot(
      `bulk-tag-picker-assign-mode-${vp.name}.png`,
      { animations: "disabled", maxDiffPixelRatio: 0.05 },
    );

    await switchToUnassignMode(page);
    await expect(bulkRegion).toHaveScreenshot(
      `bulk-tag-picker-unassign-mode-${vp.name}.png`,
      { animations: "disabled", maxDiffPixelRatio: 0.05 },
    );

    // read-only 維持: タグ apply は一切行わない
    await expect(page.getByTestId("bulk-tag-result")).toHaveCount(0);
  });
}
```

> 設計判断: viewport ごとに **別 test** を立てる（1 test 内で viewport を切替えない）。
> 理由は (a) 失敗時にどの viewport が崩れたかが test 名で即判別できる、
> (b) Playwright の retry（project `retries: 2`）が viewport 単位で効く、
> (c) 各 test が独立に `prepareBulkRegion` から始まり mode state が前 viewport の残留を受けない。

---

## 5. fixture 差分設計

対象: `apps/web/playwright/fixtures/viewports.ts`

```typescript
export const VIEWPORTS = {
  desktop: { width: 1280, height: 800 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
  wide: { width: 1920, height: 1080 }, // ← additive 追加
} as const

export type ViewportName = keyof typeof VIEWPORTS
```

| 設計判断 | 内容 |
|----------|------|
| additive のみ | 既存 `desktop` / `tablet` / `mobile` の値・キーは変えない。`wide` を末尾に 1 行追加するだけ |
| 互換維持 | `ViewportName` は `keyof typeof VIEWPORTS` 由来のため、`wide` 追加で union が自動拡張される。既存 consumer（`playwright.config.ts` の `VIEWPORTS.desktop/tablet/mobile` 参照、`visual-full-*` project）は影響を受けない（AC-R4） |
| 正本集約 | spec 側で mobile/tablet/wide の生値を再定義せず、本 fixture を唯一の数値正本にする |

---

## 6. read-only 不変条件の維持方法

| 不変条件 | 維持方法 |
|----------|----------|
| タグを apply しない | viewport ループ test では mode 切替（付与/解除 button click）と screenshot のみを行い、apply 系 button を click しない |
| 結果 UI が出ていないこと | 各 test 末尾で `expect(page.getByTestId("bulk-tag-result")).toHaveCount(0)` を assert（既存と同一） |
| 共有 staging D1 への副作用ゼロ | mutation を発火させないため、tag apply / bulk result endpoint を呼ばない。member 選択（checkbox check）と mode toggle は client-side state のみで D1 write を伴わない |
| 認証 storageState の非残留 | 既存 `setup-authenticated-staging` → 消費 → teardown 経路を変えない。spec は `test.use({ storageState })` のみ |

---

## 7. CI 無改修の根拠

| 根拠 | 内容 |
|------|------|
| project が glob で spec を拾う | `staging-visual-authenticated` project は `testDir: ./playwright/tests/visual-staging-authenticated` + `testIgnore: [setup/teardown]` で、対象 spec を自動的に対象化する。test を spec 内に追加するだけで実行対象に入る |
| CI が project 単位で起動 | `playwright-staging-visual-authenticated.yml` は `playwright test --project=staging-visual-authenticated` を実行。spec 内の test 追加・baseline 追加に対し yml の編集は不要 |
| baseline は commit で参加 | 新 baseline PNG（`*-snapshots/...-authenticated-staging-visual-chromium-linux.png`）を commit すれば、CI の `toHaveScreenshot` 比較が自動で回帰検出に使う |
| paths トリガと整合 | yml の `pull_request.paths` に `apps/web/playwright/tests/visual-staging-authenticated/**` が含まれるため、対象 spec の編集は CI を自然に発火させる（fixture の `viewports.ts` 変更は spec 変更を伴うため同 PR で発火） |

> 結論: config（`playwright.config.ts`）・CI ワークフロー（yml）は**いずれも無改修**。
> spec 1 本 + fixture 1 本の編集と、生成された baseline 6 枚の commit のみで AC④ を満たす。
