# 実装ガイド

> workflow: `issue-1126-bulk-tag-picker-viewport-baseline-expansion`
> workflow_state: `implemented_local_runtime_pending`（本ガイドは設計であり、実装済み）
> visual: `VISUAL_ON_EXECUTION` / issue: #1126（CLOSED 維持・`Refs #1126`）

---

## Part 1: 中学生にもわかる説明

### visual regression baseline ってなに？

ウェブサイトの画面を「写真」に撮って正解として保存しておき、後でコードを直したときに
もう一度同じ画面を撮って、その「正解写真」と見比べる仕組みです。

身近な例えでいうと、**まちがいさがし**です。
左に「お手本の絵（baseline = 正解写真）」、右に「いまの絵（直したあとの画面）」を並べて、
コンピュータが自動でちがう場所をさがします。ボタンがずれた、文字が重なった、
レイアウトが崩れた——そういう「見た目の事故」を、人間が目で見なくても機械が見つけてくれます。

この「お手本の絵」のことを **baseline（ベースライン）** と呼びます。

### viewport ってなに？

viewport（ビューポート）は、ざっくり言うと **画面の大きさ** のことです。

同じウェブサイトでも、スマホ（小さい縦長の画面）で見るのと、タブレット（中くらい）で見るのと、
大きなパソコンのモニター（横に広い画面）で見るのとでは、見え方がぜんぜんちがいます。
お店のショーウィンドウが、小さい窓・中くらいの窓・大きい窓で中の見え方が変わるのと同じです。

- **mobile（モバイル）**: スマホサイズ。たて長で、はば 390・たて 844。
- **tablet（タブレット）**: iPad くらい。はば 768・たて 1024。
- **wide（ワイド）**: 大きなモニター。はば 1920・たて 1080（フル HD）。

### なぜ mobile / tablet / wide を増やすの？

いま、このサイトの「タグ一括付与・解除 picker（タグをまとめて付けたり外したりする小窓）」の
お手本写真は、**パソコンサイズ（はば 1280）の 1 種類しか撮っていません**。

つまり、もしスマホで見たときにボタンが画面からはみ出したり、文字が折り返して崩れたりしても、
お手本写真が無いので **機械はそのこわれに気づけない** のです。
スマホで崩れているのに、だれも知らないまま——という事故が起きます。

そこで、mobile・tablet・wide の **3 種類のお手本写真を新しく撮って**、
どの画面サイズでも見た目がこわれていないかを機械が見張れるようにします。
これが今回の作業です。パソコンサイズの古いお手本写真はそのまま残します（消したり撮り直したりしません）。

> 今回は「お手本写真を増やす」だけで、ボタンの位置やデザインそのものは **いっさい変えません**。
> あくまで「見張りの目を増やす」作業です。

### 何が変わるか

画面そのものは変わりません。変わるのは、スマホ・タブレット・大きなモニターで壊れた見た目を検出できる範囲です。

### 今回作ったもの

- `viewports.ts` に wide 画面サイズを追加しました。
- bulk tag picker の visual test に mobile / tablet / wide の 3 viewport を追加しました。
- 各 viewport で assign / unassign の 2 状態、合計 6 枚の baseline 名を固定しました。

---

## Part 2: 技術者向け実装手順

### 変更対象ファイル一覧（2 件）

| # | 操作 | パス | 内容 |
|---|------|------|------|
| 1 | EDIT | `apps/web/playwright/fixtures/viewports.ts` | `wide: { width: 1920, height: 1080 }` を additive 追加 |
| 2 | EDIT | `apps/web/playwright/tests/visual-staging-authenticated/admin-members-bulk-tag-authenticated.spec.ts` | mobile/tablet/wide の viewport ループ test を追加。既存 desktop test は温存 |

> 新規 baseline PNG 6 枚は spec 実行時に Playwright が生成する成果物であり、本仕様書（implemented_local_runtime_pending）では生成しない。VISUAL_ON_EXECUTION として本実行サイクルで実装済み。

### 1. viewports.ts の wide 追加（before / after）

**before:**

```typescript
export const VIEWPORTS = {
  desktop: { width: 1280, height: 800 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
} as const

export type ViewportName = keyof typeof VIEWPORTS
```

**after:**

```typescript
export const VIEWPORTS = {
  desktop: { width: 1280, height: 800 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
  wide: { width: 1920, height: 1080 }, // ← additive 追加（本タスク）
} as const

export type ViewportName = keyof typeof VIEWPORTS
```

- additive のみ: 既存 `desktop` / `tablet` / `mobile` のキー・値は変えない。
- `ViewportName` は `keyof typeof VIEWPORTS` 由来のため `wide` 追加で union が自動拡張され、既存 consumer（`playwright.config.ts` の `visual-full-*` project）は影響を受けない（AC-R4）。

### 2. spec の viewport ループ（TypeScript 擬似実装）

#### 2-1. responsive matrix 定数（fixture を正本に再利用）

```typescript
import { VIEWPORTS } from "../../fixtures/viewports";

// 既存 desktop（project default 1280×800・無 suffix）に加える responsive matrix。
// 値は viewports.ts を正本として再利用（mobile / tablet は既存・wide は本タスクで追加）。
const RESPONSIVE_VIEWPORTS = [
  { name: "mobile", ...VIEWPORTS.mobile }, // 390 × 844
  { name: "tablet", ...VIEWPORTS.tablet }, // 768 × 1024
  { name: "wide", ...VIEWPORTS.wide },     // 1920 × 1080
] as const;
```

#### 2-2. 既存 desktop test（温存・capture 名と経路は変えない）

```typescript
async function captureAndAssertBulkRegion(bulkRegion: Locator, screenshotName: string) {
  mkdirSync(phase11ScreenshotsDir, { recursive: true });
  await bulkRegion.screenshot({
    path: join(phase11ScreenshotsDir, screenshotName),
    animations: "disabled",
  });
  await expect(bulkRegion).toHaveScreenshot(screenshotName, {
    animations: "disabled",
    maxDiffPixelRatio: 0.05,
  });
}

test("staging /admin/members bulk tag picker assign/unassign baselines", async ({ page }) => {
  const bulkRegion = await prepareBulkRegion(page);

  // desktop = project default 1280×800・setViewportSize は呼ばない（無 suffix 温存）
  await captureAndAssertBulkRegion(bulkRegion, SNAP.assign);

  await switchToUnassignMode(page);
  await captureAndAssertBulkRegion(bulkRegion, SNAP.unassign);

  await expect(page.getByTestId("bulk-tag-result")).toHaveCount(0);
});
```

`captureAndAssertBulkRegion()` は `toHaveScreenshot()` の前に `outputs/phase-11/screenshots/` へ同名 PNG を保存する。
これにより初回 baseline 生成や差分検出で visual assertion が停止しても、Phase 11 の実画面証跡が欠落しない。

#### 2-3. 新規 viewport ループ test（mobile / tablet / wide）

```typescript
for (const vp of RESPONSIVE_VIEWPORTS) {
  test(`staging /admin/members bulk tag picker assign/unassign baselines (${vp.name})`, async ({ page }) => {
    // (1) viewport を切替えてから picker を準備する
    await page.setViewportSize({ width: vp.width, height: vp.height });

    const bulkRegion = await prepareBulkRegion(page);

    // (2) prepareBulkRegion() starts from a fresh page load and assign-mode default.
    await captureAndAssertBulkRegion(bulkRegion, `bulk-tag-picker-assign-mode-${vp.name}.png`);

    // (3) 解除（unassign）モードへ切替えて撮る
    await switchToUnassignMode(page);
    await captureAndAssertBulkRegion(bulkRegion, `bulk-tag-picker-unassign-mode-${vp.name}.png`);

    // (4) read-only 維持: タグ apply は一切行わず、結果 UI が出ていないことを assert
    await expect(page.getByTestId("bulk-tag-result")).toHaveCount(0);
  });
}
```

> 設計判断: viewport ごとに **別 test** を立て、1 test 内で viewport を切替えない。
> (a) 失敗時にどの viewport が崩れたかが test 名で即判別できる、
> (b) project `retries` が viewport 単位で効く、
> (c) 各 test が `prepareBulkRegion` から独立に始まり、前 viewport の mode state 残留を受けない。

### 3. snapshot 命名

| 区分 | logical snapshot 名 | 備考 |
|------|---------------------|------|
| 既存 desktop（温存） | `bulk-tag-picker-assign-mode.png` / `bulk-tag-picker-unassign-mode.png` | 無 suffix。`SNAP.assign` / `SNAP.unassign` 定数で保持。**変更しない** |
| 新規（追加） | `bulk-tag-picker-{assign,unassign}-mode-{mobile,tablet,wide}.png` | `-{vp}` suffix で 6 枚に分離 |

`staging-visual-authenticated` project の `snapshotPathTemplate` が
`-authenticated-staging-visual-chromium-linux` を自動付与するため、spec 側は logical 名（viewport suffix まで）に留める。

### 4. 検証コマンド

| # | コマンド | 区分 |
|---|----------|------|
| 1 | `mise exec -- pnpm typecheck` | 通常検証 |
| 2 | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` | 通常検証 |
| 3 | `mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx`（focused） | 通常検証 |
| 4 | `mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=staging-visual-authenticated admin-members-bulk-tag-authenticated` | **user-gated**（staging capture） |
| 5 | 上記に `--update-snapshots` を付けて新規 6 baseline を生成 | **user-gated**（baseline 確定） |

> typecheck / lint / focused vitest / Phase 12 compliance は read-only なローカル検証として本実行サイクルで PASS 済み。playwright / `--update-snapshots` は staging アクセスと baseline 承認を伴うため user-gated。

### 5. DoD（Definition of Done）

| # | 完了条件 |
|---|----------|
| D-1 | `pnpm typecheck` PASS（`viewports.ts` の `wide` 追加 / spec のループ型が通る） |
| D-2 | `pnpm lint` PASS（spec / fixture 双方） |
| D-3 | 既存 desktop baseline 2 枚（無 suffix）が不変（再撮影・改名なし） |
| D-4 | 新規 baseline 6 枚（mobile/tablet/wide × assign/unassign）が `--update-snapshots` で取得済み |
| D-5 | read-only 維持: 各 test で `bulk-tag-result` count 0 / タグ apply なし / 共有 staging D1 への副作用ゼロ |
| D-6 | CI（`playwright-staging-visual-authenticated.yml`）無改修で新 baseline が回帰検出に参加 |
| D-7 | `viewports.ts` の既存 export 互換（`VIEWPORTS` / `ViewportName`）が additive で維持 |

> D-3〜D-6 はstaging visual captureフェーズ（user-gated）の達成条件。本仕様書（implemented_local_runtime_pending）段階ではローカル実装とローカル検証を満たす。

### TypeScript の型定義

```typescript
type BulkTagViewportName = "mobile" | "tablet" | "wide";

interface BulkTagResponsiveViewport {
  readonly name: BulkTagViewportName;
  readonly width: number;
  readonly height: number;
}
```

### APIシグネチャ

| 種別 | シグネチャ | 説明 |
| --- | --- | --- |
| fixture | `VIEWPORTS.wide: { width: 1920, height: 1080 }` | Playwright test fixture の additive viewport |
| helper | `prepareBulkRegion(page: Page): Promise<Locator>` | `/admin/members` を開き、member 2 件選択、BulkActionBar region を返す |
| helper | `captureAndAssertBulkRegion(bulkRegion: Locator, screenshotName: string): Promise<void>` | Phase 11 screenshot を保存してから Playwright snapshot と比較する |
| helper | `switchToUnassignMode(page: Page): Promise<void>` | 一括操作 region 内の「解除」ボタンを押し `aria-pressed=true` を確認 |

### CLIシグネチャ

| 種別 | シグネチャ | 説明 |
| --- | --- | --- |
| CLI | `pnpm --filter @ubm-hyogo/web typecheck` | web package の型検証 |
| CLI | `pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx` | focused component regression |
| CLI | `pnpm --filter @ubm-hyogo/web exec playwright test --project=staging-visual-authenticated admin-members-bulk-tag-authenticated --update-snapshots` | user-gated baseline generation |

### 使用例

```bash
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts apps/web/src/features/admin/components/__tests__/BulkActionBar.spec.tsx
```

Staging baseline generation is intentionally separated:

```bash
PLAYWRIGHT_EVIDENCE_DIR=../../docs/30-workflows/completed-tasks/issue-1126-bulk-tag-picker-viewport-baseline-expansion/outputs/phase-11/evidence \
  mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  --project=staging-visual-authenticated admin-members-bulk-tag-authenticated --update-snapshots
```

### エラーハンドリング

| ケース | 扱い |
| --- | --- |
| baseline PNG が未生成 | 初回 `--update-snapshots` が必要。通常比較で missing snapshot fail になるのは正常 |
| staging tag master が空 | spec は「付与可能なタグがありません」count 0 を要求し、意味のない baseline を失敗させる |
| staging auth mint env が未設定 | `setup-authenticated-staging` が storageState 作成前に失敗する。必要 env を設定してから再実行する |
| desktop baseline drift | desktop test は既存 snapshot 名を維持し、responsive tests は別 test 名と suffix で分離する |

### エッジケース

| ケース | 扱い |
| --- | --- |
| mobile viewport で region が縦に伸びる | element screenshot を使い、viewport clipped screenshot ではなく BulkActionBar region を対象にする |
| visual assertion が missing snapshot で停止する | `captureAndAssertBulkRegion()` が先に Phase 11 screenshot を保存するため、実画面証跡は残る |
| `PLAYWRIGHT_SCREENSHOT_DIR` が指定される | 明示された evidence 先を優先し、未指定時だけ本 workflow の Phase 11 screenshots に保存する |

### 設定項目と定数一覧

- Playwright project: `staging-visual-authenticated`
- storageState: `apps/web/playwright/.auth/admin.storageState.json`
- staging auth mint env: `STAGING_AUTH_SECRET`, `STAGING_ADMIN_MEMBER_ID`, `STAGING_ADMIN_EMAIL`, `STAGING_ME_MEMBER_ID`, `STAGING_ME_EMAIL`, `STAGING_WORKER_HOST`
- screenshot output override: `PLAYWRIGHT_SCREENSHOT_DIR`
- screenshot logical names: `bulk-tag-picker-{assign,unassign}-mode-{mobile,tablet,wide}.png`
- evidence output: `docs/30-workflows/completed-tasks/issue-1126-bulk-tag-picker-viewport-baseline-expansion/outputs/phase-11/`

### テスト構成

| Layer | Test |
| --- | --- |
| component regression | `BulkActionBar.spec.tsx` focused vitest |
| type contract | `@ubm-hyogo/web` typecheck |
| visual runtime | `staging-visual-authenticated` Playwright project（user-gated） |
