---
spec_classification: implementation_spec
state: implemented_local_evidence_captured
phase: 2
phase_name: 設計
created_at: 2026-05-29
---

# Phase 2: 設計

[実装区分: 実装仕様書]

## 1. spec ディレクトリ配置

```
apps/web/playwright/tests/sidebar-shell/
  ├── _helpers.ts                    共通操作: openDrawer / toggleCollapse / waitShellReady / freezeAnimations
  ├── sidebar-shell-smoke.spec.ts    S1〜S6（6 smoke ケース）
  └── sidebar-shell-visual.spec.ts   V1〜V7（7 screenshot baseline）
```

baseline は `playwright.config.ts` の `snapshotPathTemplate` に従い
`sidebar-shell-visual.spec.ts-snapshots/<arg>-sidebar-shell-visual-<viewport>-{platform}.png` に配置される。

---

## 2. viewport matrix（project 単位）

| project name | viewport | 用途 |
|---|---|---|
| `sidebar-shell-visual-desktop` | 1280 × 800 | 標準デスクトップ |
| `sidebar-shell-visual-tablet`  | 768 × 1024 | iPad portrait（collapse toggle 検証幅にも使用） |
| `sidebar-shell-visual-mobile`  | 375 × 812  | iPhone 想定（drawer 検証） |

- visual baseline は role を spec 側で `anonymousPage`/`memberPage`/`adminPage` から選択し、viewport は project で注入する。
- 7 screenshot の内訳（V1〜V7）は viewport project × role の組合せで実現する（全 9 組合せのうち task-F が指定する 7 点のみ撮影）。

| viewport project | viewer | member | admin |
|---|---|---|---|
| desktop 1280 | V1 home-1280 | V2 profile-1280 | V3 admin-1280 |
| tablet 768   | V4 home-768  | —              | V5 admin-768 |
| mobile 375   | V6 home-375  | —              | V7 admin-375-drawer |

> member は desktop のみ（task-F 表に準拠）。tablet/mobile の member は撮影しない。

---

## 3. role → fixture / route マッピング

| role | auth fixture（`auth.ts` 拡張 `test`） | smoke / visual で開く route |
|---|---|---|
| viewer | `anonymousPage`（未ログイン） | `/`（visual）, `/`（smoke S1/S4/S6） |
| member | `memberPage`（`session.isAdmin === false`） | `/profile` |
| admin  | `adminPage`（`session.isAdmin === true`） | `/admin` |

`mockApi` は client-side GET の固定応答に使用し、mutation には触らない。public home / profile / admin dashboard の
表示に必要な GET は既存 `mockApi` seed（`buildMember` / `buildStats` / `defaultAttendanceSeed` 等）を流用する。

---

## 4. `_helpers.ts` 設計（共通操作）

```ts
// apps/web/playwright/tests/sidebar-shell/_helpers.ts
import type { Page } from '@playwright/test'

// shell の主要 landmark が visible になるまで待つ
export async function waitShellReady(page: Page): Promise<void>

// animation / transition / caret を抑止（visual 安定化）
export async function freezeAnimations(page: Page): Promise<void>

// mobile drawer を hamburger 押下で開く
export async function openDrawer(page: Page): Promise<void>

// collapse toggle を押して collapsed 状態にする
export async function toggleCollapse(page: Page): Promise<void>
```

selector は親 design spec のロール語彙に整合する `data-testid` を正本とする（Phase 5 で親実装後の実 attribute を確認して確定）:

| 操作対象 | 想定 selector（親 Task A-E が付与する想定） |
|---|---|
| shell root | `[data-testid="app-shell"]` |
| sidebar nav | `[data-testid="shell-sidebar"]` |
| hamburger | `[data-testid="shell-drawer-toggle"]` |
| drawer overlay | `[data-testid="shell-drawer"]` |
| collapse toggle | `[data-testid="shell-collapse-toggle"]` |
| user menu（左下） | `[data-testid="shell-user-menu"]` |

> 親 Task A-E が上記 `data-testid` を未付与の場合は、Phase 5 着手時に親 spec へ申し送り（同一 wave で attribute を追加）。

---

## 5. smoke 設計（S1〜S6）

| # | fixture | 操作 | アサーション |
|---|---|---|---|
| S1 | `anonymousPage` | `goto('/')` → `waitShellReady` | `shell-sidebar` 内に PUBLIC group のみ / 「ログイン」リンク visible / MEMBERS・ADMIN group 不在 |
| S2 | `memberPage` | `goto('/profile')` → user menu 展開 | sidebar に PUBLIC + MEMBERS / user popover に 3 action（プロフィール / 編集申請 / ログアウト） |
| S3 | `adminPage` | `goto('/admin')` → user menu 展開 | nav item total 13（PUBLIC3 + MEMBERS1 + ADMIN9）/ popover に 4 action（「管理者ダッシュボード」含む） |
| S4 | `anonymousPage`（375幅 context） | `goto('/')` | `shell-sidebar` が非表示（drawer 化）/ `openDrawer()` で `shell-drawer` overlay visible |
| S5 | `anonymousPage` or `memberPage`（1024幅） | `toggleCollapse()` | sidebar が collapsed（アイコンのみ）/ `localStorage` に collapse 状態が反映 |
| S6 | `anonymousPage`（375幅） | `openDrawer()` → drawer 内リンク click | drawer が auto-close（`shell-drawer` 非表示） |

- S4/S6 は mobile 幅 context（375×812）、S5 は 1024 幅 context を spec 内で `page.setViewportSize` または専用 context で生成する。
- nav item / action 数は親 design spec（13 item / role 別 action 数）と 1:1 整合させる。

---

## 6. visual 設計（V1〜V7）

```ts
// sidebar-shell-visual.spec.ts（構造イメージ）
test('viewer home desktop visual', async ({ anonymousPage }) => {
  await anonymousPage.goto('/')
  await waitShellReady(anonymousPage)
  await freezeAnimations(anonymousPage)
  await expect(anonymousPage).toHaveScreenshot('home-1280.png', { fullPage: true, maxDiffPixelRatio: 0.02 })
})
```

- viewport は project で注入されるため spec 側は viewport-agnostic。各 test は project 名で撮影対象 viewport を限定する（`test.skip(project !== 'sidebar-shell-visual-desktop', ...)` で role×viewport の 7 点だけ有効化）。
- V7（`admin-375-drawer.png`）のみ `openDrawer(adminPage)` を撮影前に実行する。
- `maxDiffPixelRatio: 0.02` / `fullPage: true` を全 screenshot 共通とする。

---

## 7. `playwright.config.ts` 改修方針

`projects` 配列に以下 3 project を追加（Task E の `admin-staging-visual-*` パターンに準拠）:

```ts
{
  name: 'sidebar-shell-visual-desktop',
  testDir: './playwright/tests/sidebar-shell',
  testMatch: /sidebar-shell-visual\.spec\.ts$/,
  use: { viewport: { width: 1280, height: 800 } },
  snapshotPathTemplate:
    '{testDir}/{testFileName}-snapshots/{arg}-sidebar-shell-visual-desktop-{platform}{ext}',
},
{
  name: 'sidebar-shell-visual-tablet',
  testDir: './playwright/tests/sidebar-shell',
  testMatch: /sidebar-shell-visual\.spec\.ts$/,
  use: { viewport: { width: 768, height: 1024 } },
  snapshotPathTemplate:
    '{testDir}/{testFileName}-snapshots/{arg}-sidebar-shell-visual-tablet-{platform}{ext}',
},
{
  name: 'sidebar-shell-visual-mobile',
  testDir: './playwright/tests/sidebar-shell',
  testMatch: /sidebar-shell-visual\.spec\.ts$/,
  use: { viewport: { width: 375, height: 812 } },
  snapshotPathTemplate:
    '{testDir}/{testFileName}-snapshots/{arg}-sidebar-shell-visual-mobile-{platform}{ext}',
},
```

smoke spec は既存 `smoke-chromium`（`testMatch: /full-smoke\.spec\.ts$/`）と別に動かす必要があるため、
`sidebar-shell-smoke` project（`testMatch: /sidebar-shell\/sidebar-shell-smoke\.spec\.ts$/`、chromium、local webServer 使用）を追加するか、
既存 `desktop-chromium` の testIgnore から本 spec を除外しないことで取り込む。Phase 3 R2 で方式を確定する。

既存 `desktop-chromium` / `visual-chromium` の `testIgnore` に
`/sidebar-shell\/sidebar-shell-visual\.spec\.ts$/` を追加し、visual spec が local default project で誤って走らないようにする
（visual は専用 3 project でのみ実行）。

---

## 8. CI 設計（`.github/workflows/playwright-smoke.yml`）

- (a) 既存 `smoke (chromium)` 系 job の対象に `sidebar-shell-smoke` を追加（matrix or testMatch 拡張）。
- (b) 新 matrix job `visual (sidebar-shell)`:

```yaml
sidebar-shell-visual:
  name: visual (sidebar-shell ${{ matrix.viewport }})
  runs-on: ubuntu-latest
  strategy:
    fail-fast: false
    matrix:
      viewport: [desktop, tablet, mobile]
  steps:
    - uses: actions/checkout@v4
    - uses: jdx/mise-action@v2
    - run: mise exec -- pnpm install --frozen-lockfile
    - run: mise exec -- pnpm --filter @ubm-hyogo/web exec playwright install --with-deps chromium
    - run: mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=sidebar-shell-visual-${{ matrix.viewport }}
    - if: failure()
      uses: actions/upload-artifact@v4
      with:
        name: sidebar-shell-visual-${{ matrix.viewport }}-diff
        path: apps/web/playwright/evidence
```

> 実 job 名・step は既存 `playwright-smoke.yml` の構造に合わせて Phase 5 で確定する。
