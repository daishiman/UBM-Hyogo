# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 08b-parallel-playwright-e2e-and-ui-acceptance-smoke |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略 |
| 作成日 | 2026-04-26 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装ランブック) |
| 状態 | pending |

## 目的

採用案 A（local web + local api）の上で、scenario × viewport を verify suite として整理し、AC-1〜8 を 1:1 でカバーする matrix を作る。a11y assertion 戦略も確定。

## 実行タスク

- [ ] scenario × viewport の verify suite signature 設計
- [ ] verify suite × AC matrix を `outputs/phase-04/verify-matrix.md`
- [ ] a11y assertion 戦略
- [ ] screenshot 命名規約
- [ ] 1 scenario あたりの assertion 最低ライン

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/main.md | layout / scenario matrix |
| 必須 | outputs/phase-03/main.md | 採用案 A |
| 必須 | doc/00-getting-started-manual/specs/09-ui-ux.md | 検証マトリクス |
| 必須 | doc/00-getting-started-manual/specs/16-component-library.md | a11y |

## 7 種 spec ファイル signature

### 1. public.spec.ts (公開導線)

```ts
// apps/web/tests/e2e/public.spec.ts
import { test, expect, devices } from '@playwright/test'
import { PublicPage } from '../page-objects/PublicPage'
import { runAxe } from '../helpers/axe'
import { snap } from '../helpers/screenshot'

for (const view of ['desktop', 'mobile'] as const) {
  test.describe(`public flow [${view}]`, () => {
    test('landing → 一覧 → 詳細 → 登録 が遷移可能', async ({ page }) => {
      const pub = new PublicPage(page)
      await pub.goto('/')
      await snap(page, `${view}/landing`)
      await pub.clickMembersLink()
      await expect(page).toHaveURL(/\/members/)
      await snap(page, `${view}/members-list`)
      await pub.clickFirstMemberCard()
      await expect(page).toHaveURL(/\/members\/[\w-]+/)
      await snap(page, `${view}/members-detail`)
      await pub.clickRegisterButton()
      await expect(page).toHaveURL(/\/register/)
      await snap(page, `${view}/register`)
    })

    test('a11y: WCAG 2.1 AA 主要違反 0', async ({ page }) => {
      for (const path of ['/', '/members', '/members/m-1', '/register']) {
        await page.goto(path)
        const violations = await runAxe(page)
        expect(violations).toEqual([])
      }
    })
  })
}
```

### 2. login.spec.ts (AuthGateState 5 状態)

```ts
// apps/web/tests/e2e/login.spec.ts
import { test, expect } from '@playwright/test'
import { LoginPage } from '../page-objects/LoginPage'

const states = ['input', 'sent', 'unregistered', 'rules_declined', 'deleted'] as const
for (const view of ['desktop', 'mobile'] as const) {
  for (const state of states) {
    test(`AuthGateState ${state} [${view}]`, async ({ page }) => {
      const login = new LoginPage(page)
      await login.gotoState(state)
      await expect(login.stateBlock(state)).toBeVisible()
      await snap(page, `${view}/login-${state}`)
    })
  }
  test(`/no-access route does not exist [${view}] (#9)`, async ({ page }) => {
    const res = await page.goto('/no-access')
    expect(res?.status()).toBe(404)
  })
}
```

### 3. profile.spec.ts (editResponseUrl + 不変条件 #4)

```ts
// apps/web/tests/e2e/profile.spec.ts
test.describe('profile [desktop|mobile]', () => {
  test('プロフィール本文の編集 form が存在しない (#4)', async ({ page }) => {
    await page.goto('/profile')
    await expect(page.getByRole('form', { name: /プロフィール編集/ })).toHaveCount(0)
    await expect(page.getByRole('textbox', { name: /自己紹介/ })).toHaveCount(0)
  })

  test('editResponseUrl ボタンで Google Form viewform へ遷移', async ({ page, context }) => {
    await page.goto('/profile')
    const [popup] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('link', { name: /回答を編集/ }).click(),
    ])
    await expect(popup).toHaveURL(/docs\.google\.com\/forms\/d\/e\/.+\/viewform/)
  })

  test('reload 後も session が D1/cookie 由来で復元される (#8)', async ({ page }) => {
    await page.goto('/profile')
    await expect(page.getByText(/ようこそ/)).toBeVisible()
    await page.reload()
    await expect(page.getByText(/ようこそ/)).toBeVisible()
  })
})
```

### 4. admin.spec.ts (5 画面 + 認可境界)

```ts
// apps/web/tests/e2e/admin.spec.ts
const adminPages = [
  ['/admin', 'dashboard'],
  ['/admin/members', 'members'],
  ['/admin/tags', 'tags'],
  ['/admin/schema', 'schema'],
  ['/admin/meetings', 'meetings'],
] as const

for (const view of ['desktop', 'mobile'] as const) {
  for (const [path, name] of adminPages) {
    test(`admin ${name} [${view}] - admin で 200`, async ({ adminPage }) => {
      await adminPage.goto(path)
      await expect(adminPage).toHaveURL(path)
      await snap(adminPage, `${view}/admin-${name}`)
    })
    test(`admin ${name} [${view}] - member で 403`, async ({ memberPage }) => {
      const res = await memberPage.goto(path)
      expect(res?.status()).toBe(403)
    })
    test(`admin ${name} [${view}] - anonymous で /login redirect`, async ({ page }) => {
      await page.goto(path)
      await expect(page).toHaveURL(/\/login/)
    })
  }
}
```

### 5. search.spec.ts (検索 6 パラメータ)

```ts
// apps/web/tests/e2e/search.spec.ts
const cases: Array<{ query: string; expectedCount: number }> = [
  { query: 'q=tanaka', expectedCount: 1 },
  { query: 'zone=hyogo&status=active', expectedCount: 3 },
  { query: 'tag=tag-1', expectedCount: 2 },
  { query: 'sort=name_asc', expectedCount: 5 },
  { query: 'q=foo&zone=osaka&status=active&tag=tag-2&sort=name_desc&density=dense', expectedCount: 0 },
]
for (const { query, expectedCount } of cases) {
  test(`search [${query}] returns ${expectedCount} cards`, async ({ page }) => {
    await page.goto(`/members?${query}`)
    await expect(page.getByRole('article', { name: /member-card/ })).toHaveCount(expectedCount)
    expect(new URL(page.url()).search).toContain(query.split('&')[0])
  })
}
```

### 6. density.spec.ts

```ts
// apps/web/tests/e2e/density.spec.ts
const densities = ['comfy', 'dense', 'list'] as const
for (const d of densities) {
  test(`density=${d} の layout 観測`, async ({ page }) => {
    await page.goto(`/members?density=${d}`)
    const grid = page.getByTestId('members-grid')
    await expect(grid).toHaveAttribute('data-density', d)
    await snap(page, `desktop/density-${d}`)
  })
}
```

### 7. attendance.spec.ts (#15 二重防御)

```ts
// apps/web/tests/e2e/attendance.spec.ts
test('attendance 重複登録で toast 表示 (#15)', async ({ adminPage }) => {
  await adminPage.goto('/admin/meetings/sess-1')
  await adminPage.getByRole('button', { name: /出席登録/ }).first().click()
  await adminPage.getByRole('button', { name: /出席登録/ }).first().click()
  await expect(adminPage.getByText(/既に出席登録済み/)).toBeVisible()
  await snap(adminPage, 'desktop/attendance-duplicate-toast')
})

test('削除済み member は出席候補に出ない (#15)', async ({ adminPage }) => {
  await adminPage.goto('/admin/meetings/sess-1')
  const list = adminPage.getByTestId('attendance-candidates')
  await expect(list).not.toContainText('削除済みユーザー')
})
```

## verify suite × AC matrix

| AC | public | login | profile | admin | search | density | attendance | a11y |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AC-1 検証マトリクス全 16 セル green | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | — |
| AC-2 公開導線 4 シナリオ × 2 viewport | ✓ | — | — | — | — | — | — | — |
| AC-3 AuthGateState 5 状態 + `/no-access` 404 | — | ✓ | — | — | — | — | — | — |
| AC-4 editResponseUrl 遷移 | — | — | ✓ | — | — | — | — | — |
| AC-5 admin 5 × 認可境界 3 | — | — | — | ✓ | — | — | — | — |
| AC-6 検索 6 パラメータ + density 3 値 | — | — | — | — | ✓ | ✓ | — | — |
| AC-7 screenshot ≥ 30 枚 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| AC-8 axe WCAG 2.1 AA 0 件 | ✓ | ✓ | ✓ | ✓ | — | — | — | ✓ |

## a11y assertion 戦略

- `@axe-core/playwright` を `await injectAxe(page); await checkA11y(page, ...)` 形式で wrap
- runs only `wcag2a` + `wcag2aa` + `wcag21a` + `wcag21aa` rules
- exclude rules: `color-contrast` は admin 内部のみ exclude（feature-flag 検討）
- 違反は `outputs/phase-11/evidence/axe-report.json` に shape `{ url, violations: [...] }` で集約

## screenshot 命名規約

```
outputs/phase-11/evidence/
├── desktop/
│   ├── landing.png
│   ├── members-list.png
│   ├── members-detail.png
│   ├── register.png
│   ├── login-input.png
│   ├── login-sent.png
│   ├── login-unregistered.png
│   ├── login-rules_declined.png
│   ├── login-deleted.png
│   ├── profile.png
│   ├── admin-dashboard.png
│   ├── admin-members.png
│   ├── admin-tags.png
│   ├── admin-schema.png
│   ├── admin-meetings.png
│   ├── density-comfy.png
│   ├── density-dense.png
│   ├── density-list.png
│   └── attendance-duplicate-toast.png
└── mobile/
    └── (同等 17 枚)
```

→ desktop 19 + mobile 17 = **36 枚**（30 枚以上達成）

## 1 scenario あたり assertion 最低

- 正常 1 + 不変条件 1 + screenshot 1 = 3 ケース最低
- a11y は 5 spec 共通で 1 violation = 0 を assert

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | runbook で各 spec を実装手順化 |
| Phase 7 | AC matrix |
| Phase 11 | `pnpm e2e` 実行 evidence |

## 多角的チェック観点

- 不変条件 **#4** profile.spec.ts の `編集 form 不在` test
- 不変条件 **#8** profile.spec.ts の reload 後 state 維持 test
- 不変条件 **#9** login.spec.ts の `/no-access` 404 test
- 不変条件 **#15** attendance.spec.ts の duplicate toast + 削除済み除外 test
- a11y: axe で WCAG 2.1 AA 主要違反 0
- 無料枠: chromium + webkit のみ常時実行

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 7 spec signature | 4 | pending | public/login/profile/admin/search/density/attendance |
| 2 | a11y 戦略 | 4 | pending | axe rule set |
| 3 | screenshot 命名 | 4 | pending | desktop/mobile |
| 4 | verify-matrix.md | 4 | pending | AC × suite |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/main.md | テスト戦略 |
| matrix | outputs/phase-04/verify-matrix.md | AC × suite |
| メタ | artifacts.json | phase 4 status |

## 完了条件

- [ ] 7 種 spec signature 確定
- [ ] AC × suite matrix 全行マッピング
- [ ] a11y 戦略記述
- [ ] screenshot 命名規約定義

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 成果物配置済み
- [ ] 多角的チェック観点記述済み
- [ ] artifacts.json の phase 4 を completed

## 次 Phase

- 次: Phase 5 (実装ランブック)
- 引き継ぎ: 7 spec signature と axe 戦略
- ブロック条件: signature 未完なら Phase 5 不可
