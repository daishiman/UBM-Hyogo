# Phase 2: 設計

[実装区分: 実装仕様書]

Phase 1 の D-1〜D-5 を確定し、実装可能粒度（CONST_005）でファイル一覧・関数シグネチャ・
テスト・コマンド・DoD を全て揃える。

## 1. 設計判断の確定

| ID | 確定方針 |
|----|----------|
| D-1 | AC-4 (delete flow visual) は **list page (`/admin/meetings`)** で取得する。detail page (`/admin/meetings/[id]`) には delete ボタンを追加しない。理由: 既存 `MeetingPanel.tsx` に `onRemove` + "削除" button が既に存在し、追加実装不要のため。 |
| D-2 | fixture builder `apps/web/playwright/fixtures/admin-meetings.ts` を新設し、`buildMeetingsList` / `buildMeetingDetail` / `buildCandidate` の 3 関数を export。 |
| D-3 | standalone mock に `attendanceState: Record<sessionId, Set<memberId>>` を持ち、POST 2 回目は 409。POST `{ attended: false }` 後 set から remove。`/__test__/seed-meetings` HTTP control endpoint で test 側から seed を上書き可能にする。 |
| D-4 | list page CSR 楽観更新で撮影する。`router.refresh()` を待つ必要なし。 |
| D-5 | visual baseline には組み込まない。`outputs/phase-11/screenshots/` に evidence 専用保存。 |

## 2. 変更対象ファイル一覧（完全列挙）

| 種別 | パス | 目的 |
|------|------|------|
| edit | `apps/web/playwright/tests/attendance.spec.ts` | TODO 削除・spec 4 件に拡張 |
| edit | `apps/web/playwright/page-objects/AdminMeetingsPage.ts` | list page 用 locator/method 追加 |
| edit | `apps/web/playwright/fixtures/auth.ts` | meetings endpoint + attendance POST attended=true/false + control endpoint 追加 |
| new | `apps/web/playwright/fixtures/admin-meetings.ts` | fixture builder |
| edit | `apps/web/src/components/admin/MeetingPanel.tsx` | `data-testid` 付与（**UI ロジック変更なし**、selector 安定化のみ） |
| new | `docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/screenshots/` | screenshot 保存先 |
| new | `docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/phase11-capture-metadata.json` | provenance / capture metadata |
| new | `docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/screenshot-plan.json` | screenshot 計画 |
| new | `docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/e2e-run.txt` | 実行ログ |
| new | `docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/e2e-list.txt` | spec 列挙 |
| new | `docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/e2e-skip-count.txt` | skip 集計 0 |
| new | `docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/runner-version.txt` | playwright version |
| new | `docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/verify-design-tokens.txt` | token 検証ログ |
| new | `docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/manual-test-result.md` | 視覚レビュー（Apple UI/UX 観点） |
| new | `docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/ui-sanity-visual-review.md` | sanity 所見 |
| new | `docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/trace/attendance-delete-trace.zip` | Playwright trace（AC-4） |

delete されるファイルはなし。

## 3. 新規 / 拡張する page object メソッドのシグネチャ

```ts
// apps/web/playwright/page-objects/AdminMeetingsPage.ts
export class AdminMeetingsPage extends BasePage {
  // ===== detail page (/admin/meetings/[id]) — 既存 =====
  readonly attendanceCandidates: Locator
  readonly dupToast: Locator
  visit(id?: string): Promise<void>
  registerAttendance(memberId: string): Promise<void>
  expectDupToast(): Promise<void>
  expectDeletedMemberExcluded(deletedMemberId: string): Promise<void>

  // ===== detail page — 新規 =====
  /** 登録済み member の register button が disabled 状態 or click 後 toast 表示を assert */
  expectAlreadyRegistered(memberId: string): Promise<void>

  // ===== list page (/admin/meetings) — 新規 =====
  /** list page の指定 session 内で候補 select に option を持つか */
  listPageSelectOption(sessionId: string, memberId: string): Locator
  /** list page で attendance を追加（select → "出席を追加" click） */
  addAttendanceOnList(sessionId: string, memberId: string): Promise<void>
  /** list page で出席者を削除（"削除" button click） */
  removeAttendanceOnList(sessionId: string, memberId: string): Promise<void>
  /** list page で attendance toast の本文を assert */
  expectListToast(text: string): Promise<void>
  /** list page で 出席者一覧に memberId が存在するか（count 検証） */
  expectAttendeePresent(sessionId: string, memberId: string, present: boolean): Promise<void>
}
```

selector 規約（`MeetingPanel.tsx` 側に追加する `data-testid`）:

| selector | 既存 / 新規 | 場所 |
|----------|------------|------|
| `[data-testid="attendance-list-session-${sessionId}"]` | 新規 | `MeetingPanel` の `<article>` 単位 |
| `[data-testid="attendance-select-${sessionId}"]` | 新規 | `<select>` |
| `[data-testid="add-attendance-${sessionId}"]` | **既存** | "出席を追加" `<button>` |
| `[data-testid="attendance-attendee-${sessionId}"]` | 新規 | 出席者 `<li>` に `data-member` 付き |
| `[data-testid="remove-attendance-${sessionId}"]` | 新規 | "削除" `<button>` に `data-member` 付き |
| `[data-testid="attendance-toast"]` | 新規 | `<p role="status">` に追加 |

> UI ロジック変更ではなく、`data-testid` 追加のみ。視覚に影響しないため `verify-design-tokens` / baseline には影響しない。

## 4. 新規 spec ファイル / test 名

`apps/web/playwright/tests/attendance.spec.ts` を以下構成に書き換える。

```ts
import { test, expect } from '../fixtures/auth'
import { AdminMeetingsPage } from '../page-objects/AdminMeetingsPage'

test.describe('attendance visual smoke (#313)', () => {
  test.use({ viewport: { width: 1280, height: 800 } }) // desktop 既定

  // AC-1
  test('detail: 削除済み member は候補に出ない', async ({ adminPage, mockApi }) => { ... })

  // AC-2
  test('detail: 登録済み member は重複 click で toast 表示', async ({ adminPage, mockApi }) => { ... })

  // AC-3
  test('detail: 同一 member 連続登録で 409 → toast 表示（連番 screenshot）', async ({ adminPage, mockApi }) => { ... })

  // AC-4
  test('list: delete 後 attendance state が更新される（trace + 連番）', async ({ adminPage, mockApi }, testInfo) => {
    // testInfo.attach('trace', ...) で trace を AC-4 evidence へ
  })
})
```

すべて `--project=desktop-chromium` で実行。`test.describe.skip` / `test.skip` / `test.fixme` 不使用。

### viewport

- desktop (1280x800) を既定とする（既存 visual project と整合）
- mobile / tablet は本タスクでは対象外（baseline 不追加、INV-06）

## 5. mock API 拡張仕様

`apps/web/playwright/fixtures/auth.ts` の `ensureMockApi()` に以下を追加。

### 5.1 state 追加

```ts
type MockAttendanceState = {
  meetings: MeetingDetail[]               // seed 可
  attendees: Record<string, Set<string>>   // sessionId -> memberIds
  deletedMembers: Set<string>              // isDeleted=true で candidates から除外
}
```

### 5.2 endpoint 追加

| METHOD | PATH | 返却 |
|--------|------|------|
| GET | `/admin/meetings` | `{ total, items }` (list view、attendance を同梱) |
| GET | `/admin/meetings/:id` | `MeetingDetail`（candidates / attendees） |
| GET | `/admin/meetings/:id` | detail page 用 `sessionId/title/heldOn/candidates/attendees` を返す。unknown / soft-deleted meeting は 404 |
| POST | `/admin/meetings/:id/attendances` body `{ memberId, attended: true }` | 200 / 409 (already) / 422 (deleted member) / 404 (unknown) |
| POST | `/admin/meetings/:id/attendances` with `{ attended: false }` | 200 |
| POST | `/__test__/seed-meetings` | mock state を fixture data で上書き |
| POST | `/__test__/reset` | state リセット（既存に attendance 領域を追加） |

### 5.3 default seed

```ts
// apps/web/playwright/fixtures/admin-meetings.ts
export function buildMeetingsList(): MeetingsListView { ... }
export function buildMeetingDetail(overrides?: Partial<MeetingDetail>): MeetingDetail { ... }
export const DEFAULT_SEED = {
  meetings: [
    { sessionId: 'sess-1', title: '5月定例会', heldOn: '2026-05-12',
      candidates: [
        { memberId: 'm-1', fullName: '青木 太郎' },
        { memberId: 'm-2', fullName: '兵庫 花子' },
        { memberId: 'm-5', fullName: '削除 済太', isDeleted: true },
      ],
      attendees: [{ memberId: 'm-1' }], // m-1 は既登録
    },
  ],
}
```

### 5.4 mockApi 拡張 helper（test から呼ぶ）

```ts
type MockApi = {
  // ...既存...
  seedMeetings: (seed?: Partial<typeof DEFAULT_SEED>) => Promise<void>
  /** test 内で attendees を直接書き換えたい場合 */
  setAttendees: (sessionId: string, memberIds: string[]) => Promise<void>
}
```

## 6. evidence 保存戦略

### 6.1 canonical path

`docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/`

| サブパス | 内容 |
|----------|------|
| `screenshots/attendance-deleted-excluded.png` | AC-1 |
| `screenshots/attendance-already-registered.png` | AC-2 |
| `screenshots/attendance-dup-1.png` / `attendance-dup-2.png` | AC-3 連番 |
| `screenshots/attendance-delete-before.png` / `attendance-delete-after.png` | AC-4 連番 |
| `trace/attendance-delete-trace.zip` | AC-4 trace |
| `screenshot-plan.json` | capture 計画 |
| `phase11-capture-metadata.json` | provenance / browser / viewport / timestamp |
| `e2e-run.txt` | `pnpm exec playwright test ... 2>&1 \| tee` の出力 |
| `e2e-list.txt` | `playwright test --list` の出力 |
| `e2e-skip-count.txt` | `grep -c "test.skip\|test.fixme" attendance.spec.ts` |
| `runner-version.txt` | `pnpm --filter @ubm-hyogo/web exec playwright --version` |
| `verify-design-tokens.txt` | `pnpm verify:tokens` |
| `manual-test-result.md` | テスト実行所見 |
| `ui-sanity-visual-review.md` | Apple UI/UX 観点レビュー |

### 6.2 screenshot capture 経路

- Playwright spec 内で `await testInfo.attach('screenshot', { path, contentType: 'image/png' })` または `page.screenshot({ path: <canonical> })` で直接 evidence path に保存
- `PLAYWRIGHT_EVIDENCE_TASK=07c-followup-002` を spec 内で参照し、絶対パス組立て
- mask: ヘッダの session id / timestamp 等は固定 seed 値なのでマスク不要

### 6.3 metadata schema (`phase11-capture-metadata.json`)

```json
{
  "task_id": "07c-followup-002-attendance-visual-smoke",
  "issue_number": 313,
  "provenance": "local-mock",
  "browser": "chromium",
  "viewport": { "width": 1280, "height": 800 },
  "captured_at": "2026-05-15T00:00:00Z",
  "spec": "apps/web/playwright/tests/attendance.spec.ts",
  "mock_api_base": "http://127.0.0.1:8787",
  "screenshots": [
    { "ac": "AC-1", "file": "screenshots/attendance-deleted-excluded.png", "note": "削除済み member m-5 が候補から除外" },
    { "ac": "AC-2", "file": "screenshots/attendance-already-registered.png", "note": "m-1 既登録で重複 click → toast" },
    { "ac": "AC-3", "file": "screenshots/attendance-dup-1.png", "note": "1 回目 register 成功" },
    { "ac": "AC-3", "file": "screenshots/attendance-dup-2.png", "note": "2 回目 → 409 toast" },
    { "ac": "AC-4", "file": "screenshots/attendance-delete-before.png", "note": "list page m-2 登録済" },
    { "ac": "AC-4", "file": "screenshots/attendance-delete-after.png", "note": "削除後 m-2 が attendees から消失" }
  ],
  "staging_replacement_plan": {
    "unassigned_task": "09a staging smoke で fresh evidence へ差し替え",
    "owner": "task-09a-staging-deploy-smoke"
  }
}
```

## 7. 1 行実行コマンド（quality-gates §7.1）

```bash
# 該当 spec 単体実行（local dev）
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/attendance.spec.ts --project=desktop-chromium

# evidence 取得込みの完全実行
PLAYWRIGHT_EVIDENCE_TASK=07c-followup-002 \
  mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/attendance.spec.ts --project=desktop-chromium --trace on \
  2>&1 | tee docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/e2e-run.txt
```

### 実行前提（pre-requisite）

| 条件 | 自動化 path |
|------|------------|
| Node 24 / pnpm 10 | `mise exec --` （`.mise.toml`） |
| chromium binary | `pnpm --filter @ubm-hyogo/web exec playwright install --with-deps chromium`（CI: `playwright-smoke.yml` 既存 step） |
| dev server | `apps/web/playwright.config.ts#webServer`（既存設定） |
| standalone mock | `auth.ts` fixture の `ensureMockApi()` が自動起動 |
| auth cookie | `adminPage` fixture が `adminContext` から自動付与 |

## 8. CI workflow への配線方針

### 8.1 focused smoke step を追加

`.github/workflows/playwright-smoke.yml` に attendance visual smoke 専用 step を追加する。理由:

- `attendance.spec.ts` は evidence path と `PLAYWRIGHT_EVIDENCE_TASK=07c-followup-002` に依存するため、既存 19-route smoke とは独立して実行条件を明示する
- 対象を `playwright/tests/attendance.spec.ts --project=desktop-chromium --trace on` に固定し、Phase 11 evidence と CI 実行内容を一致させる

### 8.2 path-filter 確認

`paths:` に `apps/web/**` が既に含まれているため、`attendance.spec.ts` / `MeetingPanel.tsx` の変更で trigger される。追加変更不要。

### 8.3 artifact upload

新 evidence は `outputs/phase-11/` 配下に tracked file として管理する。CI artifact (`playwright-smoke-report`) は diagnostic、canonical は tracked path。

### 8.4 確認手順（Phase 11 で実施）

1. `pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/attendance.spec.ts --project=desktop-chromium --list` で 4 test を確認 → `e2e-list.txt`
2. PR 作成後、追加された focused smoke step の GitHub Actions 結果を `manual-test-result.md` に追記する（本ワークツリーでは user-gated）

## 9. DoD（Definition of Done）

| 区分 | 条件 | 検証コマンド |
|------|------|-------------|
| spec | `attendance.spec.ts` の 4 test が GREEN | `pnpm --filter @ubm-hyogo/web exec playwright test playwright/tests/attendance.spec.ts --project=desktop-chromium` |
| skip 0 | `TODO(08b)` / `test.skip` / `test.fixme` 不在 | `grep -E "TODO\(08b\)\|test\.describe\.skip\|test\.skip\(true\|test\.fixme" apps/web/playwright/tests/attendance.spec.ts \| wc -l` = 0 |
| typecheck | tsc green | `mise exec -- pnpm typecheck` |
| lint | lint green | `mise exec -- pnpm lint` |
| design tokens | HEX 直書き不在 | `mise exec -- pnpm verify:tokens` |
| evidence | AC-1〜AC-9 すべてが tracked file で証明 | `git ls-files docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/` |
| coverage（E2E） | 任意診断。本タスクの必須 close-out gate ではない | `pnpm --filter @ubm-hyogo/web exec playwright test ... --reporter=monocart` で `coverage-summary.json` |
| CI | focused attendance smoke step が workflow に配線済み。PR 上の green は user-gated | GH Actions run |

> coverage 対象は `MeetingAttendancePanel.tsx` と `MeetingPanel.tsx` の attendance 関連 branch。coverage は任意診断であり、必須 evidence は focused Playwright 4 test / screenshot 6 枚 / trace / skip 0 / design token 検証。

## 10. ロールバック計画

| 失敗ケース | ロールバック |
|------------|-------------|
| spec が CI で flaky | `attendance.spec.ts` のみ revert（mock fixture は保持） |
| mock endpoint が他 spec を壊す | `auth.ts` の attendance 追加分のみ revert |
| `MeetingPanel.tsx` の `data-testid` 追加が visual baseline diff を発生させる | focused screenshot と `pnpm verify:tokens` で確認。万一 baseline 更新が必要な場合は user gate で `--update-snapshots` を明示承認後に実行 |
