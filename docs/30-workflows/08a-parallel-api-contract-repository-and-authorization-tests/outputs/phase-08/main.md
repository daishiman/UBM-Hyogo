# Phase 8 成果物 — DRY 化 (08a)

## 1. 目的と Phase 7 引き取り

Phase 7 の AC マトリクスから抽出される共通項（fixture seed / Hono test app / session cookie / brand 型 import / view model schema 参照）を集約配置し、後続 test 増設で破綻しない構造に DRY 化する。**既存 `apps/api` 配下の test 命名は「ほぼそのまま」尊重**し、本 Phase の Before/After は**今後新規追加・段階的 rename する分**を対象とする。

## 2. test ファイル命名 — Before / After

| Before | After | 理由 |
| --- | --- | --- |
| `*.test.ts` (route 直下に同居) | `*.contract.spec.ts` (`__tests__/` 配下) | suite 種別を suffix で識別、source/test 分離 |
| `tests/` (top level に散在) | `apps/api/test/` (helpers / fixtures / mocks) と `__tests__/` (source 隣接) を 2 軸で分離 | top-level は infra (helpers / mocks)、source 隣接は spec |
| (なし) | `*.type-test.ts` | type test は vitest typecheck or `@ts-expect-error` で実行 |
| (なし) | `*.spec.ts` (authz / lint / unit 集約) | suite ごとに suffix を変えて grep / vitest filter を効きやすく |

> 既存 `*.test.ts` は **削除しない**。新規補強分のみ `*.contract.spec.ts` 命名で配置し、rename は別 PR（本 task は spec のみ）。

## 3. fixture 命名 — Before / After

| Before | After | 理由 |
| --- | --- | --- |
| `seedMembers()`（散在） | `fixtures.members.create({ count, deletedCount })` | namespace + 引数明示で重複防止 |
| `userFixture` / `adminFixture` | `fixtures.adminUsers.admin1`, `fixtures.members.member1` | role を path で区別 |
| `meetingSession1` (即値) | `fixtures.meetings.session({ id: 's-1' })` | factory 形式 |
| `responseWithExtra`（個別ファイル） | `fixtures.responses.withExtraFields()`（#1 専用） | 不変条件 trace を path で表現 |

集約配置: `apps/api/test/helpers/seed.ts` の `fixtures` namespace。実体は `src/repository/__fixtures__/*` を再利用。

## 4. helper 命名 — Before / After

| Before | After | 理由 |
| --- | --- | --- |
| `getAuthCookie('admin')` | `adminCookie()` / `memberCookie(memberId)` | 直感、引数明示 |
| `setupApp()` | `createTestApp()` | factory 命名で副作用を表現 |
| `truncate()` | `resetDb(testDb)` | 副作用と対象 db を明示 |
| `signSession({...})` | `apps/api/src/_shared/session` 既存を test helper から再 export | 本実装と test の signing key 不整合を回避 |

集約配置:
- `apps/api/test/helpers/auth.ts` (cookie)
- `apps/api/test/helpers/app.ts` (`createTestApp()`)
- `apps/api/test/helpers/db.ts` (`createTestDb()`, `resetDb()`)

## 5. brand 型 import — Before / After

| Before | After | 理由 |
| --- | --- | --- |
| `import type { MemberId } from '../../../packages/shared/src/types/brands'` | `import type { MemberId } from '@ubm-hyogo/shared/brands'` | path alias、相対 import 廃止 |
| `'m-1' as MemberId` 散在 | `MemberId('m-1')` factory | type-safe constructor、文字列リテラル混入防止 |
| `as MemberId` を test 内で乱用 | helper `id.member('m-1')` | factory 集約で grep 可能 |

集約配置: `packages/shared/src/brands.ts` に factory 関数 `MemberId() / ResponseId() / MeetingSessionId() / AdminUserId()` を export。

## 6. coverage exclude — Before / After

| Before | After | 理由 |
| --- | --- | --- |
| `**/*.test.ts` のみ exclude | `**/*.test.ts`, `**/*.spec.ts`, `**/*.contract.spec.ts`, `**/*.type-test.ts`, `**/__tests__/**`, `**/__fixtures__/**`, `**/__fakes__/**` | 命名統一に追従、fixture / fake が coverage を希釈しない |
| (なし) | `src/**/index.ts`（re-export only）| 純 re-export のカバレッジ希釈防止 |

## 7. 共通化対象（集約配置）

| 対象 | 配置 | 用途 |
| --- | --- | --- |
| `createTestApp()` | `apps/api/test/helpers/app.ts` | Hono test app + D1 binding 注入 |
| `adminCookie()` / `memberCookie()` | `apps/api/test/helpers/auth.ts` | session cookie 生成 |
| `fixtures.*` namespace | `apps/api/test/helpers/seed.ts` | factory 集約（members / meetings / tags / responses / adminUsers） |
| `MemberId(s)` factory | `packages/shared/src/brands.ts` | brand 型 type-safe constructor |
| `expectViewModel(body, schema)` | `apps/api/test/helpers/expect.ts` | zod parse + assertion + 失敗時 path 表示 |
| `formsApiHandlers` (msw) | `apps/api/test/mocks/forms-api.ts` | Forms API 共通 mock（`extraFields` 経路含む） |
| `createTestDb()` / `resetDb()` | `apps/api/test/helpers/db.ts` | fakeD1 / sqlite ハイブリッド切替 |

## 8. 08b との alignment

| 観点 | 08a (本タスク) | 08b (E2E Playwright) |
| --- | --- | --- |
| fixture 経路 | `apps/api/test/helpers/seed.ts` (in-memory sqlite に INSERT) | `playwright/seed.ts`（実 D1 に INSERT、wrangler d1 経由） |
| auth | session cookie 直接生成 | Playwright login flow 経由 |
| Forms API | msw (in-test) | staging で実 sync 確認 |
| 命名 | `*.contract.spec.ts`, `*.spec.ts` | `*.e2e.spec.ts` |
| 共通基盤 | brand 型 / view model schema | brand 型 / view model schema (同 import) |
| view model schema | `packages/shared` から import | 同上 (E2E でも response shape を zod parse) |

→ **brand 型 / view model schema は packages/shared の単一 source**。08a / 08b 双方が同じ source を参照することで、上流仕様変更が両 task に同時伝播する設計。

## 9. lint rule（Phase 9 連携）

DRY 化の延長で、命名規約違反を検知する eslint rule を Phase 9 で提案:

- `import/no-relative-parent-imports`（packages/shared を直接相対 import 禁止）
- `no-restricted-imports`（apps/web から D1 / repository を禁止）
- `vitest/expect-expect`（`it()` に必ず assertion）

## 10. 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 9 | DRY 化後の lint rule 確認、coverage 設定を最終固定 |
| Phase 12 | implementation-guide に共通化方針反映 |
| 下流 08b | 同 brand 型 / 同 view model schema を import |

## 11. 多角的チェック観点

- 不変条件 **#2** brand 型 factory `MemberId()` / fields enum factory で `responseEmail` 文字列リテラル混入を排除
- 不変条件 **#5** `authz.spec.ts` 1 ファイル集約で 9 マトリクス漏れ防止
- 不変条件 **#6** lint test の grep pattern を helper 化（06c の追加でも同 helper で）
- a11y / 無料枠: 共通化により bundle / CI 時間微減（msw / fixture を使い回し、起動コスト削減）

## 12. 完了条件チェック

- [x] Before / After 表 5 軸（file / fixture / helper / brand / coverage exclude）
- [x] 共通化対象 7 items（≥ 6 items）
- [x] 08b と命名整合（§8）

## 13. 次 Phase への引き継ぎ

- 命名規約・共通化配置を Phase 9 lint rule / coverage 設定に反映
- 既存 test の rename は別 PR で段階的に（本 task は spec のみ、rename は実装 PR）
