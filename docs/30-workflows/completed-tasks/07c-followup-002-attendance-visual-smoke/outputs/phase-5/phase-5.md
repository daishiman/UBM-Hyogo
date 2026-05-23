# Phase 5: 実装仕様（CONST_005 充足）

[実装区分: 実装仕様書]

Phase 4 で確定したテスト計画を、コード変更単位に分解した実装仕様。
本 Phase の出力をそのまま Phase 6 → Phase 7 で実装に落とす。

---

## 1. 変更ファイル一覧（path / 種別 / 行影響）

| # | 種別 | パス | 概要 |
|---|------|------|------|
| 1 | new | `apps/web/playwright/fixtures/admin-meetings.ts` | fixture builder + DEFAULT_SEED + 型定義 |
| 2 | edit | `apps/web/playwright/fixtures/auth.ts` | mock state 拡張 + meetings endpoint 4 件 + `/__test__/seed-meetings` 追加 + `MockApi` interface に helper 追加 |
| 3 | edit | `apps/web/playwright/page-objects/AdminMeetingsPage.ts` | list page 用 locator / method 6 件追加 + `expectAlreadyRegistered` 追加 |
| 4 | edit | `apps/web/playwright/tests/attendance.spec.ts` | 4 test に書き換え（TODO 削除） |
| 5 | edit | `apps/web/src/components/admin/MeetingPanel.tsx` | `data-testid` 5 件追加（**UI ロジック不変**） |
| 6 | edit | `apps/web/app/(admin)/admin/meetings/[id]/MeetingAttendancePanel.tsx` | toast `role="status"` 付与確認・必要なら追加（a11y assertion 用） |
| 7 | new | `docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/screenshots/*.png` | AC-1〜4 で 6 枚 |
| 8 | new | `docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/trace/attendance-delete-trace.zip` | AC-4 |
| 9 | new | `outputs/phase-11/phase11-capture-metadata.json` | provenance / capture metadata |
| 10 | new | `outputs/phase-11/screenshot-plan.json` | plan |
| 11 | new | `outputs/phase-11/e2e-run.txt` / `e2e-list.txt` / `e2e-skip-count.txt` / `runner-version.txt` / `verify-design-tokens.txt` | evidence |
| 12 | new | `outputs/phase-11/manual-test-result.md` / `ui-sanity-visual-review.md` | 視覚 / 体験レビュー |

delete: なし。`playwright.config.ts` は attendance evidence mode の timeout を明示する範囲で変更する（実行安定化、UI ロジック不変）。

---

## 2. `AdminMeetingsPage` 拡張メソッド完全シグネチャ

```ts
// apps/web/playwright/page-objects/AdminMeetingsPage.ts
import { type Locator, type Page, expect } from '@playwright/test'
import { BasePage } from './BasePage'

export class AdminMeetingsPage extends BasePage {
  // ----- 既存（保持・変更なし）-----
  readonly attendanceCandidates: Locator
  readonly dupToast: Locator
  constructor(page: Page) { /* ... */ }
  async visit(id?: string): Promise<void>
  async registerAttendance(memberId: string): Promise<void>
  async expectDupToast(): Promise<void>
  async expectDeletedMemberExcluded(deletedMemberId: string): Promise<void>

  // ----- 新規: detail page -----
  /** 登録済み member の register click → toast 表示を assert */
  async expectAlreadyRegistered(memberId: string): Promise<void>

  // ----- 新規: list page (/admin/meetings) -----
  async visitList(): Promise<void>

  listPageSession(sessionId: string): Locator                    // [data-testid="attendance-list-session-${sessionId}"]
  listPageSelect(sessionId: string): Locator                     // [data-testid="attendance-select-${sessionId}"]
  listPageAddButton(sessionId: string): Locator                  // [data-testid="add-attendance-${sessionId}"]
  listPageAttendee(sessionId: string, memberId: string): Locator // [data-testid^="attendance-attendee-"][data-member]
  listPageRemoveButton(sessionId: string, memberId: string): Locator
  listPageToast(): Locator                                       // [data-testid="attendance-toast"]

  /** select で memberId を選び "出席を追加" を click */
  async addAttendanceOnList(sessionId: string, memberId: string): Promise<void>
  /** "削除" button を click し toast が出るまで待機 */
  async removeAttendanceOnList(sessionId: string, memberId: string): Promise<void>
  /** list toast 本文を assert（部分一致） */
  async expectListToast(text: string): Promise<void>
  /** 出席者一覧に memberId が present であるかを count で assert */
  async expectAttendeePresent(sessionId: string, memberId: string, present: boolean): Promise<void>
}
```

selector 文字列（一元定義する static 推奨）:

```ts
const TID = {
  session:   (s: string)            => `[data-testid="attendance-list-session-${s}"]`,
  select:    (s: string)            => `[data-testid="attendance-select-${s}"]`,
  addBtn:    (s: string)            => `[data-testid="add-attendance-${s}"]`,
  attendee:  (s: string, m: string) => `[data-testid="attendance-attendee-${s}"][data-member="${m}"]`,
  removeBtn: (s: string, m: string) => `[data-testid="remove-attendance-${s}"][data-member="${m}"]`,
  toast:                              `[data-testid="attendance-toast"]`,
}
```

---

## 3. spec skeleton（実装直前粒度）

```ts
// apps/web/playwright/tests/attendance.spec.ts
import path from 'node:path'
import { test, expect } from '../fixtures/auth'
import { AdminMeetingsPage } from '../page-objects/AdminMeetingsPage'
import { DEFAULT_SEED } from '../fixtures/admin-meetings'

const EVIDENCE_DIR = path.resolve(
  __dirname,
  '../../../../docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11'
)
const shot = (name: string) => path.join(EVIDENCE_DIR, 'screenshots', `${name}.png`)

test.describe('attendance visual smoke (#313)', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test.beforeEach(async ({ mockApi }) => {
    await mockApi.reset()
    await mockApi.seedMeetings(DEFAULT_SEED)
  })

  test.afterEach(async ({ mockApi }) => {
    await mockApi.reset()
  })

  test('AC-1 detail: 削除済み member は候補に出ない', async ({ adminPage, page }) => {
    const po = new AdminMeetingsPage(page)
    await po.visit('meeting-1')
    await expect(page).toHaveTitle(/.+/)
    await po.expectDeletedMemberExcluded('m-5')
    await expect(po.attendanceCandidates).toHaveCount(3)
    await page.screenshot({ path: shot('attendance-deleted-excluded'), animations: 'disabled' })
  })

  test('AC-2 detail: 登録済み member の重複 register click で toast 表示', async ({ adminPage, page }) => {
    const po = new AdminMeetingsPage(page)
    await po.visit('meeting-1')
    await po.expectAlreadyRegistered('m-1')
    await page.screenshot({ path: shot('attendance-already-registered'), animations: 'disabled' })
  })

  test('AC-3 detail: 連続登録で 409 → toast 表示（連番 screenshot）', async ({ adminPage, page, mockApi }) => {
    await mockApi.setAttendees('sess-1', [])
    const po = new AdminMeetingsPage(page)
    await po.visit('meeting-1')

    await po.registerAttendance('m-2')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: shot('attendance-dup-1'), animations: 'disabled' })

    await po.registerAttendance('m-2')
    await po.expectDupToast()
    await page.screenshot({ path: shot('attendance-dup-2'), animations: 'disabled' })
  })

  test('AC-4 list: delete 後 attendance state が更新される', async ({ adminPage, page }, testInfo) => {
    const po = new AdminMeetingsPage(page)
    await po.visitList()
    await po.expectAttendeePresent('sess-1', 'm-1', true)
    await page.screenshot({ path: shot('attendance-delete-before'), animations: 'disabled' })

    await po.removeAttendanceOnList('sess-1', 'm-1')
    await po.expectListToast('出席を削除しました')
    await po.expectAttendeePresent('sess-1', 'm-1', false)
    await page.screenshot({ path: shot('attendance-delete-after'), animations: 'disabled' })

    // trace は playwright.config.ts trace='retain-on-failure' のため成功時は出力されない
    // → 本 test だけ test.use trace を上書きして取得
    const tracePath = path.join(EVIDENCE_DIR, 'trace', 'attendance-delete-trace.zip')
    await page.context().tracing.stop({ path: tracePath })
    await testInfo.attach('trace', { path: tracePath, contentType: 'application/zip' })
  })
})
```

> trace 取得は spec 冒頭で `await page.context().tracing.start({ screenshots: true, snapshots: true })` を AC-4 用 beforeAll で開始する形にする（実装時に確定）。

---

## 4. mock API 拡張差分

### 4.1 state

```ts
// apps/web/playwright/fixtures/auth.ts に追加
import { DEFAULT_SEED, type MeetingDetail } from './admin-meetings'

type MockMeetingsState = {
  meetings: MeetingDetail[]
  attendees: Map<string, Set<string>>
}
let meetingsState: MockMeetingsState = freshMeetingsState()

function freshMeetingsState(): MockMeetingsState {
  const m = new Map<string, Set<string>>()
  for (const md of DEFAULT_SEED.meetings) {
    for (const s of md.sessions) m.set(s.sessionId, new Set(s.attendees.map(a => a.memberId)))
  }
  return { meetings: structuredClone(DEFAULT_SEED.meetings), attendees: m }
}
```

### 4.2 endpoint 実装擬似コード

```ts
// GET /admin/meetings
{ total: state.meetings.length,
  items: state.meetings.map(m => ({ ...m, sessions: m.sessions.map(withAttendees) })) }

// GET /admin/meetings/:id
const m = state.meetings.find(x => x.id === id) ?? respond(404)
respond(200, { ...m, sessions: m.sessions.map(withAttendees) })

// POST /admin/meetings/:id/attendances  body { memberId }
const set = state.attendees.get(sessionId)!
const cand = session.candidates.find(c => c.memberId === memberId)
if (!cand)             respond(404, { error: 'member_not_found' })
if (cand.isDeleted)    respond(422, { error: 'member_is_deleted' })
if (set.has(memberId)) respond(409, { error: 'attendance_already_recorded' })
set.add(memberId);     respond(200, { ok: true, attended: true })

// POST /admin/meetings/:id/attendances { attended: false }
state.attendees.get(sessionId)?.delete(memberId)
respond(200, { ok: true, attended: false })

// POST /__test__/seed-meetings   body { meetings? }
meetingsState = freshMeetingsState() // または overrides 適用
respond(204)

// POST /__test__/reset
meetingsState = freshMeetingsState()
// + 既存 reset 処理を継続
respond(204)
```

> `withAttendees(s)` は `{ ...s, attendees: [...attendees.get(s.sessionId)].map(memberId => ({ memberId })) }` を返す helper。
> request body shape は既存 contract spec (`apps/api/.../meetings.contract.spec.ts:214`) と一致させる。

### 4.3 `MockApi` interface 追加

```ts
type MockApi = {
  reset(): Promise<void>                                              // 既存
  seedMeetings(seed?: typeof DEFAULT_SEED): Promise<void>             // 新規
  setAttendees(sessionId: string, memberIds: string[]): Promise<void> // 新規
}
```

### 4.4 `MeetingPanel.tsx` への `data-testid` diff（UI ロジック不変）

| 行（概念） | 追加 attribute |
|-----------|----------------|
| session を表す `<article>` / `<section>` | `data-testid={`attendance-list-session-${sessionId}`}` |
| 候補 `<select>` | `data-testid={`attendance-select-${sessionId}`}` |
| 出席者 `<li>` | `data-testid={`attendance-attendee-${sessionId}`} data-member={memberId}` |
| "削除" `<button>` | `data-testid={`remove-attendance-${sessionId}`} data-member={memberId}` |
| toast `<p role="status">` | `data-testid="attendance-toast"`（role 既存維持） |

「出席を追加」ボタン側の `data-testid="add-attendance-${sessionId}"` は既存。

---

## 5. evidence 保存 canonical path（規約）

base: `docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/`

| サブパス | 内容 | provenance |
|----------|------|-----------|
| `screenshots/attendance-deleted-excluded.png` | AC-1 | local-mock |
| `screenshots/attendance-already-registered.png` | AC-2 | local-mock |
| `screenshots/attendance-dup-1.png` | AC-3 #1 | local-mock |
| `screenshots/attendance-dup-2.png` | AC-3 #2 | local-mock |
| `screenshots/attendance-delete-before.png` | AC-4 #1 | local-mock |
| `screenshots/attendance-delete-after.png` | AC-4 #2 | local-mock |
| `trace/attendance-delete-trace.zip` | AC-4 trace | local-mock |
| `phase11-capture-metadata.json` | provenance + viewport + browser + ts | — |
| `screenshot-plan.json` | plan | — |
| `e2e-run.txt` | playwright 実行 log | — |
| `e2e-list.txt` | `playwright test --list` 出力 | — |
| `e2e-skip-count.txt` | skip 集計（= 0） | — |
| `runner-version.txt` | `playwright --version` | — |
| `verify-design-tokens.txt` | token 検証出力 | — |
| `manual-test-result.md` | 実行所見 | — |
| `ui-sanity-visual-review.md` | Apple UI/UX レビュー | — |

命名 invariant: `attendance-*.png` 形式・連番は `-1` / `-2` または `-before` / `-after` のみ。`.log` 禁止（INV-10）。

---

## 6. 1 行実行コマンド

```bash
# spec 単体（local dev・最短）
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  playwright/tests/attendance.spec.ts --project=desktop-chromium

# evidence 取得込み（Phase 11 で実行）
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  playwright/tests/attendance.spec.ts --project=desktop-chromium --trace on \
  2>&1 | tee docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/e2e-run.txt
```

補助コマンド:

```bash
# spec 列挙
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --list \
  > docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/e2e-list.txt

# skip 集計
grep -E "test\.describe\.skip|test\.skip\(true|test\.fixme|TODO\(08b\)" \
  apps/web/playwright/tests/attendance.spec.ts | wc -l \
  > docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/e2e-skip-count.txt

# runner version
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright --version \
  > docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/runner-version.txt

# design tokens
mise exec -- pnpm verify:tokens \
  > docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/verify-design-tokens.txt
```

---

## 7. DoD（Definition of Done）

| # | 条件 | 検証 |
|---|------|------|
| D1 | `attendance.spec.ts` の 4 test が GREEN | `pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/attendance.spec.ts --project=desktop-chromium` |
| D2 | skip / fixme / TODO 不在 | `e2e-skip-count.txt` の中身 = 0 |
| D3 | typecheck green | `mise exec -- pnpm typecheck` |
| D4 | lint green | `mise exec -- pnpm lint` |
| D5 | design tokens PASS | `mise exec -- pnpm verify:tokens` |
| D6 | AC-1〜9 evidence が tracked | `git ls-files outputs/phase-11/` で 全 path 確認 |
| D7 | metadata `provenance: local-mock` | `jq '.provenance' phase11-capture-metadata.json` = `"local-mock"` |
| D8 | visual baseline 不変 | `git status` で `*-snapshots/*.png` に diff なし |
| D9 | coverage（attendance 関連 module） | monocart レポートで `MeetingPanel.tsx` / `MeetingAttendancePanel.tsx` の attendance 関連分岐が踏まれている |
| D10 | CI `playwright-smoke / smoke (chromium)` GREEN | PR Actions log |

---

## 8. 実装順序（依存関係）

1. fixture 型定義 `admin-meetings.ts`（依存なし）
2. mock API endpoint 追加 `auth.ts`（1 に依存）
3. `MeetingPanel.tsx` の `data-testid` 追加（独立）
4. `AdminMeetingsPage` メソッド追加（3 に依存）
5. `attendance.spec.ts` 書き換え（1〜4 すべてに依存）
6. local 実行 → evidence 生成 → Phase 11 ファイル commit

---

## 9. ロールバック

Phase 2 §10 の表をそのまま継承。本 Phase で追加する論点なし。
