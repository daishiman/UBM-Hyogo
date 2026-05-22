# Phase 6: テスト拡充（境界値・異常系・a11y・flaky 対策）

[実装区分: 実装仕様書]

Phase 5 spec に対する境界値 / 異常系 / a11y / flaky 対策を追加する。
本 Phase で追加する観点はすべて **Phase 5 と同一 spec ファイル内** に置き、`test.skip` / `test.fixme` / `it.todo` を残さない（quality-gates §7.3 / INV-04）。

## 0. Close-out reconciliation

実装レビューで、本 Phase の EX-1〜EX-9 は AC-1〜AC-4 の visual smoke を越える拡張候補として書かれており、実装済み close-out gate と混同されていたことを修正した。今回サイクルの完了条件は Phase 11 の 4 focused tests / screenshot 6 枚 / trace / skip 0 / design-token gate とし、EX-1〜EX-9 は必須 evidence から外す。

同時に、実コードとして必要だった欠落は今回サイクル内で修正した:

| 漏れ | 修正 |
| --- | --- |
| `GET /admin/meetings/:id` が Web detail page から呼ばれるが API 本体にない | `apps/api/src/routes/admin/meetings.ts` に detail route を追加し、contract spec を追加 |
| mock の unknown member が 404 にならない | `apps/web/playwright/fixtures/auth.ts` で candidate 不在を `404 member_not_found` に修正 |
| mock の add 成功が実 API と異なる 201 | 実 API と同じ 200 + `{ attended: true }` に修正 |

---

## 1. 追加観点マトリクス

| # | 観点 | 配置 | 形態 |
|---|------|------|------|
| EX-1 | 境界値: candidates が全員 isDeleted のとき空表示 | AC-1 spec 末尾の `await test.step('境界値: 全員 isDeleted', ...)` | 同一 test 内 step |
| EX-2 | 境界値: attendees が空のとき register 1 件目で 200 | AC-3 内 step | 同一 test 内 step |
| EX-3 | 異常系: API 422 (deleted member 強制 POST) で toast | AC-1 spec 末尾の step | 同一 test 内 step |
| EX-4 | 異常系: API 404 (unknown member) で toast | AC-3 spec 末尾の step | 同一 test 内 step |
| EX-5 | 異常系: list page delete 中の連打 (double click) | AC-4 内 step | 同一 test 内 step |
| EX-6 | a11y: toast に `role="status"` / `aria-live` が存在 | 全 4 test の `expect(toast).toHaveAttribute(...)` | inline assertion |
| EX-7 | a11y: candidates panel が `role="list"` を持つ | AC-1 内 inline | inline assertion |
| EX-8 | a11y: register button に accessible name（"出席を登録" 等） | AC-2 内 inline | inline assertion |
| EX-9 | a11y: list page の出席者 `<li>` に `aria-label` で member 名 | AC-4 内 inline | inline assertion |

> いずれも **新規 test の追加ではなく**、既存 4 test の中に `test.step()` で構造化するか inline assertion とする。これにより test 数を 4 件に保ち、CI 実行時間と evidence 連番命名を維持する。

---

## 2. mock fixture 追加分

### 2.1 EX-1 用 seed

```ts
// admin-meetings.ts に追加
export const SEED_ALL_DELETED: { meetings: MeetingDetail[] } = {
  meetings: [{
    id: 'meeting-1',
    sessions: [{
      sessionId: 'sess-1', title: '5月定例会', heldOn: '2026-05-12',
      candidates: [
        { memberId: 'm-1', fullName: '青木 太郎', isDeleted: true },
        { memberId: 'm-2', fullName: '兵庫 花子', isDeleted: true },
      ],
      attendees: [],
    }],
  }],
}
```

### 2.2 EX-4 用 (unknown member)

mock 側で endpoint が自然に 404 を返すため fixture 追加不要。test 内で `await page.request.post(...)` を直接叩いて status 確認 + UI 側で `setToast("出席登録に失敗しました")` を assert。

### 2.3 mockApi helper 追加

```ts
type MockApi = {
  // ...既存...
  /** 直近の POST /attendances レスポンス status を取得（EX-3/EX-4 評価用） */
  lastAttendanceStatus(): Promise<number>
}
```

実装方針: standalone mock 内で `recentAttendanceStatus` 変数を更新し、`GET /__test__/last-attendance-status` を 1 件追加。

---

## 3. flaky 対策（Playwright 規約）

| # | 対策 | 適用箇所 |
|---|------|---------|
| FX-1 | `await page.waitForLoadState('networkidle')` を SSR 後・mock POST 後に挟む | 全 test |
| FX-2 | `page.screenshot({ animations: 'disabled' })` 既定化 | 全 screenshot |
| FX-3 | toast 検証は `await expect(toast).toHaveText(/.+/, { timeout: 3_000 })` で polling | EX-6 / AC-2 / AC-3 |
| FX-4 | mock state は `beforeEach` で `reset()` → `seedMeetings()`、`afterEach` で `reset()` | Phase 5 §3 で確定 |
| FX-5 | trace は AC-4 のみ on（他 test は `retain-on-failure` 既定維持） | AC-4 内で `context.tracing.start/stop` |
| FX-6 | spec 全体 retries: CI 0 / local 0（既定 `playwright.config.ts` 値を継承）。flaky が発覚した場合は CI のみ `retries: 1` を attendance.spec.ts 内 `test.describe.configure({ retries: 1 })` で限定的に設定（Phase 11 結果次第） | spec describe |
| FX-7 | `data-testid` selector を完全一致で取得し、CSS / nth-child 依存を排除 | 全 locator |
| FX-8 | EX-5 連打対策: `await Promise.all([removeBtn.click(), removeBtn.click()])` 後に `await expect(toast).toHaveCount(1)` で **toast 単一化** を assert | EX-5 |

`retries` 追加は **flaky が実測されたときのみ** 行う。Phase 11 で 5 回連続 GREEN を確認できれば retries: 0 を維持。

---

## 4. assertion 追加詳細

| ID | locator / 値 | 期待 |
|----|-------------|------|
| EX-1 | `attendanceCandidates.count()` after `seedMeetings(SEED_ALL_DELETED)` | 0 |
| EX-2 | `setAttendees('sess-1', [])` → register `m-2` → `mockApi.lastAttendanceStatus()` | 200 |
| EX-3 | seed 後 `page.request.post('/admin/meetings/meeting-1/attendances', { data: { memberId: 'm-5' }})` | status 422 |
| EX-4 | 同上 `memberId: 'm-999'` | status 404 |
| EX-5 | remove × 2 連打後 `[data-testid="attendance-toast"]` | count 1 / text "出席を削除しました" |
| EX-6 | `toast.getAttribute('role')` または `aria-live` | `"status"` or `"polite"` |
| EX-7 | candidates 親要素 | `role="list"` または `<ul>` tag |
| EX-8 | register button accessible name | `/出席を登録|登録/` regex match |
| EX-9 | list attendee `<li>` aria-label | member fullName を含む |

---

## 5. test 構造（最終形）

```ts
test('AC-1 detail: 削除済み member は候補に出ない', async ({ page, mockApi }) => {
  await test.step('通常 seed: m-5 のみ除外', async () => { /* AC-1 base */ })
  await test.step('a11y: list role / aria-label', async () => { /* EX-7 */ })
  await test.step('EX-1 境界値: 全員 isDeleted', async () => {
    await mockApi.seedMeetings(SEED_ALL_DELETED)
    await po.visit('meeting-1')
    await expect(po.attendanceCandidates).toHaveCount(0)
  })
  await test.step('EX-3 異常系: deleted member 強制 POST 422', async () => { /* request.post */ })
})

test('AC-2 detail: 登録済み member の重複 register click で toast 表示', async ({...}) => {
  /* base + EX-6 + EX-8 inline */
})

test('AC-3 detail: 連続登録で 409 → toast 表示（連番 screenshot）', async ({...}) => {
  await test.step('1 回目 200', async () => { /* + EX-2 */ })
  await test.step('2 回目 409 → toast', async () => { /* base */ })
  await test.step('EX-4 異常系: unknown member 404', async () => { /* request.post */ })
})

test('AC-4 list: delete 後 attendance state が更新される', async ({...}) => {
  await test.step('delete-before', async () => { /* base */ })
  await test.step('delete-after + EX-5 連打 + EX-9 aria-label', async () => { /* base + EX-5 + EX-9 */ })
})
```

→ test 数は **4 件で固定**、step で構造化することで evidence 連番と CI 時間を維持。

---

## 6. test.skip / fixme 残留禁止チェック

| ファイル | grep 規約 | 期待 |
|---------|-----------|------|
| `apps/web/playwright/tests/attendance.spec.ts` | `grep -E "test\.skip\|test\.fixme\|test\.describe\.skip\|test\.only\|TODO\(08b\)\|it\.todo"` | 0 |
| 同上 | `grep -c "test\.step"` | step 構造化のため複数 hit して可（規制対象外） |

`e2e-skip-count.txt` の最終値が `0` であることを DoD D2 で確認。

---

## 7. coverage 追加要件

EX-1〜9 を踏むことで `MeetingPanel.tsx` / `MeetingAttendancePanel.tsx` の以下分岐を追加カバレッジ:

| ファイル | 追加で踏む分岐 |
|---------|---------------|
| `MeetingAttendancePanel.tsx` | `candidates.length === 0` 表示 / 422 path / 404 path / accessible name |
| `MeetingPanel.tsx` | 連打時の toast singleton 制御 / aria-label 出力 |

→ Phase 5 DoD D9 の `lines.pct >= 80` を満たすマージン確保。

---

## 8. Phase 11 実行手順への影響

Phase 11 で実行する 1 行コマンドは Phase 5 §6 と同一（テスト構造変更なし）。
ただし以下 evidence が追加で必要:

| evidence | path |
|----------|------|
| EX-3 / EX-4 の HTTP status 記録 | `outputs/phase-11/e2e-run.txt` 内の test.step ログに含まれる |
| EX-5 連打結果（toast count=1） | `outputs/phase-11/manual-test-result.md` の所見 |

新規 screenshot 追加なし（base 6 枚で AC-1〜4 を完結）。

---

## 9. Phase 1-3 への feedback

Phase 4 で Phase 2 §8.1 の誤り（`desktop-chromium` project に attendance.spec.ts が含まれるとの記述）を訂正済。本 Phase で追加の不整合発見なし。

> 補足: Phase 3 §4.3 quality-gates §7.1 の充足判定は Phase 5 §6 の 1 行コマンドが `--project=desktop-chromium` であることを前提に再確認済。`desktop-chromium` という名称由来で混同しないよう Phase 12 の compliance check で再点検する。

---

## 10. Phase 7（テスト実装）への引き継ぎ

| # | 引き継ぎ事項 |
|---|--------------|
| 1 | Phase 5 spec skeleton + Phase 6 step 構造 をマージし `attendance.spec.ts` 最終形を作成 |
| 2 | `lastAttendanceStatus()` mock helper の実装を auth.ts に追加 |
| 3 | `SEED_ALL_DELETED` を `admin-meetings.ts` に追加 |
| 4 | flaky 対策 FX-1〜FX-8 をすべて反映 |
| 5 | 実装後 `grep -E "test\.skip\|test\.fixme\|TODO"` で残留 0 を確認 |
| 6 | local 5 回連続 GREEN を確認できなければ Phase 6 §3 FX-6 の `retries: 1` を限定適用 |
