# Phase 8: DRY 化

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 08a-parallel-api-contract-repository-and-authorization-tests |
| Phase 番号 | 8 / 13 |
| Phase 名称 | DRY 化 |
| 作成日 | 2026-04-26 |
| 前 Phase | 7 (AC マトリクス) |
| 次 Phase | 9 (品質保証) |
| 状態 | pending |

## 目的

test fixture / helper / brand 型 import / file 命名 / coverage exclude を統一し、後続の test 増設で破綻しない構造に DRY 化する。Before / After 表で命名差分を確定する。

## 実行タスク

- [ ] fixture / helper / 命名 / coverage exclude の Before / After
- [ ] 共通化対象を `apps/api/test/helpers` か `packages/shared/test-utils` に分類
- [ ] 08b と命名 alignment 確認

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-04/main.md | suite signature |
| 必須 | outputs/phase-07/main.md | AC matrix |
| 必須 | ../../08b-parallel-playwright-e2e-and-ui-acceptance-smoke/index.md | E2E 命名 |

## Before / After

### test ファイル命名

| Before | After | 理由 |
| --- | --- | --- |
| `*.test.ts` | `*.spec.ts` (unit / authz / lint) / `*.contract.spec.ts` (contract) / `*.type-test.ts` (type) | suite 種別を suffix で識別 |
| `tests/` | `__tests__/` | Node.js / Jest 慣習に統一 |
| `test/` (top level) | `apps/api/test/` (helpers / fixtures / mocks) | source 配下 (`__tests__/`) と分離 |

### fixture 命名

| Before | After | 理由 |
| --- | --- | --- |
| `seedMembers()` | `fixtures.members.create({ count, deletedCount })` | namespace で重複防止、引数明示 |
| `userFixture` | `fixtures.adminUsers` / `fixtures.members` | role を path で区別 |
| `meetingSession1` | `fixtures.meetings.session({ id: 's-1' })` | factory 形式 |

### helper 命名

| Before | After | 理由 |
| --- | --- | --- |
| `getAuthCookie('admin')` | `adminCookie()` / `memberCookie(memberId)` | 直感的 |
| `setupApp()` | `createTestApp()` | factory 命名 |
| `truncate()` | `resetDb()` | 副作用明示 |

### brand 型 import

| Before | After | 理由 |
| --- | --- | --- |
| `import type { MemberId } from '../../../packages/shared/src/types/brands'` | `import type { MemberId } from '@ubm/shared/brands'` | path alias |
| `as MemberId` 散在 | `MemberId('m-1')` factory | type-safe constructor |

### coverage exclude

| Before | After | 理由 |
| --- | --- | --- |
| `**/*.test.ts` | `**/*.spec.ts`, `**/*.contract.spec.ts`, `**/*.type-test.ts`, `test/**` | 命名統一に追従 |
| (なし) | `src/**/index.ts` (re-export only) | カバレッジ希釈防止 |

## 共通化対象

| 対象 | 配置 | 用途 |
| --- | --- | --- |
| `createTestApp()` | apps/api/test/helpers/app.ts | Hono test app + binding inject |
| `adminCookie()` / `memberCookie()` | apps/api/test/helpers/auth.ts | session cookie |
| `fixtures.*` namespace | apps/api/test/fixtures/index.ts | factory 集約 |
| `MemberId(s)` factory | packages/shared/src/brands.ts | brand 型コンストラクタ |
| `expectViewModel(body, schema)` | apps/api/test/helpers/expect.ts | zod parse + assert |
| msw `forms-api.handlers.ts` | apps/api/test/mocks/forms-api.ts | Forms API 共通モック |

## 08b との alignment

| 観点 | 08a (本タスク) | 08b (E2E) |
| --- | --- | --- |
| fixture 経路 | apps/api/test/fixtures | playwright/seed.ts (D1 への直接 INSERT) |
| auth | session cookie 直接生成 | playwright login flow |
| Forms API | msw | staging で実 sync 確認 |
| 命名 | `*.contract.spec.ts` | `*.e2e.spec.ts` |
| 共通基盤 | brand 型 / view model schema | brand 型 / view model schema (同 import) |

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | DRY 化後の lint rule 確認 |
| Phase 12 | implementation-guide に共通化方針反映 |
| 下流 08b | 同 brand 型 / 同 view model schema の参照 |

## 多角的チェック観点

- 不変条件 **#2** brand 型 factory `MemberId()` で fields 定数（responseEmail）を排除（理由: literal 防止）
- 不変条件 **#5** authz helper を 1 箇所に集約（理由: matrix 増設時に漏れない）
- 不変条件 **#6** lint test の grep pattern を helper 化（理由: 06c 等の追加でも同 helper で）
- a11y / 無料枠: 共通化により bundle / CI 時間微減

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | 命名 Before/After | 8 | pending | file / fixture / helper / brand / exclude |
| 2 | 共通化対象列挙 | 8 | pending | 6 items |
| 3 | 08b alignment | 8 | pending | brand / schema 共有 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-08/main.md | DRY 化結果 |
| メタ | artifacts.json | phase 8 status |

## 完了条件

- [ ] Before / After 表が 5 軸（file / fixture / helper / brand / coverage）
- [ ] 共通化対象 6 items 以上
- [ ] 08b と命名整合

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 成果物配置済み
- [ ] artifacts.json の phase 8 を completed

## 次 Phase

- 次: Phase 9 (品質保証)
- 引き継ぎ: 命名規約と共通化配置
- ブロック条件: Before/After 未完なら Phase 9 不可
