---
spec_classification: implementation_spec
state: implemented_local_runtime_pending
phase: 2
phase_name: 設計
created_at: 2026-05-27
---

# Phase 2: 設計

[実装区分: 実装仕様書]

## 1. spec ディレクトリ配置

```
apps/web/playwright/tests/visual/admin-shell/
  ├── _helpers.ts                        (共通 helper: waitAdminPageReady / freezeAnimations)
  ├── dashboard.spec.ts                  (1) /admin
  ├── dashboard-attendance.spec.ts       (2) /admin/dashboard/attendance
  ├── members-list.spec.ts               (3) /admin/members
  ├── members-detail.spec.ts             (4) /admin/members/[id]   ← env-gated
  ├── tags.spec.ts                       (5) /admin/tags
  ├── meetings-list.spec.ts              (6) /admin/meetings
  ├── meetings-detail.spec.ts            (7) /admin/meetings/[id]  ← env-gated
  ├── schema.spec.ts                     (8) /admin/schema
  ├── schema-history.spec.ts             (9) /admin/schema/history
  ├── requests.spec.ts                   (10) /admin/requests
  ├── identity-conflicts.spec.ts         (11) /admin/identity-conflicts
  └── audit.spec.ts                      (12) /admin/audit
```

baseline は同階層の `<spec>.spec.ts-snapshots/` に Playwright 標準命名で配置される。

---

## 2. viewport matrix（project 単位）

| project name | viewport | 用途 |
|---|---|---|
| `admin-staging-visual-mobile`  | 375 × 812  | iPhone 12 想定 |
| `admin-staging-visual-tablet`  | 768 × 1024 | iPad portrait |
| `admin-staging-visual-desktop` | 1280 × 800 | 標準デスクトップ |
| `admin-staging-visual-wide`    | 1440 × 900 | wide |

合計撮影ポイント:
- CI 既定（env-gated skip）: 10 routes × 4 = **40 PNG**
- env-gated 2 routes 投入時: 12 routes × 4 = **48 PNG**
- 中間値 44 PNG は **禁止運用**（片方の seed のみで baseline 正本が不安定化するため）

---

## 3. test data flow

```
beforeEach:
  1. context = browser.newContext({ viewport, storageState }) ← project から注入
  2. storageState は既存 staging-visual-authenticated setup project で mint
  3. SSR は実 staging API 由来。page.route / mockApi による SSR fetch stub は使わない
test:
  4. page.goto(route, { waitUntil: 'networkidle' })
  5. waitAdminPageReady(page, <heading selector>) ← page-head の主要 heading が visible
  6. freezeAnimations(page)                       ← animation/transition/caret 抑止
  7. expect(page).toHaveScreenshot('<route-slug>.png', { fullPage: true, maxDiffPixelRatio: 0.02 })
```

---

## 4. env-gated routing

| spec | env var | 未設定時 | 設定時 |
|---|---|---|---|
| `members-detail.spec.ts` | `PLAYWRIGHT_ADMIN_MEMBER_DETAIL_ID` + `PLAYWRIGHT_ADMIN_MEETING_DETAIL_ID` | `DETAIL_SEEDS_READY=false` で `test.skip` | baseline 撮影 |
| `meetings-detail.spec.ts` | `PLAYWRIGHT_ADMIN_MEMBER_DETAIL_ID` + `PLAYWRIGHT_ADMIN_MEETING_DETAIL_ID` | `DETAIL_SEEDS_READY=false` で `test.skip` | baseline 撮影 |

`DETAIL_SEEDS_READY = Boolean(PLAYWRIGHT_ADMIN_MEMBER_DETAIL_ID && PLAYWRIGHT_ADMIN_MEETING_DETAIL_ID)` を両 detail spec の共通 gate とする。片方だけ seed がある場合は CI preflight で fail し、44 PNG baseline を生成しない。

---

## 5. waitForLoadState 戦略

- 既定: `waitUntil: 'networkidle'`
- skeleton 表示 route（dashboard, audit）: 主要 heading の `waitFor({ state: 'visible' })` 必須
- async data fetch route（schema/history, audit）: 表 body 1 行目 `tr:nth-child(1)` を `waitFor`

`_helpers.ts` で `waitAdminPageReady(page, selector)` として吸収する。

---

## 6. playwright.config.ts 改修方針

- 既存 `projects` 配列に以下 4 project を追加:
  ```ts
  { name: 'admin-staging-visual-mobile',  testDir: './playwright/tests/visual/admin-shell', use: { baseURL: stagingBaseURL, viewport: { width: 375, height: 812 }, storageState: './playwright/.auth/admin.storageState.json' }, dependencies: ['setup-authenticated-staging'] },
  { name: 'admin-staging-visual-tablet',  testDir: './playwright/tests/visual/admin-shell', use: { baseURL: stagingBaseURL, viewport: { width: 768, height: 1024 }, storageState: './playwright/.auth/admin.storageState.json' }, dependencies: ['setup-authenticated-staging'] },
  { name: 'admin-staging-visual-desktop', testDir: './playwright/tests/visual/admin-shell', use: { baseURL: stagingBaseURL, viewport: { width: 1280, height: 800 }, storageState: './playwright/.auth/admin.storageState.json' }, dependencies: ['setup-authenticated-staging'] },
  { name: 'admin-staging-visual-wide',    testDir: './playwright/tests/visual/admin-shell', use: { baseURL: stagingBaseURL, viewport: { width: 1440, height: 900 }, storageState: './playwright/.auth/admin.storageState.json' }, dependencies: ['setup-authenticated-staging'] },
  ```
- `isStagingVisual` 検出は `admin-staging-visual` を含め、`PLAYWRIGHT_SKIP_WEB_SERVER=1` + `PLAYWRIGHT_STAGING_BASE_URL` で local webServer を起動しない。
- 既存の global `testIgnore` で `tests/visual/admin-shell/**` が除外されていないことを確認、必要なら除外解除。
- 既存 `tests/visual/admin-dashboard.spec.ts` は重複回避のため `admin-shell/dashboard.spec.ts` に統合し、旧 spec + snapshot dir を削除する。
