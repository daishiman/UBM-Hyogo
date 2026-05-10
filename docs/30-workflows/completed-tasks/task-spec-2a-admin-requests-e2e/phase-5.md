[実装区分: 実装仕様書]

> CONST_004 判定根拠: 本 Phase 5 は Phase 4 で Red にした 6 件 test を **green 化** する具体実装方針を確定する。出力ファイル `apps/web/playwright/tests/admin-requests.spec.ts` は CI で実行される TypeScript ソースであり、ラベル `taskType=docs-only` より実態（実コード）優先（CONST_004）に従い実装仕様書扱い。

---

# Phase 5: 実装（TDD Green） — sub-task 2a `/admin/requests` E2E

## 1. メタ情報

| 項目 | 値 |
|------|-----|
| sub-task ID | `2a` |
| 対象 spec | `apps/web/playwright/tests/admin-requests.spec.ts`（新規） |
| Implementation Mode | `new` |
| 行数目安 | 実装に応じた最小行数 |
| coverageTier | standard |
| workflow_state | spec_verified |
| visualEvidence | NON_VISUAL |

---

## 2. 新規・修正ファイル一覧

| # | path | 区分 | 行数目安 | 補足 |
|---|------|------|----------|------|
| 1 | `apps/web/playwright/tests/admin-requests.spec.ts` | 新規 | 実装に応じた最小行数 | 主成果物 |
| 2 | `apps/web/playwright/fixtures/auth.ts` | 既存・参照のみ | — | `adminPage` / `memberPage` / `anonymousPage` を import |
| 3 | `apps/api/src/routes/admin/requests.ts` | 既存・参照のみ | — | mock 対象 endpoint shape の正本 |

> 修正対象は 0 件。**spec の新規追加 1 ファイルのみ**。

---

## 3. green 化のための具体実装方針

各 test を green にするための spec 側実装手順を test 単位で固定する。UI 側 handler / dialog / toast / redirect は spec が要求する behavior に既に整合している前提（既存 `/admin/requests` ページ実装が応答済み）であり、もし応答していない箇所があれば、その UI 側差分は **本サブタスクの範囲外**（Stage 3 持越し or 別 PR）として記録する。

### 3.1 共通 import 骨子

```text
import { expect } from '@playwright/test'
import { test } from '../fixtures/auth'

const ROUTE_GET = '**/admin/requests*'
const ROUTE_POST = '**/admin/requests/*/resolve'
```

### 3.2 describe 階層（確定版）

```text
test.describe('/admin/requests × admin mutation flow', () => {
  test.describe('admin role', () => {
    test.beforeEach(async ({ adminPage }) => {
      await adminPage.route(ROUTE_GET, async (route) => {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(listFixture),
        })
      })
    })

    test('成功系: pending list 表示', async ({ adminPage }) => { ... })
    test('成功系: approve', async ({ adminPage }) => { ... })
    test('成功系: reject + 理由必須', async ({ adminPage }) => { ... })
    test('失敗系: stale approve race（409）', async ({ adminPage }) => { ... })
  })

  test.describe('authorization boundary', () => {
    test('認可: member は /login?gate=admin_required redirect', async ({ memberPage }) => { ... })
    test('認可: anonymous は /login redirect', async ({ anonymousPage }) => { ... })
  })
})
```

### 3.3 test 別 green 化方針

| # | test 名 | 主操作（spec 実装） | 主 selector（候補） | 主 assertion |
|---|---------|---------------------|---------------------|-------------|
| 1 | 成功系: pending list 表示 | `await adminPage.goto('/admin/requests')` → `await adminPage.waitForResponse(ROUTE_GET)` | `getByRole('row')` / `getByText('pending')` | row 3 件 / 各行に pending バッジ可視 |
| 2 | 成功系: approve | row[0] 内 approve ボタン click → POST 待ち | `getByRole('button', { name: /承認\|approve/i })` | POST body `{ resolution:'approve' }`、行が detached |
| 3 | 成功系: reject + 理由必須 | reject ボタン click → modal 表示 → 空 submit → reason 入力 → submit | `getByRole('button', { name: /却下\|reject/i })`、`getByRole('dialog')`、`getByLabel(/理由\|reason/i)`、`getByRole('button', { name: /送信\|submit/i })` | 空時 inline error 可視、入力後 POST body `{ resolution:'reject', resolutionNote }` |
| 4 | 失敗系: stale approve race（409） | stale 409 mock 装着 → approve × 2 連打 | 同 #2 | 1 回目 200、2 回目 409、UI に toast/alert（`getByRole('alert')` or `getByText(/既に処理済み\|already_resolved/i)`） |
| 5 | 認可: member `/login?gate=admin_required` redirect | `await memberPage.goto('/admin/requests')` | URL が `/login` を含む | `await expect(memberPage).toHaveURL(/\/login/)` |
| 6 | 認可: anonymous /login redirect | `await anonymousPage.goto('/admin/requests')` | — | `await expect(anonymousPage).toHaveURL(/\/login/)` |

> selector は `getByRole` を最優先とし、ラベル文言の揺れに備えて regex（`/承認|approve/i`）で吸収する。`data-testid` への退行は最終手段。

---

## 4. counter 付き race mock の実装骨子（test 4）

Phase 4 §4.1 を実装版として固定する。test 4 専用 closure として保持する。

```text
test('失敗系: stale approve race（409）', async ({ adminPage }) => {
  let calls = 0
  const targetNoteId = 'req_001'
  await adminPage.route(ROUTE_POST, async (route) => {
    calls += 1
    if (calls === 1) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          noteId: targetNoteId,
          requestStatus: 'resolved',
          resolvedAt: '2026-05-01T00:00:00.000Z',
          resolvedByAdminId: 'admin-1',
          memberAfter: { memberId: 'mem_alpha', publishState: 'public', isDeleted: false },
          retentionPurgeScheduledAt: null,
        }),
      })
    }
    return route.fulfill({
      status: 409,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: false,
        error: 'already_resolved',
        currentStatus: 'resolved',
      }),
    })
  })

  await adminPage.goto('/admin/requests')
  const row = adminPage.getByRole('row').filter({ hasText: 'mem_alpha' })
  const approveBtn = row.getByRole('button', { name: /承認|approve/i })
  await approveBtn.click()
  await approveBtn.click({ trial: false }).catch(() => { /* 2 回目は detach 可 */ })

  await expect(
    adminPage.getByRole('alert').or(adminPage.getByText(/既に処理済み|already_resolved/i)),
  ).toBeVisible()
  expect(calls).toBe(2)
})
```

> 2 回目の click は row の detach 後のため `.catch(() => {})` で握り、`calls === 2` を最終 assert で固定する。

---

## 5. fixture object 標準形（spec 内 inline、確定版）

Phase 4 §5 を実装版に整流する。`mergedMemberId` 等の禁止 key は使用しない。

```ts
type AdminRequestItem = {
  noteId: string
  memberId: string
  noteType: 'visibility_request' | 'delete_request'
  requestStatus: 'pending'
  requestedAt: string
  requestedReason: string | null
  requestedPayload: unknown
  memberSummary: {
    memberId: string
    publicHandle: string | null
    publishState: 'public' | 'hidden' | 'member_only' | 'unknown'
    isDeleted: boolean
  }
}

const listFixture = {
  ok: true as const,
  items: [/* req_001, req_002, req_003 — Phase 4 §5.2 と同一 */],
  nextCursor: null,
  appliedFilters: { requestStatus: 'pending' as const, type: 'visibility_request' as const },
}
```

---

## 6. selector 確定方針

| 区分 | 採用 | 備考 |
|------|------|------|
| 行 | `getByRole('row')` | filter で memberId / noteId 文字列を含む行を絞り込む |
| 承認ボタン | `getByRole('button', { name: /承認\|approve/i })` | i18n 揺れ吸収 |
| 却下ボタン | `getByRole('button', { name: /却下\|reject/i })` | 同 |
| modal | `getByRole('dialog')` | reject 時のみ |
| reason 入力 | `getByLabel(/理由\|reason/i)` | textarea / input 両対応 |
| submit | `getByRole('button', { name: /送信\|submit/i })` | modal 内 |
| inline error | `getByRole('alert')` または `getByText(/必須\|required/i)` | 一方が visible でよい |
| 競合 toast | `getByRole('alert')` または `getByText(/既に処理済み\|already_resolved/i)` | 同 |

> CLAUDE.md UI alignment 不変条件 2（OKLch トークン正本）に従い、色値依存 selector は禁止。`bg-[#xxx]` / `text-[#xxx]` を spec 内で expect しない。

---

## 7. green 達成の受け入れ基準

| # | 基準 | 検証方法 |
|---|------|---------|
| 1 | spec ファイルが新規追加されている | `git diff --name-only origin/dev...HEAD` |
| 2 | 仕様ケース 6 件 の範囲内 | `wc -l apps/web/playwright/tests/admin-requests.spec.ts` |
| 3 | `pnpm --filter @ubm-hyogo/web test:e2e admin-requests.spec.ts` で 6 test 全 green / skip 0 | Playwright reporter |
| 4 | `pnpm --filter @ubm-hyogo/web typecheck` pass | tsc exit 0 |
| 5 | `pnpm lint` pass | ESLint exit 0 |
| 6 | `page.route()` 以外で API を叩いていない（D1 / Google API への直接アクセス 0） | spec 内 grep（`fetch(`、`requestEnv` 等の binding 参照なし） |
| 7 | `mergedMemberId` を含まない | `grep -c mergedMemberId admin-requests.spec.ts == 0` |
| 8 | stale approve が 409 を返す経路が記述 | spec inspect |

---

## 8. ローカル実行コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm --filter @ubm-hyogo/web test:e2e admin-requests.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm lint
```

---

## 9. 不変条件チェック

| # | 不変条件 | 本 Phase での適合 |
|---|---------|------------------|
| 1 | 既存 API のみ接続 | mock 対象は既存 GET / POST resolve のみ |
| 2 | OKLch トークン正本 | selector 色値依存なし |
| 4 | D1 直接アクセス禁止 | `page.route()` 限定 |
| 5 | 既存 fixture 再利用 | `auth.ts` の 3 fixture を import |
| Stage 2 横断 | `test.skip` 禁止（cascade preview は 2c のみ） | 6 件すべて `test()` |
| Stage 2 横断 | helper は spec 内 inline（Phase 8 で抽出予定） | inline で記述 |

---

## 10. Phase 5 完了定義

- [x] describe 階層（§3.2）が確定
- [x] test 別 green 化方針（§3.3）が 6 件で確定
- [x] stale 409 mock コード骨子（§4）が確定
- [x] fixture object 標準形（§5）が確定
- [x] selector ポリシー（§6）が確定
- [x] 受け入れ基準（§7）が 8 項目で確定
- [x] 不変条件適合（§9）

> Phase 6 へ進める。
