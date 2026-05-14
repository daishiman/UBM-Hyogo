[実装区分: 実装仕様書]

# Phase 7: Visual regression baseline 実装仕様

## 1. ヘッダー

| 項目 | 値 |
|------|----|
| Phase | 7 / 13 |
| 目的 | `/login` / `/` / `/admin` / `/profile` の 4 画面の visual baseline screenshot を採取し、`maxDiffPixelRatio: 0.02` で軽量 visual regression を成立させる |
| 前提 Phase | Phase 6（smoke + auth fixture 完了） |
| 想定工数 | 0.15 人日 |

## 2. ゴール / 非ゴール

### 2.1 ゴール

1. 4 本の visual spec を `apps/web/tests/e2e/visual/` 配下に新設。
2. baseline PNG 4 枚を ubuntu-latest / Desktop Chrome / viewport 1280x800 で採取し、`__screenshots__/` 配下に commit する。
3. animation / transition / caret を停止して flaky を抑制。
4. `maxDiffPixelRatio: 0.02` を spec / config の両方で明示。

### 2.2 非ゴール

- 全 19 routes × 3 viewport の visual matrix（MVP 後）
- mobile viewport の baseline
- font subpixel diff の許容ロジック拡張

## 3. 変更対象ファイル一覧

| パス | 種別 | 説明 |
|------|------|------|
| `apps/web/tests/e2e/visual/login.spec.ts` | new | `/login` baseline |
| `apps/web/tests/e2e/visual/public-top.spec.ts` | new | `/` baseline |
| `apps/web/tests/e2e/visual/admin-dashboard.spec.ts` | new | `/admin` baseline（adminLogin 経由） |
| `apps/web/tests/e2e/visual/profile.spec.ts` | new | `/profile` baseline（memberLogin 経由） |
| `apps/web/tests/e2e/visual/__screenshots__/login.spec.ts/login.png` | new (gen) | baseline |
| `apps/web/tests/e2e/visual/__screenshots__/public-top.spec.ts/public-top.png` | new (gen) | baseline |
| `apps/web/tests/e2e/visual/__screenshots__/admin-dashboard.spec.ts/admin-dashboard.png` | new (gen) | baseline |
| `apps/web/tests/e2e/visual/__screenshots__/profile.spec.ts/profile.png` | new (gen) | baseline |

## 4. 関数・型シグネチャ

### 4.1 共通 spec 骨格（`login.spec.ts`）

```ts
// apps/web/tests/e2e/visual/login.spec.ts
import { test, expect } from '@playwright/test'

test('login baseline', async ({ page }) => {
  await page.goto('/login')
  await page.locator('form[data-testid="login-form"]').waitFor({ state: 'visible' })
  await page.addStyleTag({
    content: `*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }`,
  })
  await expect(page).toHaveScreenshot('login.png', { fullPage: true, maxDiffPixelRatio: 0.02 })
})
```

### 4.2 `public-top.spec.ts`

`/login` と同型で、`page.goto('/')` / landmark `[data-testid="public-hero"]` または `main h1` の visible 待機 / `toHaveScreenshot('public-top.png', { fullPage: true, maxDiffPixelRatio: 0.02 })`。

### 4.3 `admin-dashboard.spec.ts`

```ts
import { test, expect } from '@playwright/test'
import { adminLogin } from '../fixtures/auth'

test.beforeEach(async ({ context }) => {
  await adminLogin(context)
})

test('admin dashboard baseline', async ({ page }) => {
  await page.goto('/admin')
  await page.locator('[data-testid="admin-dashboard"]').waitFor({ state: 'visible' })
  await page.addStyleTag({
    content: `*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }`,
  })
  await expect(page).toHaveScreenshot('admin-dashboard.png', { fullPage: true, maxDiffPixelRatio: 0.02 })
})
```

### 4.4 `profile.spec.ts`

`admin-dashboard.spec.ts` と同型。`memberLogin(context)` を `beforeEach` で呼び、`/profile` 訪問 → `main h1` visible → `toHaveScreenshot('profile.png', ...)`。

### 4.5 採取環境固定

- runner: `ubuntu-latest`（CI と同一 OS）
- project: `visual-chromium`（Phase 8 で `apps/web/playwright.config.ts` に追加）
- viewport: `{ width: 1280, height: 800 }`
- expect 既定: `toHaveScreenshot: { maxDiffPixelRatio: 0.02 }`（config 側で設定済み・spec 側でも明示）

## 5. テスト方針（Phase 7 内で動くテスト）

| ID | 仕掛け | 期待 |
|----|--------|------|
| V1 | 初回 `e2e:visual:update` | 4 png が `__screenshots__/` に作成、commit に含まれる |
| V2 | typo 修正レベルの微小差分 | PASS（`maxDiffPixelRatio: 0.02`） |
| V3 | `/admin` のレイアウト改変 | FAIL し diff artifact が `apps/web/test-results` に出力 |

baseline 採取は CI 上で行うのが原則（OS 由来の font hinting 差異を避けるため）。初回採取手順:

1. `playwright-smoke.yml` の `visual` job を `--update-snapshots` 付きで `workflow_dispatch` 実行する一時 commit を作る（または ubuntu-latest コンテナでローカル採取）。
2. 採取された 4 png を commit。
3. 次回以降の PR は baseline diff として作用する。

## 6. ローカル実行・検証コマンド

```bash
# 4 画面 visual baseline 比較
mise exec -- pnpm --filter @ubm-hyogo/web e2e:visual

# baseline 更新（意図的なデザイン変更時のみ）
mise exec -- pnpm --filter @ubm-hyogo/web e2e:visual:update

# 差分レポート
open apps/web/playwright-report/index.html
```

## 7. DoD チェックリスト

- [ ] `login.spec.ts` / `public-top.spec.ts` / `admin-dashboard.spec.ts` / `profile.spec.ts` の 4 ファイルが新設
- [ ] 4 spec すべてで animation / transition / caret 停止 styleTag を注入
- [ ] viewport 1280x800 / Desktop Chrome / `maxDiffPixelRatio: 0.02` を満たす
- [ ] `__screenshots__/` 配下に 4 png が commit され、CI で再採取せず diff のみ実施される
- [ ] `admin-dashboard.spec.ts` / `profile.spec.ts` は `adminLogin` / `memberLogin` を `beforeEach` で呼ぶ
- [ ] `e2e:visual:update` を実行しない限り baseline が変化しない
