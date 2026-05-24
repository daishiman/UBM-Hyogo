---
phase: 5
title: 実装ガイド — staging-visual project 配線 / 4 spec / deploy / baseline 配置
workflow_id: ut-dsf-07-staging-visual-runtime-evidence
status: spec_created
---

# Phase 5 — 実装ガイド

[実装区分: 実装仕様書]

## 1. ファイル絶対パス（新規 / 編集）

| パス（絶対） | 種別 |
|------------|------|
| `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260523-151703-wt-8/apps/web/playwright.config.ts` | 編集（`staging-visual` project 追加 + `isStagingVisual` 分岐） |
| `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260523-151703-wt-8/apps/web/playwright/tests/visual-staging/public-top.spec.ts` | 新規 |
| `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260523-151703-wt-8/apps/web/playwright/tests/visual-staging/login.spec.ts` | 新規 |
| `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260523-151703-wt-8/apps/web/playwright/tests/visual-staging/profile.spec.ts` | 新規 |
| `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260523-151703-wt-8/apps/web/playwright/tests/visual-staging/admin-dashboard.spec.ts` | 新規 |
| `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260523-151703-wt-8/apps/web/package.json` | 編集（`e2e:visual:staging` script 追加） |
| `apps/web/playwright/tests/visual-staging/*.spec.ts-snapshots/*-staging-visual-chromium-linux.png` | CI 上で生成・コミット（4 枚） |
| `docs/30-workflows/ut-dsf-07-staging-visual-runtime-evidence/outputs/phase-11/**` | evidence 配置 |
| `docs/30-workflows/ui-prototype-design-system-foundation/index.md` | 編集（`VISUAL_RUNTIME_PENDING` → `VISUAL_RUNTIME_OK`） |
| `docs/30-workflows/ui-prototype-design-system-foundation/artifacts.json` | 編集（同上 + Gate-B/C passed） |
| `.github/workflows/playwright-smoke.yml` | 任意編集（staging visual step / 既存拡張のみ） |

## 2. playwright.config.ts 差分

### 2.1 `isStagingVisual` フラグと server 分岐

```ts
// 既存 isStagingSmoke（L4 付近）の隣に追加
const isStagingVisual = process.argv.includes('--project=staging-visual')

// shouldStartLocalServer（L74 付近）に分岐を追加
const shouldStartLocalServer =
  !isStagingSmoke && !isStagingVisual && process.env.PLAYWRIGHT_SKIP_WEB_SERVER !== '1'
```

### 2.2 `staging-visual` project 追加

```ts
// projects[] 配列の末尾（既存 staging project L209-216 の隣）に追加
{
  name: 'staging-visual',
  testDir: './playwright/tests/visual-staging',
  testMatch: /visual-staging\/.*\.spec\.ts$/,
  retries: 2,
  use: {
    ...devices['Desktop Chrome'],
    viewport: { width: 1280, height: 800 },
    baseURL: process.env.PLAYWRIGHT_STAGING_BASE_URL ?? process.env.PLAYWRIGHT_BASE_URL,
  },
},
```

> `baseURL` の `?? PLAYWRIGHT_BASE_URL` フォールバックは既存 `staging` project と同一方針。

## 3. spec シグネチャ（4 spec）

既存 `apps/web/playwright/tests/visual/public-top.spec.ts` のパターンを踏襲するが、**`mockApi` fixture を import せず**、`@playwright/test` の素の `test` / `expect` を使う。

### 3.1 `visual-staging/public-top.spec.ts`

```ts
import { expect, test } from '@playwright/test'

test('staging public top baseline', async ({ page }) => {
  // client-side 動的 fetch の安定化（SSR は staging 実値）
  await page.route('**/api/**', (route) => route.continue())
  await page.goto('/')
  await page.locator('main h1').waitFor({ state: 'visible' })
  await page.addStyleTag({
    content: '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }',
  })
  await expect(page).toHaveScreenshot('public-top.png', { fullPage: true, maxDiffPixelRatio: 0.05 })
})
```

### 3.2 `visual-staging/login.spec.ts`

```ts
import { expect, test } from '@playwright/test'

test('staging login baseline', async ({ page }) => {
  await page.goto('/login')
  await page.locator('main h1').waitFor({ state: 'visible' })
  await page.addStyleTag({
    content: '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }',
  })
  await expect(page).toHaveScreenshot('login.png', { fullPage: true, maxDiffPixelRatio: 0.05 })
})
```

### 3.3 `visual-staging/profile.spec.ts`

```ts
import { expect, test } from '@playwright/test'

// 未認証時は middleware redirect / guard 画面を design system evidence とする（index.md §0.3 / phase-04 §3.3）
test('staging profile (unauthenticated guard) baseline', async ({ page }) => {
  await page.goto('/profile')
  await page.locator('main h1').waitFor({ state: 'visible' })
  await page.addStyleTag({
    content: '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }',
  })
  await expect(page).toHaveScreenshot('profile.png', { fullPage: true, maxDiffPixelRatio: 0.05 })
})
```

### 3.4 `visual-staging/admin-dashboard.spec.ts`

```ts
import { expect, test } from '@playwright/test'

// 未認証時の admin guard / redirect 描画を design system evidence とする
test('staging admin dashboard (unauthenticated guard) baseline', async ({ page }) => {
  await page.goto('/admin')
  await page.locator('main h1').waitFor({ state: 'visible' })
  await page.addStyleTag({
    content: '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }',
  })
  await expect(page).toHaveScreenshot('admin-dashboard.png', { fullPage: true, maxDiffPixelRatio: 0.05 })
})
```

## 4. package.json script 追加

`apps/web/package.json` の `scripts` に追加:

```json
{
  "scripts": {
    "e2e:visual:staging": "playwright test --project=staging-visual"
  }
}
```

実行例:

```bash
PLAYWRIGHT_STAGING_BASE_URL=https://ubm-hyogo-web-staging.daishimanju.workers.dev \
PLAYWRIGHT_SKIP_WEB_SERVER=1 \
mise exec -- pnpm --filter @ubm-hyogo/web e2e:visual:staging
```

## 5. staging deploy 手順（cf.sh のみ）

```bash
# 1. build 健全性を local で先に確認（next build --webpack / OpenNext 互換）
mise exec -- pnpm --filter @ubm-hyogo/web build 2>&1 | tee outputs/phase-11/build.log

# 2. staging deploy（op 経由で secrets 動的注入）
bash scripts/cf.sh deploy --config apps/web/wrangler.toml --env staging 2>&1 | tee outputs/phase-11/staging-deploy.log

# target URL: https://ubm-hyogo-web-staging.daishimanju.workers.dev
```

- deploy は `scripts/cf.sh` 経由のみ（`wrangler` 直接実行禁止 / CLAUDE.md）。
- API Token / OAuth トークン値を log / ドキュメントに転記しない（deploy.log に混入しないことを確認）。

## 6. baseline 配置パス

| spec | baseline path（リポジトリ相対） |
|------|------------------------------|
| public-top.spec.ts | `apps/web/playwright/tests/visual-staging/public-top.spec.ts-snapshots/public-top-staging-visual-chromium-linux.png` |
| login.spec.ts | `apps/web/playwright/tests/visual-staging/login.spec.ts-snapshots/login-staging-visual-chromium-linux.png` |
| profile.spec.ts | `apps/web/playwright/tests/visual-staging/profile.spec.ts-snapshots/profile-staging-visual-chromium-linux.png` |
| admin-dashboard.spec.ts | `apps/web/playwright/tests/visual-staging/admin-dashboard.spec.ts-snapshots/admin-dashboard-staging-visual-chromium-linux.png` |

## 7. parent root workflow gate 解除差分

### 7.1 `docs/30-workflows/ui-prototype-design-system-foundation/index.md`

```diff
- visualEvidence: VISUAL_RUNTIME_PENDING
+ visualEvidence: VISUAL_RUNTIME_OK
```

### 7.2 `docs/30-workflows/ui-prototype-design-system-foundation/artifacts.json`

```diff
- "visualEvidence": "VISUAL_RUNTIME_PENDING"
+ "visualEvidence": "VISUAL_RUNTIME_OK"
```

加えて gates[] の Gate-B / Gate-C を `passed` に更新し、`passed_at` を ISO 8601 / `evidence_path` を本 workflow の `outputs/phase-11/` に向ける。

## 8. CI workflow 差分（任意 / 既存拡張のみ）

`.github/workflows/playwright-smoke.yml` に手動 deploy 後の staging visual step を `workflow_dispatch` の `base_url` input で渡す形で追加可能（必須ではない）。新規 workflow ファイルは作成しない。

## 9. 実装手順（順序）

1. T-01: `playwright.config.ts` に `staging-visual` project + `isStagingVisual` 分岐を追加。
2. T-02: `visual-staging/` 配下に 4 spec を新規作成。
3. T-03: `package.json` に `e2e:visual:staging` を追加。
4. T-04: `cf.sh deploy --env staging` で最新 build を配備。
5. T-05: staging URL に対し `e2e:visual:staging --update-snapshots`（CI 正本）で baseline 生成。
6. T-06: baseline + log + metadata を `outputs/phase-11/` に配置。
7. T-07: parent `index.md` / `artifacts.json` の gate を解除。
8. T-09: `bash scripts/verify-pr-ready.sh` green を local 先回り確認。

## 10. 規約準拠

- すべて `*.spec.ts`（`verify-test-suffix` gate をパス / CLAUDE.md 不変条件 #8）。
- HEX / `bg-[#xxx]` / `text-[#xxx]` を spec / コメント / snapshot 名に含めない。
- `apps/web/src/` に変更を加えない（visual spec と config のみ / `getEnv()` 経路不変）。
- 既存 `visual/` spec / `visual-chromium` project を変更しない。
