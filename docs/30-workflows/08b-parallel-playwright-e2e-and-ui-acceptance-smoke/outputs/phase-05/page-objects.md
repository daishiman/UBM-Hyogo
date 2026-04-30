# Phase 5 Output — Page Objects 一覧

> 11 page object class を `apps/web/playwright/page-objects/` 配下に配置。すべて class + `url` + `visit()` + 主要 locator getter を持つ最小実装。

## 共通 signature

```ts
abstract class BasePage {
  constructor(protected readonly page: import('@playwright/test').Page) {}
  abstract readonly url: string
  async visit(): Promise<void>
  async screenshot(name: string): Promise<void>
}
```

## 一覧

| # | class | url | 主要 locator | 主要メソッド | 適用 spec |
| --- | --- | --- | --- | --- | --- |
| 1 | `HomePage` | `/` | `heroCta` / `membersLink` / `mobileMenuToggle` | `visit()` / `openMobileMenu()` | public-flow |
| 2 | `MembersListPage` | `/members` | `searchInput` / `memberCards` / `densityToggle` | `visit()` / `applyQuery(params)` / `clickFirstCard()` | public-flow / search-density |
| 3 | `MemberDetailPage` | `/members/:id` | `profileHeading` / `tagChips` / `breadcrumb` | `visit(id)` / `assertHeading()` | public-flow |
| 4 | `RegisterPage` | `/register` | `viewformLink` | `visit()` / `assertExternalLink()` | public-flow |
| 5 | `LoginPage` | `/login` | `emailInput` / `submitButton` / `stateBlock` | `visit()` / `gotoState(state)` / `assertNoAccessAbsent()` | auth-gate-state |
| 6 | `ProfilePage` | `/profile` | `editResponseUrlButton` / `userName` | `visit()` / `assertNoEditFormVisible()` (#4) / `clickEditResponseUrl()` | profile |
| 7 | `AdminDashboardPage` | `/admin` | `dashboardCards` / `sidebar` | `visit()` / `assertCards()` | admin-pages |
| 8 | `AdminMembersPage` | `/admin/members` | `membersTable` / `sortHeader` | `visit()` / `sortBy(col)` | admin-pages |
| 9 | `AdminTagsPage` | `/admin/tags` | `tagList` / `addTagButton` | `visit()` / `clickAddTag()` | admin-pages |
| 10 | `AdminSchemaPage` | `/admin/schema` | `schemaSections` | `visit()` / `assertSectionCount(6)` | admin-pages |
| 11 | `AdminMeetingsPage` | `/admin/meetings` / `/admin/meetings/:id` | `meetingsTable` / `attendanceCandidates` / `dupToast` | `visit(id?)` / `registerAttendance(memberId)` / `expectDupToast()` (#15) | admin-pages / attendance |

## 認可境界（5 状態 fixture との対応）

| fixture | LoginPage | ProfilePage | Admin* (5 画面) |
| --- | --- | --- | --- |
| `adminCookie` | (skip) | OK | 全 200 |
| `memberCookie` | (skip) | OK | 全 403 |
| `anonymous` | input/sent/unregistered/rules_declined/deleted | redirect → /login | redirect → /login |

## 不変条件マッピング

- `ProfilePage.assertNoEditFormVisible()` → 不変条件 **#4**
- `AdminMeetingsPage.expectDupToast()` → 不変条件 **#15** 第 1 防御
- `AdminMeetingsPage.attendanceCandidates` selector に `not(deleted)` → 不変条件 **#15** 第 2 防御
- `LoginPage.assertNoAccessAbsent()` → 不変条件 **#9**

## 命名規約

- ファイル名: `<ClassName>.ts`（PascalCase）
- export: `export class <ClassName> extends BasePage`
- locator getter: `readonly memberCards = this.page.locator('[data-testid="member-card"]')`
- 副作用メソッドは動詞始まり (`click*` / `apply*` / `register*`)
- assert 系は `assert*` / `expect*` で命名統一
