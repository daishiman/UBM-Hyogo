---
spec_classification: implementation_spec
state: implemented_local_runtime_pending
phase: 5
phase_name: 実装
created_at: 2026-05-27
---

# Phase 5: 実装

[実装区分: 実装仕様書]

## 1. 変更ファイル一覧

| # | ファイル | 種別 | 概要 |
|---|---|---|---|
| 1 | `apps/web/playwright/tests/visual/admin-shell/dashboard.spec.ts` | 新規 | `/admin` baseline（旧 `admin-dashboard.spec.ts` 統合） |
| 2 | `apps/web/playwright/tests/visual/admin-shell/dashboard-attendance.spec.ts` | 新規 | `/admin/dashboard/attendance` baseline |
| 3 | `apps/web/playwright/tests/visual/admin-shell/members-list.spec.ts` | 新規 | `/admin/members` baseline |
| 4 | `apps/web/playwright/tests/visual/admin-shell/members-detail.spec.ts` | 新規 | env-gated baseline |
| 5 | `apps/web/playwright/tests/visual/admin-shell/tags.spec.ts` | 新規 | `/admin/tags` baseline |
| 6 | `apps/web/playwright/tests/visual/admin-shell/meetings-list.spec.ts` | 新規 | `/admin/meetings` baseline |
| 7 | `apps/web/playwright/tests/visual/admin-shell/meetings-detail.spec.ts` | 新規 | env-gated baseline |
| 8 | `apps/web/playwright/tests/visual/admin-shell/schema.spec.ts` | 新規 | `/admin/schema` baseline |
| 9 | `apps/web/playwright/tests/visual/admin-shell/schema-history.spec.ts` | 新規 | `/admin/schema/history` baseline |
| 10 | `apps/web/playwright/tests/visual/admin-shell/requests.spec.ts` | 新規 | `/admin/requests` baseline |
| 11 | `apps/web/playwright/tests/visual/admin-shell/identity-conflicts.spec.ts` | 新規 | `/admin/identity-conflicts` baseline |
| 12 | `apps/web/playwright/tests/visual/admin-shell/audit.spec.ts` | 新規 | `/admin/audit` baseline |
| 13 | `apps/web/playwright/tests/visual/admin-shell/_helpers.ts` | 新規 | 共通 helper |
| 14 | `apps/web/playwright.config.ts` | 更新 | `admin-staging-visual-*` 4 project 追加 |
| 15 | `apps/web/playwright/tests/visual/admin-dashboard.spec.ts` | 削除 | 1 番に統合 |
| 16 | `apps/web/playwright/tests/visual/admin-dashboard.spec.ts-snapshots/` | 削除 | 旧 baseline 破棄 |
| 17 | `.github/workflows/playwright-smoke.yml` | 更新 | `admin-visual` job 追加（4 viewport matrix） |

---

## 2. `_helpers.ts` シグネチャ

```ts
// apps/web/playwright/tests/visual/admin-shell/_helpers.ts
import type { Page } from '@playwright/test'

export async function waitAdminPageReady(page: Page, headingSelector: string): Promise<void> {
  await page.locator(headingSelector).waitFor({ state: 'visible' })
}

export async function freezeAnimations(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        caret-color: transparent !important;
      }
    `,
  })
}
```

副作用: なし（page に style 注入するのみ）。
入力: `page`（Playwright Page）、`headingSelector`（必須要素の CSS / role selector）。
出力: `void`。

---

## 3. spec シグネチャ（共通テンプレート）

```ts
// apps/web/playwright/tests/visual/admin-shell/dashboard.spec.ts
import { expect, test } from '@playwright/test'
import { freezeAnimations, waitAdminPageReady } from './_helpers'

test('admin dashboard staging visual baseline', async ({ page }) => {
  await page.goto('/admin', { waitUntil: 'networkidle' })
  await waitAdminPageReady(page, '[aria-labelledby="admin-dashboard-h"]')
  await freezeAnimations(page)
  await expect(page).toHaveScreenshot('admin-dashboard.png', {
    fullPage: true,
    maxDiffPixelRatio: 0.02,
  })
})
```

env-gated 版:
```ts
// admin-shell/members-detail.spec.ts
import { expect, test } from '@playwright/test'
import { freezeAnimations, waitAdminPageReady } from './_helpers'

const MEMBER_ID = process.env.PLAYWRIGHT_ADMIN_MEMBER_DETAIL_ID
const MEETING_ID = process.env.PLAYWRIGHT_ADMIN_MEETING_DETAIL_ID
const DETAIL_SEEDS_READY = Boolean(MEMBER_ID && MEETING_ID)
test.skip(!DETAIL_SEEDS_READY, 'Both PLAYWRIGHT_ADMIN_MEMBER_DETAIL_ID and PLAYWRIGHT_ADMIN_MEETING_DETAIL_ID are required')

test('admin members detail staging visual baseline', async ({ page }) => {
  await page.goto(`/admin/members/${MEMBER_ID}`, { waitUntil: 'networkidle' })
  await waitAdminPageReady(page, 'main h1')
  await freezeAnimations(page)
  await expect(page).toHaveScreenshot('admin-members-detail.png', {
    fullPage: true,
    maxDiffPixelRatio: 0.02,
  })
})
```

### test 名規約
`admin <route-slug> staging visual baseline`

### baseline 命名
Playwright 自動: `<screenshot>-<project>-linux.png`
例: `admin-dashboard-admin-staging-visual-mobile-linux.png`

### route → spec / heading selector マッピング

| route | spec | heading selector |
|---|---|---|
| `/admin` | `dashboard.spec.ts` | `[aria-labelledby="admin-dashboard-h"]` |
| `/admin/dashboard/attendance` | `dashboard-attendance.spec.ts` | `main h1` |
| `/admin/members` | `members-list.spec.ts` | `main h1` |
| `/admin/members/[id]` | `members-detail.spec.ts` | `main h1` |
| `/admin/tags` | `tags.spec.ts` | `main h1` |
| `/admin/meetings` | `meetings-list.spec.ts` | `main h1` |
| `/admin/meetings/[id]` | `meetings-detail.spec.ts` | `main h1` |
| `/admin/schema` | `schema.spec.ts` | `main h1` |
| `/admin/schema/history` | `schema-history.spec.ts` | `main h1` |
| `/admin/requests` | `requests.spec.ts` | `main h1` |
| `/admin/identity-conflicts` | `identity-conflicts.spec.ts` | `main h1` |
| `/admin/audit` | `audit.spec.ts` | `main h1` |

> 各 spec 実装時に Task A-D 後の page-head 実装を確認し、より specific な `aria-labelledby` を採用する。

---

## 4. `playwright.config.ts` 改修差分（抜粋）

```ts
// projects 配列に追加
{
  name: 'admin-staging-visual-mobile',
  testDir: './playwright/tests/visual/admin-shell',
  use: { ...devices['iPhone 12'], baseURL: stagingBaseURL, viewport: { width: 375, height: 812 }, storageState: './playwright/.auth/admin.storageState.json' },
  dependencies: ['setup-authenticated-staging'],
},
{
  name: 'admin-staging-visual-tablet',
  testDir: './playwright/tests/visual/admin-shell',
  use: { baseURL: stagingBaseURL, viewport: { width: 768, height: 1024 }, storageState: './playwright/.auth/admin.storageState.json' },
  dependencies: ['setup-authenticated-staging'],
},
{
  name: 'admin-staging-visual-desktop',
  testDir: './playwright/tests/visual/admin-shell',
  use: { baseURL: stagingBaseURL, viewport: { width: 1280, height: 800 }, storageState: './playwright/.auth/admin.storageState.json' },
  dependencies: ['setup-authenticated-staging'],
},
{
  name: 'admin-staging-visual-wide',
  testDir: './playwright/tests/visual/admin-shell',
  use: { baseURL: stagingBaseURL, viewport: { width: 1440, height: 900 }, storageState: './playwright/.auth/admin.storageState.json' },
  dependencies: ['setup-authenticated-staging'],
},
```

`isStagingVisual` は `admin-staging-visual` project 名も検知対象にする。`PLAYWRIGHT_SKIP_WEB_SERVER=1` と `PLAYWRIGHT_STAGING_BASE_URL` を CI で渡し、local webServer を起動しない。

admin-shell 実行時の reporter / test-results は Task E の evidence root に固定する。

```ts
const isAdminStagingVisual =
  process.argv.some((arg) => arg.includes('admin-staging-visual')) ||
  process.argv.some((arg) => arg.includes('visual/admin-shell'))

// default EVIDENCE_DIR branch:
'../../docs/30-workflows/completed-tasks/admin-visual-baseline-admin-routes-task-e/outputs/phase-11/evidence'
```

---

## 5. baseline 取得手順

1. **local dry-run（撮影分は commit しない）**:
   ```bash
   PLAYWRIGHT_SKIP_WEB_SERVER=1 pnpm --filter @ubm-hyogo/web exec playwright test tests/visual/admin-shell --project=admin-staging-visual-desktop --list
   ```
2. **staging deploy 確認**: Task A-D 実装が staging に反映済み・admin 12 routes が 200 を返すこと（env-gated 2 routes も seed ID で 200）。
3. **CI baseline 撮影**: `.github/workflows/playwright-visual-baseline-update.yml` に `scope=admin-shell` input と admin-shell 分岐を実装し、workflow_dispatch で `playwright test --update-snapshots --project=admin-staging-visual-*` を Linux runner で実行。
4. **bot push**: workflow が GITHUB_TOKEN で baseline `-linux.png` を branch に push。
5. **空コミット再トリガー（user-gated）**: bot push は `pull_request` 非発火 → ユーザー明示承認後にだけ
   ```bash
   git commit --allow-empty -m "chore(visual): retrigger after admin baseline"
   git push
   ```
   を開発者トークンで実行し、最終 HEAD で全 check を再評価する。

---

## 6. CI integration（`.github/workflows/playwright-smoke.yml`）

```yaml
admin-visual:
  name: admin visual (${{ matrix.viewport }})
  runs-on: ubuntu-latest
  strategy:
    fail-fast: false
    matrix:
      viewport: [mobile, tablet, desktop, wide]
  steps:
    - uses: actions/checkout@v4
    - uses: jdx/mise-action@v2
    - run: mise exec -- pnpm install --frozen-lockfile
    - run: mise exec -- pnpm --filter @ubm-hyogo/web exec playwright install --with-deps chromium
    - name: Detail seed preflight
      run: |
        if { [ -n "${PLAYWRIGHT_ADMIN_MEMBER_DETAIL_ID:-}" ] && [ -z "${PLAYWRIGHT_ADMIN_MEETING_DETAIL_ID:-}" ]; } || { [ -z "${PLAYWRIGHT_ADMIN_MEMBER_DETAIL_ID:-}" ] && [ -n "${PLAYWRIGHT_ADMIN_MEETING_DETAIL_ID:-}" ]; }; then
          echo "Both detail seeds are required together; 44 PNG baseline is forbidden." >&2
          exit 1
        fi
    - run: mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=admin-staging-visual-${{ matrix.viewport }}
      env:
        PLAYWRIGHT_STAGING_BASE_URL: ${{ inputs.staging_visual_base_url }}
        PLAYWRIGHT_SKIP_WEB_SERVER: '1'
        PLAYWRIGHT_EVIDENCE_DIR: ../../docs/30-workflows/completed-tasks/admin-visual-baseline-admin-routes-task-e/outputs/phase-11/evidence
        PLAYWRIGHT_ADMIN_MEMBER_DETAIL_ID: ${{ secrets.PLAYWRIGHT_ADMIN_MEMBER_DETAIL_ID }}
        PLAYWRIGHT_ADMIN_MEETING_DETAIL_ID: ${{ secrets.PLAYWRIGHT_ADMIN_MEETING_DETAIL_ID }}
    - if: failure()
      uses: actions/upload-artifact@v4
      with:
        name: admin-visual-${{ matrix.viewport }}-diff
        path: docs/30-workflows/completed-tasks/admin-visual-baseline-admin-routes-task-e/outputs/phase-11/evidence
```

---

## 7. 入力 / 出力 / 副作用

- **入力**: `PLAYWRIGHT_STAGING_BASE_URL`、既存 setup project が生成する admin storageState、env var（seed ID）。
- **出力**: `*-linux.png` baseline 40〜48 ファイル + Playwright diff レポート（fail 時）。
- **副作用**: mutation 系 API は呼ばない（read-only GET のみ）。CI runner のローカル fs に snapshot を作成し、ブランチに push（5 番手順で GITHUB_TOKEN）。

---

## 8. ローカル実行・検証コマンド

```bash
# Node 24 で実行
mise exec -- pnpm install

# spec 構造のみ list
PLAYWRIGHT_SKIP_WEB_SERVER=1 mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test tests/visual/admin-shell --list

# 構造確認（実撮影は commit しない）
PLAYWRIGHT_SKIP_WEB_SERVER=1 mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test tests/visual/admin-shell --project=admin-staging-visual-desktop --reporter=line

# typecheck / lint
mise exec -- pnpm typecheck
mise exec -- pnpm lint
```
