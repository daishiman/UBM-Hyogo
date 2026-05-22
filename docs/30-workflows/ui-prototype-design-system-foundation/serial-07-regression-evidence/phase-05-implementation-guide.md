---
phase: 5
title: 実装ガイド — spec 4 本の具体差分と baseline 配置
workflow_id: ui-prototype-design-system-foundation
sub_workflow: serial-07-regression-evidence
status: spec_created
---

# Phase 5 — 実装ガイド

[実装区分: 実装仕様書]

## 1. ファイル絶対パス（新規 / 編集）

| パス（絶対） | 種別 |
|------------|------|
| `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260518-101514-wt-4/apps/web/playwright/tests/visual/top.spec.ts` | 新規 |
| `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260518-101514-wt-4/apps/web/playwright/tests/visual/members-list.spec.ts` | 新規 |
| `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260518-101514-wt-4/apps/web/playwright/tests/visual/member-detail.spec.ts` | 新規 |
| `/Users/dm/dev/dev/個人開発/UBM-Hyogo/.worktrees/task-20260518-101514-wt-4/apps/web/playwright/tests/visual/admin-dashboard.spec.ts` | 既存利用（変更ある場合のみ最小編集） |
| `apps/web/playwright/tests/visual/top.spec.ts-snapshots/top-chromium-linux.png` | CI 上で生成・コミット |
| `apps/web/playwright/tests/visual/members-list.spec.ts-snapshots/members-list-chromium-linux.png` | 同上 |
| `apps/web/playwright/tests/visual/member-detail.spec.ts-snapshots/member-detail-chromium-linux.png` | 同上 |
| `apps/web/playwright/tests/visual/admin-dashboard.spec.ts-snapshots/admin-dashboard-chromium-linux.png` | 既存 / 差分が発生する場合のみ更新 |

## 2. test シグネチャ（4 spec）

すべて既存 `apps/web/playwright/tests/visual/public-top.spec.ts` のパターンを踏襲する。

### 2.1 `top.spec.ts`

```ts
import { expect, test } from '../../fixtures/auth'

test('top baseline', async ({ page, mockApi }) => {
  void mockApi
  await page.goto('/')
  await page.locator('main h1').waitFor({ state: 'visible' })
  await page.addStyleTag({
    content: '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }',
  })
  await expect(page).toHaveScreenshot('top.png', { fullPage: true, maxDiffPixelRatio: 0.02 })
})
```

### 2.2 `members-list.spec.ts`

```ts
import { expect, test } from '../../fixtures/auth'

test('members list baseline', async ({ page, mockApi }) => {
  void mockApi
  await page.goto('/members')
  await page.locator('main h1').waitFor({ state: 'visible' })
  // serial-05 で data-component="member-card" 付与済前提
  await page.locator('[data-component="member-card"]').first().waitFor({ state: 'visible' })
  await page.addStyleTag({
    content: '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }',
  })
  await expect(page).toHaveScreenshot('members-list.png', { fullPage: true, maxDiffPixelRatio: 0.02 })
})
```

### 2.3 `member-detail.spec.ts`

```ts
import { expect, test } from '../../fixtures/auth'
import { buildMember } from '../../../src/test-utils/fixtures/public'

test('member detail baseline', async ({ page, mockApi }) => {
  void mockApi
  const member = buildMember()
  await page.goto(`/members/${member.id}`)
  await page.locator('[data-component="member-detail"]').waitFor({ state: 'visible' })
  await page.addStyleTag({
    content: '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }',
  })
  await expect(page).toHaveScreenshot('member-detail.png', { fullPage: true, maxDiffPixelRatio: 0.02 })
})
```

### 2.4 `admin-dashboard.spec.ts`（既存・参考再掲）

```ts
import { adminLogin, expect, test } from '../../fixtures/auth'

test('admin dashboard baseline', async ({ page, context, mockApi }) => {
  void mockApi
  await adminLogin(context)
  await page.goto('/admin')
  await page.locator('[aria-labelledby="admin-dashboard-h"]').waitFor({ state: 'visible' })
  await page.addStyleTag({
    content: '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }',
  })
  await expect(page).toHaveScreenshot('admin-dashboard.png', { fullPage: true, maxDiffPixelRatio: 0.02 })
})
```

## 3. mock API seed 方針

- 各 spec は `mockApi` fixture を `void mockApi` で初期化するだけで、`apps/web/playwright/fixtures/auth.ts` 内の MOCK_API_PORT=8787 サーバが起動し、既定 endpoint を返す
- `INTERNAL_API_BASE_URL` / `NEXT_PUBLIC_API_BASE_URL` / `PUBLIC_API_BASE_URL` はすべて `http://127.0.0.1:8787` に差し替え済（playwright.config.ts L78-L82）
- 追加 seed が必要な spec はない。member-detail で response_fields が欠落する場合は serial-06 側で fix する（本 SW では fixture を増やさない）

## 4. baseline 配置パス

| spec | baseline path（リポジトリ相対） |
|------|------------------------------|
| top.spec.ts | `apps/web/playwright/tests/visual/top.spec.ts-snapshots/top-chromium-linux.png` |
| members-list.spec.ts | `apps/web/playwright/tests/visual/members-list.spec.ts-snapshots/members-list-chromium-linux.png` |
| member-detail.spec.ts | `apps/web/playwright/tests/visual/member-detail.spec.ts-snapshots/member-detail-chromium-linux.png` |
| admin-dashboard.spec.ts | `apps/web/playwright/tests/visual/admin-dashboard.spec.ts-snapshots/admin-dashboard-chromium-linux.png` |

## 5. CI workflow 差分

### 5.1 `.github/workflows/playwright-smoke.yml`（path 追加が必要な場合のみ）

既存 trigger に `apps/web/playwright/tests/visual/**` が含まれているか確認。含まれていない場合のみ以下を追加:

```yaml
on:
  pull_request:
    paths:
      - 'apps/web/playwright/tests/visual/**'
```

### 5.2 `.github/workflows/verify-design-tokens.yml`

変更不要（既存 path で `apps/web/src/styles/{tokens,globals}.css` をカバー済）。

### 5.3 新規 workflow ファイル

**作成しない**。既存 6 workflow を再利用する。

## 6. 実装手順

1. T-02..T-05: 4 spec を新規作成（既存 spec を別名コピーして調整）
2. ローカルで `pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/visual --update-snapshots` を実行し、生成 baseline を確認（**ローカル baseline はコミットしない**）
3. PR を push し、CI 上で baseline を生成 → CI artifact から `-chromium-linux.png` を取得しコミット
4. 再度 push して CI green を確認
5. evidence を `outputs/phase-11/` に配置（Phase 11 表に従う）

## 7. 規約準拠

- すべて `*.spec.ts`（test suffix CI gate `verify-test-suffix` をパス）
- HEX / `bg-[#xxx]` / `text-[#xxx]` を spec / コメント / snapshot 名に含めない
- 既存 fixture の API を変更しない
