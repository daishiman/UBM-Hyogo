# Phase 4: 詳細設計 / テスト計画

[実装区分: 実装仕様書]

Phase 3 で残った F-1〜F-5 を解決した上で、Phase 5（実装仕様）に直接落とし込めるレベルで
テスト計画（spec / test data / assertion / viewport / flaky 対策）を完成させる。

---

## 1. Phase 3 F-1〜F-5 の解決

| ID | 指摘 | Phase 4 解決 |
|----|------|--------------|
| F-1 | `INTERNAL_API_BASE_URL` 経路 | `apps/web/playwright.config.ts:74` で `webServer.env.INTERNAL_API_BASE_URL=http://127.0.0.1:8787` が既設定。`apps/web/src/lib/admin/server-fetch.ts:15` で `process.env.INTERNAL_API_BASE_URL` を読み取る実装。**追加変更不要** |
| F-2 | 他 spec への影響範囲 | `git grep -l "/admin/meetings" apps/web/playwright/tests/` → `admin-pages.spec.ts` / `full-smoke.spec.ts` の 2 件。両 spec は SSR ナビゲーション目的で attendance state を mutate しないため、本タスクで追加する mock state を **test 毎に `mockApi.reset()` で初期化** する運用で衝突回避 |
| F-3 | `attendance.spec.ts` の現状 CI 挙動 | `playwright.config.ts:140` の `desktop-chromium` project が `testIgnore` で `full-smoke` / `visual` のみ除外しているため、**`attendance.spec.ts` は `desktop-chromium` project で実行されている**。`desktop-chromium` project (testMatch=`full-smoke.spec.ts$`) には含まれない。Phase 2 §8.1 の「`pnpm e2e:smoke` が attendance を拾う」記述は **誤り**。Phase 5 で `1 行実行コマンド` と CI gate 対応を `--project=desktop-chromium` に正す |
| F-4 | `staging_replacement_plan.owner` fixed | 09a staging smoke task owner は `"task-09a-staging-deploy-smoke"` として `phase11-capture-metadata.json` に固定 |
| F-5 | coverage 計測手段 | `apps/web/package.json:53,58` で `c8` / `monocart-reporter` 導入済、`playwright.config.ts:113-127` で v8 + lcov 出力設定済。**追加導入不要**。本タスクの DoD §9 coverage は既存 reporter 経路で自動収集される |

→ いずれも config 追加なしで Phase 5 実装に進める。**Phase 5 で 1 行実行コマンドの project 名のみ訂正**する。

---

## 2. テスト計画

### 2.1 spec ファイル一覧

| 種別 | パス | test 数 | project |
|------|------|--------|---------|
| edit | `apps/web/playwright/tests/attendance.spec.ts` | 4 | `desktop-chromium` |

新規 spec ファイルは追加しない。既存 1 ファイルを書き換える。

### 2.2 test 名（最終）

```ts
test.describe('attendance visual smoke (#313)', () => {
  test('AC-1 detail: 削除済み member は候補に出ない', ...)
  test('AC-2 detail: 登録済み member の重複 register click で toast 表示', ...)
  test('AC-3 detail: 連続登録で 409 → toast 表示（連番 screenshot）', ...)
  test('AC-4 list: delete 後 attendance state が更新される（trace + 連番）', ...)
})
```

> `test.describe.skip` / `test.skip` / `test.fixme` / `test.only` / `TODO(...)` のいずれも使用禁止（INV-04 / quality-gates §7.3）。

### 2.3 test data fixtures

新規 `apps/web/playwright/fixtures/admin-meetings.ts`:

```ts
export type Candidate = { memberId: string; fullName: string; isDeleted?: boolean }
export type Attendee = { memberId: string }
export type Session = {
  sessionId: string
  title: string
  heldOn: string
  candidates: Candidate[]
  attendees: Attendee[]
}
export type MeetingDetail = { id: string; sessions: Session[] }
export type MeetingsListView = { total: number; items: MeetingDetail[] }

export const DEFAULT_SEED: { meetings: MeetingDetail[] } = {
  meetings: [
    {
      id: 'meeting-1',
      sessions: [
        {
          sessionId: 'sess-1',
          title: '5月定例会',
          heldOn: '2026-05-12',
          candidates: [
            { memberId: 'm-1', fullName: '青木 太郎' },
            { memberId: 'm-2', fullName: '兵庫 花子' },
            { memberId: 'm-3', fullName: '神戸 次郎' },
            { memberId: 'm-5', fullName: '削除 済太', isDeleted: true },
          ],
          attendees: [{ memberId: 'm-1' }],
        },
      ],
    },
  ],
}

export function buildMeetingDetail(overrides: Partial<MeetingDetail> = {}): MeetingDetail
export function buildMeetingsList(overrides: Partial<MeetingsListView> = {}): MeetingsListView
export function buildCandidate(overrides: Partial<Candidate> = {}): Candidate
```

mock state shape:

```ts
type MockMeetingsState = {
  meetings: MeetingDetail[]
  attendees: Map<string /* sessionId */, Set<string /* memberId */>>
}
```

### 2.4 assertion 一覧（test 毎）

| test | assertion | 期待値 |
|------|-----------|--------|
| AC-1 | `page.locator('[data-testid="attendance-candidate"][data-member="m-5"]').count()` | `0` |
| AC-1 | `page.locator('[data-testid="attendance-candidate"]').count()` | `>= 3`（m-1, m-2, m-3） |
| AC-1 | screenshot | `outputs/phase-11/screenshots/attendance-deleted-excluded.png` |
| AC-1 | a11y: candidates list の `role="list"` 取得 | 例外なく解決 |
| AC-2 | m-1 (登録済) の register click 後 `[data-testid="toast"]` | visible / text `"既に出席登録済み"` |
| AC-2 | screenshot | `attendance-already-registered.png` |
| AC-3 | 1 回目 click 後の attendees count | +1 |
| AC-3 | 1 回目 screenshot | `attendance-dup-1.png` |
| AC-3 | 2 回目 click 後の toast text | `"既に出席登録済み"` |
| AC-3 | 2 回目 screenshot | `attendance-dup-2.png` |
| AC-3 | network response status（POST /attendances 2 回目） | `409` または mock 応答記録 |
| AC-4 | delete 前 list page の `[data-testid="attendance-attendee-sess-1"][data-member="m-1"]` | visible |
| AC-4 | screenshot | `attendance-delete-before.png` |
| AC-4 | delete 後同 locator count | `0` |
| AC-4 | toast text | `"出席を削除しました"` |
| AC-4 | screenshot | `attendance-delete-after.png` |
| AC-4 | trace artifact | `outputs/phase-11/trace/attendance-delete-trace.zip` に保存 |

a11y（共通）:

- 各 screenshot 前に `await expect(page).toHaveTitle(/.+/)` で SSR fetch 完了確認
- toast に `role="status"` または `aria-live` 属性が存在することを `expect(...).toHaveAttribute(...)` で確認

### 2.5 viewport matrix

| viewport | 対象 | 理由 |
|----------|------|------|
| desktop 1280x800 | 全 4 test（既定） | `desktop-chromium` project 既定。Phase 2 §4 で確定 |
| tablet 768x1024 | 対象外 | baseline 不追加（INV-06）。視覚 regression は task-18 visual-full が担当 |
| mobile 390x844 | 対象外 | 同上 + `mobile-webkit` は `admin-pages.spec.ts` を testIgnore する設計（admin UI は desktop primary） |

### 2.6 mock API endpoint 仕様（test 観点）

| METHOD | PATH | status | body / 副作用 |
|--------|------|--------|---------------|
| GET | `/admin/meetings` | 200 | `{ total, items: MeetingDetail[] }` |
| GET | `/admin/meetings/:id` | 200 / 404 | `MeetingDetail` |
| GET | `/admin/meetings/:id` | 200 / 404 | detail page 用。candidates / attendees を返し、unknown / soft-deleted meeting は 404 |
| POST | `/admin/meetings/:id/attendances` | 200 / 409 / 422 / 404 | 既存 → 409, isDeleted → 422, attendees set 追加 |
| POST | `/admin/meetings/:id/attendances` with `{ attended: false }` | 200 | attendees set から remove |
| POST | `/__test__/seed-meetings` | 204 | mock 状態を fixture 値で上書き |
| POST | `/__test__/reset` | 204 | 既存挙動 + attendance state クリア |

### 2.7 test 実行コマンド

```bash
# 1 行（quality-gates §7.1）
mise exec -- pnpm --filter @ubm-hyogo/web exec playwright test \
  playwright/tests/attendance.spec.ts --project=desktop-chromium
```

> Phase 2 §7 の `--project=desktop-chromium` は **F-3 解決により `desktop-chromium` に訂正**。
> evidence capture 込みの完全コマンドは Phase 5 §1 行コマンドで確定する。

---

## 3. mock state lifecycle（衝突回避）

| タイミング | 操作 | 理由 |
|-----------|------|------|
| `test.beforeEach` | `await mockApi.reset()` → `await mockApi.seedMeetings()` | 他 spec との干渉防止（F-2） |
| `test.afterEach` | `await mockApi.reset()` | リーク防止 |
| `test('AC-3')` 内 | `setAttendees('sess-1', [])` を beforeEach 後に呼んで attendees をクリア | 連続 register の初期状態を確定 |

---

## 4. evidence path（test → ファイル mapping）

| AC | 保存先（絶対パス） |
|----|--------------------|
| AC-1 | `docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11/screenshots/attendance-deleted-excluded.png` |
| AC-2 | `.../phase-11/screenshots/attendance-already-registered.png` |
| AC-3 #1 | `.../phase-11/screenshots/attendance-dup-1.png` |
| AC-3 #2 | `.../phase-11/screenshots/attendance-dup-2.png` |
| AC-4 before | `.../phase-11/screenshots/attendance-delete-before.png` |
| AC-4 after | `.../phase-11/screenshots/attendance-delete-after.png` |
| AC-4 trace | `.../phase-11/trace/attendance-delete-trace.zip` |

spec 内 path 解決:

```ts
const EVIDENCE_DIR = path.resolve(
  __dirname,
  '../../../../docs/30-workflows/07c-followup-002-attendance-visual-smoke/outputs/phase-11'
)
await page.screenshot({ path: path.join(EVIDENCE_DIR, 'screenshots', '<name>.png'), fullPage: false })
```

---

## 5. Phase 5 への申し送り

1. F-3 解決により 1 行コマンドの project 名を `desktop-chromium` に固定
2. mock state 衝突回避のため `reset() → seedMeetings()` の beforeEach 必須
3. `INTERNAL_API_BASE_URL` は既存 config で解決済 → Phase 5 で config 触らない
4. coverage は既存 `monocart-reporter` で自動収集 → DoD で別 step 不要
5. AC-3 の 2 回目 click は **mock の 409 経路と CSR 早期 return の OR** で toast 評価（R-4 緩和）

---

## 6. 要件 traceability

| AC | spec | screenshot | assertion |
|----|------|-----------|-----------|
| AC-1 | test1 | deleted-excluded.png | count=0 + count>=3 |
| AC-2 | test2 | already-registered.png | toast visible + text |
| AC-3 | test3 | dup-1/-2.png | attendees +1 → 409 / toast |
| AC-4 | test4 | delete-before/-after.png + trace.zip | attendee visible → 0 + toast |
| AC-5 | (path) | 全 6 PNG + trace tracked | git ls-files |
| AC-6 | (静的) | e2e-skip-count.txt = 0 | grep |
| AC-7 | CI | workflow diff + user-gated Actions log | playwright-smoke (chromium) に focused attendance visual smoke step を配線。PASS 実測は commit / push / PR 後 |
| AC-8 | CI | verify-design-tokens.txt | pnpm verify:tokens PASS |
| AC-9 | metadata | phase11-capture-metadata.json | provenance=local-mock |
