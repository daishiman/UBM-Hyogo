[実装区分: 実装仕様書]

> CONST_004 判定根拠: 本サブタスク 2a の最終成果物は `apps/web/playwright/tests/admin-requests.spec.ts` という実行可能 TypeScript ソースであり、CI（`pnpm --filter @ubm-hyogo/web test:e2e`）で green 判定されるランタイム成果物に直接接続する。`taskType=docs-only` ラベルより実態優先（CONST_004）に従い、本 Phase 4 を **実装仕様書（TDD Red 設計）** として作成する。

---

# Phase 4: テスト作成（TDD Red 設計） — sub-task 2a `/admin/requests` E2E

## 1. メタ情報

| 項目 | 値 |
|------|-----|
| sub-task ID | `2a` |
| 対象 spec | `apps/web/playwright/tests/admin-requests.spec.ts` |
| 種別 | E2E (Playwright) |
| Implementation Mode | `new` |
| coverageTier | standard（lines >= 70%, critical smoke 100%） |
| workflow_state | spec_verified |
| evidence_state | runtime_pending |
| visualEvidence | NON_VISUAL（mock 駆動のためスクリーンショット不要） |
| 単一サイクル | CONST_007（spec → green 化を 1 サイクルで完了） |
| 親 workflow | `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/` |

---

## 2. 目的

`/admin/requests` の **mutation flow（approve / reject / race）** と **admin-only 認可境界（admin / member / anonymous）** を、Playwright + `page.route()` mock のみで Red 状態として確定する。spec 新規追加時点では UI 側 handler / dialog / toast / redirect が未対応箇所を含むため、Phase 5 で green 化する位置付け。

---

## 3. Red 状態 test 構造表（6 件・固定）

`test.skip` は **使用しない**（cascade preview の skip は sub-task 2c 専用）。

| # | test 名 | fixture | 主操作 | 主 assertion | Red 根拠 |
|---|---------|---------|--------|-------------|---------|
| 1 | 成功系: pending list 表示 | `adminPage` | `/admin/requests` 訪問 | `getByRole('row')` が 3 件、各行に pending バッジ可視 | spec 未存在のため fail |
| 2 | 成功系: approve | `adminPage` | row[0] approve ボタン押下 | POST body `{ resolution: 'approve' }`、200 後該当 row が DOM から消失 | UI 側 mutation handler 未接続なら fail |
| 3 | 成功系: reject + reason 必須 validation | `adminPage` | reject → modal → 空 submit → reason 入力 → submit | 空時 inline error 可視、submit 時 POST body `{ resolution: 'reject', resolutionNote }` | reason validation UI が未接続なら fail |
| 4 | 失敗系: stale approve race（409） | `adminPage` | 同 row approve を連続 2 回（stale 409 mock） | UI に toast/alert | 409 → toast 連鎖未接続なら fail |
| 5 | 認可: member は `/login?gate=admin_required` redirect | `memberPage` | `/admin/requests` 訪問 | URL が `/login` を含む。admin 専用 row は不可視 | UI middleware 分岐未確認なら fail |
| 6 | 認可: anonymous は `/login` redirect | `anonymousPage` | `/admin/requests` 訪問 | `expect(page).toHaveURL(/\/login/)` | 未認証 redirect 未接続なら fail |

### 3.1 describe 階層

```text
test.describe('/admin/requests × admin mutation flow', () => {
  test.describe('admin role', () => {
    // test 1, 2, 3, 4 — adminPage fixture
  })
  test.describe('authorization boundary', () => {
    // test 5 (memberPage), test 6 (anonymousPage)
  })
})
```

> 命名は既存 `apps/web/playwright/tests/admin-pages.spec.ts` の規約に整合（`成功系: <action>` / `失敗系: <case>` / `認可: <role> <expected>`）。

---

## 4. API mock 仕様（`page.route()` 限定）

`apps/web` から D1 直接アクセスは行わず、**`page.route()` のみ** で決定論性を保証する（CLAUDE.md 不変条件 5、Stage 2 横断不変条件 6）。helper 抽出は Phase 8 で実施するため Phase 4 では spec 内 inline 設計のみ示す。

| # | endpoint | URL pattern | method | fulfillment | 配置 |
|---|----------|-------------|--------|-------------|------|
| 1 | GET `/admin/requests` | `**/admin/requests*` | GET | 200 + `{ ok: true, items: listFixture.items, nextCursor: null, appliedFilters: { status:'pending', type:'visibility_request' } }` | `test.beforeEach`（admin role describe） |
| 2 | POST resolve (approve) | `**/admin/requests/*/resolve` | POST | 200 + `{ ok: true, noteId, requestStatus: 'resolved', resolvedAt, ... }`、request body assert | test 2 内 inline |
| 3 | POST resolve (reject) | `**/admin/requests/*/resolve` | POST | 200 + `{ ok: true, noteId, requestStatus: 'rejected', resolvedAt, ... }` | test 3 内 inline |
| 4 | POST resolve (race) | `**/admin/requests/*/resolve` | POST | stale 409 mock（§4.1） | test 4 内 inline |
| 5 | 認可（member） | （任意） | — | UI 側 redirect が先行発火する想定。API mock を装着しなくても可。装着時は 403 JSON | test 5 内（任意） |
| 6 | 認可（anonymous） | （任意） | — | 同上、401 JSON 任意 | test 6 内（任意） |

> mock の response shape は `apps/api/src/routes/admin/requests.ts:194` （GET）/ `:254`（POST resolve）の実装を正本とする。**新規 endpoint 追加・shape 変更は禁止**（CLAUDE.md UI alignment 不変条件 1）。

### 4.1 race stale 409 mock（擬似コード）

test 4（race）で必須となる counter 付き handler を以下に固定する。test scope の closure で保持し、`beforeEach` には持ち込まない（test 4 専用）。

```text
test('失敗系: stale approve race（409）', async ({ adminPage }) => {
  let calls = 0
  await adminPage.route('**/admin/requests/*/resolve', async (route) => {
    calls += 1
    if (calls === 1) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          noteId: 'req_001',
          requestStatus: 'resolved',
          resolvedAt: '2026-05-01T00:00:00.000Z',
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
  // approve ボタンを 2 回連続クリック → 1 回目 success / 2 回目 toast or alert に「既に処理済み」相当
  // expect(calls).toBe(2)
})
```

---

## 5. fixture object 仕様（spec 内 inline）

新 fixture は追加せず、既存 `apps/web/playwright/fixtures/auth.ts` の `adminPage` / `memberPage` / `anonymousPage` のみ再利用する（Stage 2 横断不変条件 5）。データ fixture は spec 内 inline で定義する。

### 5.1 `AdminRequestItem` 型

```ts
type AdminRequestItem = {
  noteId: string         // 例: 'req_001'
  memberId: string       // 例: 'mem_alpha'
  noteType: 'visibility_request' | 'delete_request'
  requestStatus: 'pending'
  requestedAt: string    // ISO8601
  requestedReason: string | null
  requestedPayload: unknown
  memberSummary: {
    memberId: string
    publicHandle: string | null
    publishState: 'public' | 'hidden' | 'member_only' | 'unknown'
    isDeleted: boolean
  }
}
```

### 5.2 `listFixture`

```ts
const listFixture = {
  ok: true,
  items: [
    {
      noteId: 'req_001',
      memberId: 'mem_alpha',
      noteType: 'visibility_request',
      requestStatus: 'pending',
      requestedAt: '2026-05-01T00:00:00.000Z',
      requestedReason: null,
      requestedPayload: { desiredState: 'public' },
      memberSummary: { memberId: 'mem_alpha', publicHandle: null, publishState: 'hidden', isDeleted: false },
    },
    {
      noteId: 'req_002',
      memberId: 'mem_beta',
      noteType: 'visibility_request',
      requestStatus: 'pending',
      requestedAt: '2026-05-01T00:01:00.000Z',
      requestedReason: null,
      requestedPayload: { desiredState: 'member_only' },
      memberSummary: { memberId: 'mem_beta', publicHandle: null, publishState: 'public', isDeleted: false },
    },
    {
      noteId: 'req_003',
      memberId: 'mem_gamma',
      noteType: 'visibility_request',
      requestStatus: 'pending',
      requestedAt: '2026-05-01T00:02:00.000Z',
      requestedReason: null,
      requestedPayload: { desiredState: 'public' },
      memberSummary: { memberId: 'mem_gamma', publicHandle: null, publishState: 'hidden', isDeleted: false },
    },
  ],
  nextCursor: null,
  appliedFilters: { requestStatus: 'pending', type: 'visibility_request' },
}
```

> `mergedMemberId` 等の禁止 key は使用しない（親 phase-4 §1 Q2）。

---

## 6. Open Questions（Phase 4 入口での解決）

| # | 問い | 解決 | 根拠 |
|---|------|------|------|
| Q1 | `requireAdmin` middleware の挙動 | API は 401/403 を JSON で返す。UI は cookie 無し → `/login` redirect、cookie 有 + isAdmin=false → admin layout で `/login?gate=admin_required` redirect | `apps/api/src/middleware/require-admin.ts:80,84,110,114,117-118` |
| Q2 | resolve response の `noteId` 以外の必須 key | `requestStatus`, `resolvedAt`, `resolvedByAdminId`, `memberAfter`, `retentionPurgeScheduledAt` が含まれる | `apps/api/src/routes/admin/requests.ts:410-422` |
| Q3 | race の 409 currentStatus 値 | `'resolved'` または `'rejected'` のいずれか | 同 :355-365 |
| Q4 | reject の resolutionNote 空時挙動 | `adminRequestResolveBodySchema` で validation。UI 側 modal でも空 submit を inline error として表示する責務 | `packages/shared/src/schemas/admin-request.ts`（`adminRequestResolveBodySchema`） |
| Q5 | mock 配置の inline / helper | Phase 5 までは inline、Phase 8 で helper 抽出 | parent phase-5 §2.2 |

---

## 7. 入出力・副作用一覧（Red 観測点）

| # | 前提 | 操作 | UI 観測 | Network 観測 | 副作用 |
|---|------|------|---------|-------------|--------|
| 1 | adminPage / GET mock | 訪問 | row 3 件、pending バッジ | GET 1 回 | なし |
| 2 | + POST 200 mock | row[0] approve | 該当 row 消失 | POST 1 回 / body `{ resolution:'approve' }` | なし |
| 3 | + POST 200 mock + reason 入力 | reject → modal 空 submit → 入力 → submit | 空時 inline error / 入力後 row 消失 | POST 1 回 / body `{ resolution:'reject', resolutionNote }` | なし |
| 4 | stale 409 mock | approve × 2 | 2 回目で toast/alert | POST 2 回（200 / 409） | なし |
| 5 | memberPage | 訪問 | `/login?gate=admin_required` redirect | API 任意 | なし |
| 6 | anonymousPage | 訪問 | URL に `/login` | API 任意 | なし |

> 副作用は全て mock 上に留まり、D1 / Google API / file system へ伝播しない（CLAUDE.md 不変条件 5 維持）。

---

## 8. 命名規則・selector ポリシー

| 項目 | 規則 |
|------|------|
| ファイル名 | `admin-requests.spec.ts`（kebab-case） |
| describe 名 | 日本語可（既存 `admin-pages.spec.ts:11` 準拠） |
| test 名 | `成功系: <action>` / `失敗系: <case>` / `認可: <role> <expected>` |
| selector 優先順位 | `getByRole` > `getByLabel` > `getByText` > `data-testid` > `data-*` |
| 色値依存 | 禁止（CLAUDE.md UI alignment 不変条件 2、HEX / `bg-[#xxx]` を expect しない） |
| `test.skip` | 0 件（cascade preview skip は 2c のみ） |

---

## 9. 不変条件チェック（CLAUDE.md UI alignment 1-5 + Stage 2 横断）

| # | 不変条件 | 本 Phase での適合 |
|---|---------|------------------|
| 1 | 既存 API のみ接続。新規 endpoint / D1 schema / Google Form 仕様変更禁止 | mock 対象は `apps/api/src/routes/admin/requests.ts` の既存 GET / POST resolve のみ |
| 2 | OKLch トークン正本。HEX 直書き禁止 | selector 色値依存なし |
| 3 | プロトタイプ正本順位（primitives + tokens + rhythm） | 新 primitive を生やさず既存画面 e2e のみ |
| 4 | D1 直接アクセス禁止 | `page.route()` mock 限定 |
| 5 | 既存 fixture 再利用（新 fixture 追加禁止） | `auth.ts` の 3 fixture を import |
| 6 | Stage 2 横断: `page.route()` で API mock し決定論性保証 | stale 409 mock を含め §4 で固定 |
| 7 | Stage 2 横断: `test.skip` 禁止（cascade preview は 2c のみ） | 6 件すべて `test()` |

---

## 10. Phase 4 完了定義

- [x] Red 状態 test 構造表（§3）が 6 件で確定
- [x] API mock 仕様（§4）が endpoint 単位で表化、race stale 409 mock 擬似コード（§4.1）あり
- [x] fixture object 仕様（§5）が `AdminRequestItem` 型 + `listFixture` で確定
- [x] Open Questions Q1–Q5（§6）が解決済
- [x] 入出力・副作用（§7）が test 別に整理
- [x] 命名・selector ポリシー（§8）確定
- [x] 不変条件チェック（§9）で CLAUDE.md UI alignment 1–5 + Stage 2 横断適合

> 次フェーズ Phase 5 で各 test を green 化する describe 階層と selector を確定する。
