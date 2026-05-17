# Phase 8: リファクタリング

[実装区分: 実装仕様書]

Phase 5-6 実装で生じた重複・selector drift・TODO 残留を解消し、
Phase 9 quality gate と Phase 11 evidence 取得の信頼性を引き上げる。
**新機能追加は行わない**（リファクタのみ）。

## 0. Close-out reconciliation

実装レビューで、`beforeEach` 化、専用 evidence helper、新規 `fixtures/evidence.ts`、selector cheat-sheet などはリファクタ候補であり、今回の AC-1〜AC-4 を成立させる必須実装ではないと整理した。今回サイクルで必須とするリファクタ完了条件は次の 4 点に限定する。

| 条件 | 状態 |
| --- | --- |
| `TODO(08b)` / `test.skip` / `test.fixme` が `attendance.spec.ts` に残らない | Phase 11 `e2e-skip-count.txt = 0` |
| detail / list selector drift を page object に閉じる | `AdminMeetingsPage.ts` に detail/list helper を分離 |
| screenshot path を canonical Phase 11 に出す | `BasePage.ts` / `playwright.config.ts` で実装 |
| mock seed を単一ファイルに集約する | `fixtures/admin-meetings.ts` で実装 |

## 1. リファクタ対象

| # | 対象 | 状態（Phase 6 完了想定時点） | 解消後 |
|---|------|----------------------------|--------|
| RF-1 | `attendance.spec.ts` 内 4 test 間で重複する seed / viewport / login 手順 | 各 test に inline | `test.beforeEach` + fixture 化 |
| RF-2 | viewport ループの inline 記述 | desktop 固定で記述だが将来追加に備え array 化 | `for (const vp of VIEWPORTS)` ではなく **named test** 維持 + viewport constant 抽出 |
| RF-3 | `MeetingAttendancePanel` / `MeetingPanel` で重複する mock seed 投入 | `mockApi.seedMeetings({...})` を spec 内で個別組立 | `apps/web/playwright/fixtures/admin-meetings.ts` に scenario builder 集約 |
| RF-4 | page object メソッドの selector 重複 | detail / list で似た selector | base selector helper を private method に集約 |
| RF-5 | `TODO(08b)` コメント | コードコメントとして残置可能性あり | 完全削除（INV-04） |
| RF-6 | selector drift（detail page vs list page） | Phase 5 で初期解消。Phase 8 で最終形固定 | `selector cheat-sheet` を page object header コメントに固定 |
| RF-7 | screenshot capture 経路の重複 | 各 test で `page.screenshot({ path: ... })` を inline | `attachEvidence(testInfo, ac, name)` helper に集約 |

## 2. fixture / helper への切り出し方針

### 2.1 `apps/web/playwright/fixtures/admin-meetings.ts`（Phase 5 で new）

Phase 8 で以下 export を追加してリファクタ完了形に揃える:

```ts
// Phase 5 から継続（既出）
export function buildMeetingsList(overrides?): MeetingsListView
export function buildMeetingDetail(overrides?): MeetingDetail
export function buildCandidate(overrides?): Candidate
export const DEFAULT_SEED

// Phase 8 で新規追加（scenario builder）
export const SCENARIO = {
  deletedMemberExcluded: () => DEFAULT_SEED, // m-5 deleted
  alreadyRegistered:    () => withAttendees(['m-1']),
  duplicateAdd:         () => DEFAULT_SEED,  // attendees 空、test 内で 2 連打
  deleteFlow:           () => withAttendees(['m-1','m-2']),
}

function withAttendees(memberIds: string[]): Seed { /* DEFAULT_SEED の attendees 上書き */ }
```

spec 側からは `await mockApi.seedMeetings(SCENARIO.alreadyRegistered())` の 1 行で済むようにする。

### 2.2 `apps/web/playwright/fixtures/evidence.ts`（**新規**）

screenshot / trace の保存パス組立を集約する。RF-7 解消用。

```ts
// 新規ファイル：apps/web/playwright/fixtures/evidence.ts
import type { TestInfo, Page } from '@playwright/test'
import * as path from 'node:path'

const ROOT = 'docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11'

export async function captureEvidence(
  page: Page,
  testInfo: TestInfo,
  filename: string,           // 'attendance-deleted-excluded.png'
  options?: { fullPage?: boolean }
): Promise<string> {
  const dest = path.join(ROOT, 'screenshots', filename)
  await page.screenshot({ path: dest, fullPage: options?.fullPage ?? false })
  await testInfo.attach(filename, { path: dest, contentType: 'image/png' })
  return dest
}

export function evidencePath(...segments: string[]): string {
  return path.join(ROOT, ...segments)
}
```

> spec ファイルから直接 `outputs/phase-11/...` を string で組み立てる箇所は禁止。`evidencePath()` 経由に統一する（Phase 9 lint で grep gate）。

### 2.3 `apps/web/playwright/fixtures/auth.ts`（既存・Phase 5 で拡張済み）

Phase 8 では以下のみ変更:

| 変更 | 理由 |
|------|------|
| `seedMeetings` helper の return 型を `MockApi` の他 helper と命名整合（`Promise<void>`） | 一貫性 |
| 内部の `/__test__/seed-meetings` 呼び出し URL を constant 化 | endpoint string 重複削減 |

新規 mock endpoint 追加は **行わない**（リファクタのみ・INV-08 / Phase 2 §5 範囲固定）。

### 2.4 page object 最終形（`AdminMeetingsPage.ts`）

Phase 5 で追加された method を以下のレイアウトで整理（実装そのものは Phase 5 で既に完了想定、Phase 8 は **並び順とコメントの整列のみ**）:

```ts
/**
 * AdminMeetingsPage
 *
 * Selector cheat-sheet:
 * ┌──────────────────────────┬────────────────────────────────────────────────┐
 * │ scope                    │ selector                                       │
 * ├──────────────────────────┼────────────────────────────────────────────────┤
 * │ detail (/admin/meetings/[id])                                              │
 * │   候補 button             │ [data-testid="attendance-candidate"][data-member]│
 * │   登録 button             │ [data-testid="attendance-register"][data-member]│
 * │   toast                   │ [data-testid="toast"][role="status"]            │
 * ├──────────────────────────┼────────────────────────────────────────────────┤
 * │ list (/admin/meetings)                                                     │
 * │   session 単位            │ [data-testid="attendance-list-session-<id>"]    │
 * │   select                  │ [data-testid="attendance-select-<id>"]          │
 * │   add button              │ [data-testid="add-attendance-<id>"]             │
 * │   attendee 行             │ [data-testid="attendance-attendee-<id>"][data-member]│
 * │   delete button           │ [data-testid="remove-attendance-<id>"][data-member]│
 * │   toast                   │ [data-testid="attendance-toast"]                │
 * └──────────────────────────┴────────────────────────────────────────────────┘
 */
export class AdminMeetingsPage extends BasePage {
  // ── detail ──
  // ── list ──
  // ── private helpers ──
}
```

private helper 例（重複圧縮）:

```ts
private listSession(sessionId: string): Locator {
  return this.page.locator(`[data-testid="attendance-list-session-${sessionId}"]`)
}
private listAttendee(sessionId: string, memberId: string): Locator {
  return this.listSession(sessionId).locator(
    `[data-testid="attendance-attendee-${sessionId}"][data-member="${memberId}"]`
  )
}
```

`listPageSelectOption` / `addAttendanceOnList` / `removeAttendanceOnList` / `expectAttendeePresent` はすべてこの private helper を使う形に書き換える。

## 3. attendance.spec.ts の TODO(08b) 完全解消手順

### 3.1 検出

```bash
grep -nE 'TODO\(08b\)|test\.skip|test\.fixme|test\.describe\.skip|it\.todo' \
  apps/web/playwright/tests/attendance.spec.ts \
  > docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/e2e-skip-count.txt
wc -l < docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/e2e-skip-count.txt
# 0 を期待
```

### 3.2 削除対象

| 行 | 内容 | 対応 |
|----|------|------|
| spec 冒頭付近の `// TODO(08b): ...` block | 旧コメント | 行削除 |
| 既存の skip / fixme | 存在しないはず（Phase 5 完了想定） | 念のため検出 |
| 「Phase 11 manual smoke で活性化」文言 | description 内に残置の可能性 | spec description 書き換え |

### 3.3 spec 構造の最終形

Phase 2 §4 + Phase 8 fixture 化を反映した最終形:

```ts
import { test, expect } from '../fixtures/auth'
import { AdminMeetingsPage } from '../page-objects/AdminMeetingsPage'
import { SCENARIO } from '../fixtures/admin-meetings'
import { captureEvidence, evidencePath } from '../fixtures/evidence'

const DESKTOP = { width: 1280, height: 800 } as const

test.describe('attendance visual smoke (#313)', () => {
  test.use({ viewport: DESKTOP })

  test.beforeEach(async ({ mockApi }) => {
    await mockApi.reset()
  })

  test('detail: 削除済み member は候補に出ない', async ({ adminPage, mockApi }, testInfo) => {
    await mockApi.seedMeetings(SCENARIO.deletedMemberExcluded())
    const page = new AdminMeetingsPage(adminPage)
    await page.visit('sess-1')
    await page.expectDeletedMemberExcluded('m-5')
    await captureEvidence(adminPage, testInfo, 'attendance-deleted-excluded.png')
  })

  test('detail: 登録済み member は重複 click で toast 表示', async ({ adminPage, mockApi }, testInfo) => {
    await mockApi.seedMeetings(SCENARIO.alreadyRegistered())
    const page = new AdminMeetingsPage(adminPage)
    await page.visit('sess-1')
    await page.expectAlreadyRegistered('m-1')
    await captureEvidence(adminPage, testInfo, 'attendance-already-registered.png')
  })

  test('detail: 同一 member 連続登録で 409 → toast 表示（連番 screenshot）', async ({ adminPage, mockApi }, testInfo) => {
    await mockApi.seedMeetings(SCENARIO.duplicateAdd())
    const page = new AdminMeetingsPage(adminPage)
    await page.visit('sess-1')
    await page.registerAttendance('m-2')
    await captureEvidence(adminPage, testInfo, 'attendance-dup-1.png')
    await page.registerAttendance('m-2')      // 2 回目 → 409
    await page.expectDupToast()
    await captureEvidence(adminPage, testInfo, 'attendance-dup-2.png')
  })

  test('list: delete 後 attendance state が更新される（trace + 連番）', async ({ adminPage, mockApi }, testInfo) => {
    testInfo.attachments  // trace は project config で `on`
    await mockApi.seedMeetings(SCENARIO.deleteFlow())
    const page = new AdminMeetingsPage(adminPage)
    await page.visit()                                  // list page
    await page.expectAttendeePresent('sess-1', 'm-2', true)
    await captureEvidence(adminPage, testInfo, 'attendance-delete-before.png')
    await page.removeAttendanceOnList('sess-1', 'm-2')
    await page.expectListToast('出席を削除しました')
    await page.expectAttendeePresent('sess-1', 'm-2', false)
    await captureEvidence(adminPage, testInfo, 'attendance-delete-after.png')
  })
})
```

> 上記 spec body は Phase 5 で書く実装の **リファクタ後 target**。Phase 8 担当は Phase 5 で書かれた spec をこの最終形に揃える diff のみを行う。

### 3.4 trace 取得（AC-4）

`playwright.config.ts` 側で attendance.spec.ts に対する trace を `on` 化する project override は Phase 5 で実装済み想定。Phase 8 では以下を確認のみ:

```ts
// playwright.config.ts （Phase 5 で追加済み想定・Phase 8 で改変しない）
{
  name: 'desktop-chromium',
  use: { trace: 'on' },
  // ※ attendance.spec.ts のみ全 test trace=on にしたい場合は
  // test 内で testInfo.attach('trace', ...) で個別添付
}
```

trace zip の最終保存:

```bash
# Phase 11 で実行
cp apps/web/test-results/**/trace.zip \
   docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/trace/attendance-delete-trace.zip
```

## 4. selector drift 統一の最終形

### 4.1 確定マッピング

| AC | 操作対象 page | 採用 selector |
|----|--------------|---------------|
| AC-1 | detail | `[data-testid="attendance-candidate"]` の filter |
| AC-2 | detail | `[data-testid="attendance-register"][data-member="m-1"]` |
| AC-3 | detail | 同上 + `[data-testid="toast"]` |
| AC-4 | **list** | `[data-testid="attendance-attendee-sess-1"][data-member="m-2"]` + `[data-testid="remove-attendance-sess-1"][data-member="m-2"]` + `[data-testid="attendance-toast"]` |

### 4.2 drift 検証

`grep` ベースで「未統一 selector」が残っていないか Phase 9 で gate（quality gates 参照）:

```bash
# detail / list で selector が混線していないかの自己検証
grep -nE 'attendance-(candidate|register|attendee|select|toast)' \
  apps/web/playwright/{tests,page-objects,fixtures}/**/*.ts
```

期待: 出現箇所がすべて Phase 8 §2.4 cheat-sheet と一致。

## 5. 静的検査（リファクタ起因の regression 防止）

### 5.1 必須コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  playwright/tests/attendance.spec.ts --project=desktop-chromium --list
```

### 5.2 視覚 regression（baseline 影響）

`data-testid` 追加のみで視覚に影響しない設計（Phase 2 §3 / Phase 3 R-1）。
Phase 8 完了時点で以下を 1 度だけ実行し、diff=0 を確認:

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test --project=visual-desktop --grep '@admin-meetings'
```

diff が発生したら `--update-snapshots` を Phase 8 では実行しない（INV-06 user gate）。差分内容を `outputs/phase-11/visual-diff-note.md` に記録して Phase 9 で user 判断を仰ぐ。

## 6. リファクタ完了後の DoD

| # | 条件 | 検証 |
|---|------|------|
| 1 | `TODO(08b)` / `test.skip` / `test.fixme` / `it.todo` = 0 | §3.1 grep |
| 2 | `evidencePath` / `captureEvidence` 経由でない `outputs/phase-11` string が spec 内に存在しない | §2.2 |
| 3 | scenario builder (`SCENARIO`) が 4 test 全てで使われている | spec 目視 |
| 4 | page object cheat-sheet コメントが selector 一覧と一致 | §2.4 |
| 5 | typecheck / lint green | §5.1 |
| 6 | visual baseline diff = 0（or user-approved） | §5.2 |
| 7 | spec test 数 = 4（増減なし） | `playwright test --list` |

## 7. アンチパターン（本 Phase で禁止する変更）

| 禁止事項 | 理由 |
|----------|------|
| 新規 mock endpoint 追加 | Phase 2 §5 範囲固定 |
| 新規 `*.spec.ts` 作成 | 本サイクルの spec は `attendance.spec.ts` 1 本（INV-05 + Phase 2 §2） |
| `page.route()` の追加 | INV-08（standalone mock single source） |
| baseline 画像更新 | INV-06 user gate |
| design token / 色 / spacing の変更 | INV-03 |
| `apps/api` 側コード変更 | INV-01 |

## 8. Phase 9 への申し送り

- §4.2 / §5.2 の grep / visual 自己検証は Phase 9 quality gate にそのまま転用可能
- §2.2 で新規作成する `evidence.ts` は他タスク（08b / 09a）でも再利用可能性あり。本タスク完了後に共通 path（`apps/web/playwright/fixtures/`）配置を維持し、移設は不要
- coverage 計測（Phase 7）の reporter 設定が肥大化した場合は `playwright/config/reporters.ts` への分離を本 Phase 範囲で実施するか、Phase 9 後の改善 ticket に切り出すかを実装時に判断
