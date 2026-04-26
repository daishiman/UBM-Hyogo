# Phase 6: 異常系検証

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 08b-parallel-playwright-e2e-and-ui-acceptance-smoke |
| Phase 番号 | 6 / 13 |
| Phase 名称 | 異常系検証 |
| 作成日 | 2026-04-26 |
| 前 Phase | 5 (実装ランブック) |
| 次 Phase | 7 (AC マトリクス) |
| 状態 | pending |

## 目的

E2E で起こりうる failure ケースを navigation timeout / login fail / form submit error / mobile viewport overflow / a11y violation / external nav (Google Form) / 認可境界 / `/no-access` / attendance dup / 削除済み除外 で網羅し、test ケースとして組み込む。

## 実行タスク

- [ ] failure cases を 12 カテゴリで列挙
- [ ] 各 category × 関連 spec × expected のマトリクス化
- [ ] AuthGateState / external nav / a11y の特例 test 定義

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-05/main.md | runbook |
| 必須 | doc/00-getting-started-manual/specs/00-overview.md | 不変条件 |
| 必須 | doc/00-getting-started-manual/specs/13-mvp-auth.md | AuthGateState |
| 必須 | doc/00-getting-started-manual/specs/09-ui-ux.md | 検証マトリクス |

## failure cases

| # | カテゴリ | 発生条件 | 関連 spec | expected | 備考 |
| --- | --- | --- | --- | --- | --- |
| F-1 | navigation timeout | API down で page load > 30s | public / login / profile / admin | test fail with screenshot | retry on CI のみ |
| F-2 | login form submit エラー | `/auth/magic-link` 422 | login.spec | toast 表示 + state=input | enumeration 防止 |
| F-3 | login state=unregistered | 未登録 email | login.spec | state block visible | 不変条件 #9 |
| F-4 | login state=rules_declined | rules 同意なし | login.spec | state block visible | 不変条件 #9 |
| F-5 | login state=deleted | 削除済み login 試行 | login.spec | state block visible | 不変条件 #7 / #9 |
| F-6 | `/no-access` URL アクセス | 直接 URL 指定 | login.spec | 404 | 不変条件 #9 |
| F-7 | profile 編集 form 不在 | 編集 form を探す | profile.spec | toHaveCount(0) | 不変条件 #4 |
| F-8 | editResponseUrl 遷移失敗 | popup blocked | profile.spec | external nav fail tolerable | 警告のみ |
| F-9 | mobile viewport overflow | 横スクロール発生 | 全 spec mobile | scroll x = 0 を assert | layout regression |
| F-10 | admin に member access | member cookie で `/admin` | admin.spec | 403 | 不変条件 #5 |
| F-11 | admin に anon access | cookie なしで `/admin` | admin.spec | redirect to /login | 不変条件 #5 |
| F-12 | attendance dup register | 同 member 2 回登録 | attendance.spec | toast 表示、UNIQUE 違反吸収 | 不変条件 #15 |
| F-13 | a11y violation | aria-* / contrast 違反 | 全 spec | violations = [] | 不変条件 #16 (補強) |
| F-14 | reload 後 state 喪失 | localStorage 依存実装 | profile.spec | state 維持 assert | 不変条件 #8 |

## category × spec matrix

| カテゴリ | public | login | profile | admin | search | density | attendance |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F-1 timeout | ✓ | ✓ | ✓ | ✓ | — | — | — |
| F-2 form 422 | — | ✓ | — | — | — | — | — |
| F-3〜F-5 AuthGateState | — | ✓ | — | — | — | — | — |
| F-6 /no-access 404 | — | ✓ | — | — | — | — | — |
| F-7 profile 編集なし | — | — | ✓ | — | — | — | — |
| F-8 popup blocked | — | — | ✓ | — | — | — | — |
| F-9 mobile overflow | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| F-10 / F-11 認可 | — | — | — | ✓ | — | — | — |
| F-12 attendance dup | — | — | — | — | — | — | ✓ |
| F-13 a11y | ✓ | ✓ | ✓ | ✓ | — | — | — |
| F-14 reload state | — | — | ✓ | — | — | — | — |

## AuthGateState テスト

```ts
// apps/web/tests/e2e/login.spec.ts
import { test, expect } from '../fixtures/auth'

const states = ['input', 'sent', 'unregistered', 'rules_declined', 'deleted'] as const
for (const state of states) {
  test(`AuthGateState=${state} block 表示`, async ({ page }) => {
    await page.goto(`/login?test_state=${state}`)
    await expect(page.getByTestId(`auth-gate-${state}`)).toBeVisible()
  })
}

test('/no-access が 404 (#9)', async ({ page }) => {
  const res = await page.goto('/no-access')
  expect(res?.status()).toBe(404)
})
```

## external nav (Google Form) テスト

```ts
test('editResponseUrl で popup → docs.google.com/forms へ遷移 (#4)', async ({ page, context }) => {
  await page.goto('/profile')
  const popupPromise = context.waitForEvent('page')
  await page.getByRole('link', { name: /回答を編集/ }).click()
  const popup = await popupPromise
  await popup.waitForLoadState('domcontentloaded')
  await expect(popup).toHaveURL(/docs\.google\.com\/forms\/d\/e\/.+\/viewform/)
})
```

## mobile viewport overflow テスト

```ts
test('mobile で横スクロールが発生しない', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/members')
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
})
```

## attendance dup + 削除済み除外 (#15)

```ts
test('attendance dup register で toast (#15 二重防御)', async ({ adminPage }) => {
  await adminPage.goto('/admin/meetings/sess-1')
  const btn = adminPage.getByRole('button', { name: /m-1.+出席登録/ })
  await btn.click()
  await btn.click()  // 2 回目
  await expect(adminPage.getByText(/既に出席登録済み/)).toBeVisible()
})

test('削除済み member は出席候補から除外 (#15 + #7)', async ({ adminPage }) => {
  await adminPage.goto('/admin/meetings/sess-1')
  await expect(adminPage.getByTestId('attendance-candidates')).not.toContainText('m-deleted')
})
```

## a11y violation テスト

```ts
test.describe('a11y', () => {
  for (const path of ['/', '/members', '/login', '/profile', '/admin']) {
    test(`${path} で WCAG 2.1 AA 主要違反 0`, async ({ adminPage }) => {
      await adminPage.goto(path)
      const violations = await runAxe(adminPage)
      expect(violations).toEqual([])
    })
  }
})
```

## reload 後 state 維持 (#8)

```ts
test('profile 表示 → reload で state 維持 (#8 localStorage 不依存)', async ({ memberPage }) => {
  await memberPage.goto('/profile')
  await expect(memberPage.getByText(/ようこそ/)).toBeVisible()
  await memberPage.reload()
  await expect(memberPage.getByText(/ようこそ/)).toBeVisible()
  // localStorage を破壊しても state 維持される
  await memberPage.evaluate(() => localStorage.clear())
  await memberPage.reload()
  await expect(memberPage.getByText(/ようこそ/)).toBeVisible()
})
```

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 verify suite | 上記 failure を test ケース化 |
| Phase 7 AC matrix | failure × AC マッピング |
| 下流 09a smoke | staging で同 failure 再現可能性 |

## 多角的チェック観点

- 不変条件 **#4** profile 編集 form 不在 + editResponseUrl 遷移
- 不変条件 **#8** reload 後 state 維持 + localStorage clear test
- 不変条件 **#9** AuthGateState 5 状態 + `/no-access` 404
- 不変条件 **#15** attendance dup toast + 削除済み除外
- a11y: 5 path で WCAG 2.1 AA 違反 0
- 無料枠: failure テストでも CI 10 min 以内

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | failure cases 14 件 | 6 | pending | F-1〜14 |
| 2 | category × spec matrix | 6 | pending | matrix |
| 3 | 特例 test (AuthGate / external / a11y / mobile / attendance / reload) | 6 | pending | 6 種 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-06/main.md | failure 一覧 |
| メタ | artifacts.json | phase 6 status |

## 完了条件

- [ ] failure cases ≥ 12 カテゴリ
- [ ] category × spec matrix
- [ ] 特例 test 6 種定義

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 成果物配置済み
- [ ] 多角的チェック観点記述済み
- [ ] artifacts.json の phase 6 を completed

## 次 Phase

- 次: Phase 7 (AC マトリクス)
- 引き継ぎ: 14 failure を AC matrix の異常系列へ
- ブロック条件: failure 12 未満なら Phase 7 不可
