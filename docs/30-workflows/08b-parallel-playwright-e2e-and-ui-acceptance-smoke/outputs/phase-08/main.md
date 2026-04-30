# Phase 8: DRY 化 — Before / After

> 目的: 各 spec ファイルで重複していた locator 取得 / screenshot 撮影 / a11y scan を BasePage / page-object / fixtures / helpers に集約し、後続 spec 増設で破綻しない構造に整える。

## 1. DRY 化サマリ

| 項目 | Before（重複あり） | After（共通化） | 概算 LOC 削減 |
| --- | --- | --- | --- |
| locator 取得 | 7 spec × 平均 6 箇所 = 42 箇所の `page.locator(...)` | page-object の getter に集約 | 約 -120 LOC |
| screenshot 撮影 | 7 spec × 平均 5 箇所 = 35 箇所の `page.screenshot({ path, fullPage })` | `snap(page, 'desktop/<name>')` 1 行 | 約 -70 LOC |
| a11y scan | 14 箇所の `new AxeBuilder({page}).analyze()` + 違反 filter | `runAxe(page)` 1 行 | 約 -55 LOC |
| viewport 切替 | 各 spec で hardcode 1280x800 / 390x844 | `viewports.desktop` / `viewports.mobile` 参照 | 約 -20 LOC |
| auth cookie 注入 | 各 spec の `beforeEach` で session 生成 | fixture `adminPage` / `memberPage` | 約 -90 LOC |
| seed | spec ごとに `wrangler d1 execute` shell out | `seedE2eFixtures()` 1 行 | 約 -30 LOC |
| 合計 | — | — | **約 -385 LOC** |

## 2. 共通化対象と signature

### 2.1 BasePage

```ts
// apps/web/tests/page-objects/base-page.ts
export abstract class BasePage {
  constructor(protected readonly page: Page) {}
  abstract readonly url: string;
  async goto(): Promise<void>;
  async assertNoConsoleError(): Promise<void>;  // 不変条件 #4 補助
  async reloadAndClearStorage(): Promise<void>; // 不変条件 #8 検証用
}
```

### 2.2 page-object（5 種）

| クラス | パス | 主要 signature |
| --- | --- | --- |
| `LoginPage` | apps/web/tests/page-objects/login-page.ts | `gotoState(state: AuthGateState): Promise<void>` / `submitMagicLink(args: { email: string }): Promise<void>` / `assertNoAccessReturns404(): Promise<void>` |
| `PublicPage` | public-page.ts | `gotoLanding()` / `gotoMembers()` / `gotoMember(id: MemberId)` / `gotoRegister()` / `cards: Locator` |
| `ProfilePage` | profile-page.ts | `assertNoEditFormVisible(): Promise<void>` / `clickEditResponseUrl(): Promise<Page>`（popup 返却） |
| `AdminPage` | admin-page.ts | `gotoDashboard()` / `gotoMembers()` / `gotoTags()` / `gotoSchema()` / `gotoMeetings()` / `assertForbidden()` / `assertRedirectedToLogin()` |
| `AttendancePage` | attendance-page.ts | `registerButton(memberId: MemberId): Locator` / `assertDuplicateToast(): Promise<void>` / `assertDeletedExcluded(memberId: MemberId): Promise<void>` |

### 2.3 fixtures

| fixture | パス | signature |
| --- | --- | --- |
| `adminPage` / `memberPage` / `unregisteredPage` | apps/web/tests/fixtures/auth.ts | `test.extend<{ adminPage: Page }>({ adminPage: async ({ browser }, use) => { ... } })` |
| `viewports` | apps/web/tests/fixtures/viewports.ts | `export const viewports = { desktop: { width: 1280, height: 800 }, mobile: { width: 390, height: 844 } } as const` |
| `seedE2eFixtures` | apps/web/tests/fixtures/seed.ts | `export async function seedE2eFixtures(): Promise<void>`（`scripts/cf.sh` 経由で wrangler d1 execute をラップ） |

### 2.4 helpers

| helper | パス | signature |
| --- | --- | --- |
| `snap` | apps/web/tests/helpers/screenshot.ts | `export async function snap(page: Page, name: \`${'desktop' \| 'mobile'}/${string}\`): Promise<void>`（dir 自動作成 + fullPage 既定） |
| `runAxe` | apps/web/tests/helpers/axe-scan.ts | `export async function runAxe(page: Page, opts?: { excludeColorContrast?: boolean }): Promise<axe.Result['violations']>`（critical+serious のみ返却） |

## 3. Before / After（コード断片）

### 3.1 locator 取得

```ts
// Before（spec ごとに散在）
await page.locator('button[name=submit]').click();
await page.locator('.member-card').first().click();

// After（page-object 経由）
await loginPage.submitMagicLink({ email });
await publicPage.cards.first().click();
```

### 3.2 screenshot 撮影

```ts
// Before
await page.screenshot({ path: 'evidence/desktop/landing-1.png', fullPage: true });

// After
await snap(page, 'desktop/landing');
```

### 3.3 a11y scan

```ts
// Before
const result = await new AxeBuilder({ page })
  .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
  .analyze();
expect(result.violations.filter(v => ['critical','serious'].includes(v.impact ?? ''))).toEqual([]);

// After
expect(await runAxe(page)).toEqual([]);
```

## 4. 命名 alignment（08a と整合）

| 観点 | 08a | 08b |
| --- | --- | --- |
| brand 型 / view model schema | `packages/shared` から import | 同一 import |
| fixture user 定義 | `apps/api/test/fixtures/users.ts` | `apps/web/tests/fixtures/seed.ts` で同 user 行を D1 に投入 |
| auth | session cookie 直接生成 helper | `adminPage` / `memberPage` fixture が同 helper を再利用 |
| `/no-access` | contract 上 404 | E2E で 404 verify |
| profile 編集 endpoint | eslint で禁止 | UI form 不在 verify |

## 5. 不変条件への参照

- **#4** `ProfilePage.assertNoEditFormVisible()` を 1 メソッド化し、編集 form 不在 assertion を全 spec で同一化
- **#8** `BasePage.reloadAndClearStorage()` で reload + localStorage.clear() を共通化、profile.spec で state 維持を検証
- **#9** `LoginPage.gotoState(state)` で 5 状態を switch、`assertNoAccessReturns404()` も同 class に集約
- **#15** `AttendancePage.assertDuplicateToast()` / `assertDeletedExcluded()` で attendance 二重防御を集約

## 6. 完了条件チェック

- [x] Before / After を 5 軸（file / page object / fixture / helper / screenshot）で記述
- [x] 共通化対象を 6 items 以上列挙（BasePage + 5 page-object + 3 fixture + 2 helper = 11 items）
- [x] 08a と命名整合（brand 型 / fixture / auth / `/no-access` / profile / attendance）
