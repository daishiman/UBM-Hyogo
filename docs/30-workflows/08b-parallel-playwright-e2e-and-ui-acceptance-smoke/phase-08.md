# Phase 8: DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 08b-parallel-playwright-e2e-and-ui-acceptance-smoke |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化 |
| 作成日 | 2026-04-26 |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (品質保証) |
| 状態 | pending |

## 目的

page object / fixture / helper / screenshot 命名 / axe wrapper / viewport 定義を統一し、後続の spec 増設で破綻しない構造に DRY 化する。Before / After 表で命名差分を確定する。

## 実行タスク

- [ ] page object / fixture / helper / 命名 / viewport の Before / After
- [ ] 共通化対象を `apps/web/tests/page-objects` か `apps/web/tests/helpers` に分類
- [ ] 08a と命名 alignment 確認

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-04/main.md | spec signature |
| 必須 | outputs/phase-07/main.md | AC matrix |
| 必須 | docs/30-workflows/02-application-implementation/08a-parallel-api-contract-repository-and-authorization-tests/index.md | API test 命名 |

## Before / After

### test ファイル命名

| Before | After | 理由 |
| --- | --- | --- |
| `*.test.ts` | `*.spec.ts` (E2E 共通) | Playwright 慣習 |
| `tests/` (top level) | `apps/web/tests/e2e/` (specs) / `apps/web/tests/page-objects` / `apps/web/tests/fixtures` / `apps/web/tests/helpers` | 役割で分割 |
| 1 spec で全画面 | scenario 単位で 7 spec 分割 | scope 明示 + 並列実行 |

### page object 命名

| Before | After | 理由 |
| --- | --- | --- |
| `goto('/login')` 散在 | `LoginPage(page).gotoState(state)` | 状態切替を class メソッド化 |
| `page.click('button[name=submit]')` | `LoginPage(page).submitMagicLink({ email })` | 意図明示 + selector 集約 |
| `page.locator('.member-card')` | `MembersListPage(page).cards` | 意味のある getter |
| `page.locator('button:has-text("出席登録")')` | `AttendancePage(page).registerButton(memberId)` | 引数化 |

### fixture 命名

| Before | After | 理由 |
| --- | --- | --- |
| `loginAs('admin')` | test fixture `adminPage` / `memberPage` | Playwright fixtures パターン |
| `seedDb()` | `seedE2eFixtures()` | playwright と D1 で共用 |
| `users.json` | `apps/api/test/fixtures/users.ts` (08a と共用) | 同 fixture を E2E でも使う |

### helper 命名

| Before | After | 理由 |
| --- | --- | --- |
| `await page.screenshot({ path: '...' })` 散在 | `snap(page, 'desktop/landing')` | 命名規約強制 + dir 自動作成 |
| `new AxeBuilder({page}).analyze()` 散在 | `runAxe(page)` | rule set / impact filter 集約 |
| viewport hardcode | `viewports.desktop` / `viewports.mobile` | 1 箇所変更で全 spec 反映 |

### screenshot 命名規約

| Before | After | 理由 |
| --- | --- | --- |
| `landing-1.png` | `desktop/landing.png` / `mobile/landing.png` | viewport 別フォルダ |
| 連番付与 | scenario 名そのもの | 後で見て分かる |
| 画面更新ごとに連番 | `desktop/login-input.png` / `desktop/login-sent.png` | state 名 suffix |

## 共通化対象

| 対象 | 配置 | 用途 |
| --- | --- | --- |
| `LoginPage` / `PublicPage` / `ProfilePage` / `AdminPage` / `AttendancePage` | apps/web/tests/page-objects/ | URL / selector / 操作集約 |
| test fixtures `adminPage` / `memberPage` / `unregisteredPage` | apps/web/tests/fixtures/auth.ts | session cookie 注入 |
| `snap(page, name)` | apps/web/tests/helpers/screenshot.ts | dir 自動作成 + fullPage |
| `runAxe(page)` | apps/web/tests/helpers/axe.ts | wcag rule set |
| `viewports` const | apps/web/tests/fixtures/viewports.ts | desktop=1280x800 / mobile=390x844 |
| `seedE2eFixtures()` | apps/web/tests/fixtures/seed.ts | wrangler d1 execute wrapper |

## 08a との alignment

| 観点 | 08a (API test) | 08b (E2E) |
| --- | --- | --- |
| fixture 経路 | `apps/api/test/fixtures` (in-memory sqlite) | `apps/web/tests/fixtures/seed.ts` (D1 execute) |
| auth | session cookie 直接生成 | `adminPage` / `memberPage` fixture で cookie 注入 |
| Forms API | msw | E2E では mock せず Google Form viewform への遷移を観測のみ |
| 命名 | `*.contract.spec.ts` | `*.spec.ts` (Playwright) |
| 共通基盤 | brand 型 / view model schema | brand 型 / view model schema (同 import) |
| screenshot | なし | `outputs/phase-11/evidence/{viewport}/` |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | DRY 化後の bundle / CI 時間確認 |
| Phase 12 | implementation-guide に共通化方針反映 |
| 上流 08a | brand 型 / view model schema を共有 |

## 多角的チェック観点

- 不変条件 **#4** ProfilePage の `assertNoEditFormVisible()` を 1 メソッド化（理由: 編集 form 不在 assert を 1 箇所に固定）
- 不変条件 **#8** reload helper を共通化（理由: 全 spec で同一手順）
- 不変条件 **#9** LoginPage の `gotoState` で 5 状態を switch、`/no-access` assertion も同 class に（理由: 出し分けロジック集約）
- 不変条件 **#15** AttendancePage の `assertDuplicateToast` / `assertDeletedExcluded` を共通化
- a11y / 無料枠: helpers 共通化により bundle / CI 時間微減

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 命名 Before/After | 8 | pending | file / page object / fixture / helper / screenshot |
| 2 | 共通化対象列挙 | 8 | pending | 6 items |
| 3 | 08a alignment | 8 | pending | brand / schema 共有 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | DRY 化結果 |
| メタ | artifacts.json | phase 8 status |

## 完了条件

- [ ] Before / After 表が 5 軸（file / page object / fixture / helper / screenshot）
- [ ] 共通化対象 6 items 以上
- [ ] 08a と命名整合

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 成果物配置済み
- [ ] artifacts.json の phase 8 を completed

## 次 Phase

- 次: Phase 9 (品質保証)
- 引き継ぎ: 命名規約と共通化配置
- ブロック条件: Before/After 未完なら Phase 9 不可
