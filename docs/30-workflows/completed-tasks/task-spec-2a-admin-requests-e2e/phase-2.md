# Phase 2: 設計 — サブタスク 2a `/admin/requests` E2E

> **[実装区分: 実装仕様書]**
>
> CONST_004 判定根拠: Phase 1 と同じく、本仕様書の設計対象は Playwright `.spec.ts` の
> TypeScript ソース（CI 実行対象のランタイム成果物）であり、出力が実コードに直接接続するため
> 実装仕様書として作成する。

---

## 1. メタ情報

| 項目 | 値 |
|------|-----|
| workflow_id | `task-spec-2a-admin-requests-e2e` |
| Phase | 2（設計） |
| 対象 | sub-task 2a 単体（`apps/web/playwright/tests/admin-requests.spec.ts`） |
| 起点日 | 2026-05-09 |
| 実装区分 | **実装仕様書**（CONST_004） |

---

## 2. spec ファイル構造

```text
import { expect } from '@playwright/test'
import { test } from '../fixtures/auth'

// --- 型定義（spec 内 inline） ---
type AdminRequestItem = { /* §6 参照 */ }

// --- fixture（spec 内 inline） ---
const adminRequestItem: AdminRequestItem = { /* §6 参照 */ }
const listFixture = { items: [/* 3 件 */] }

test.describe('/admin/requests × admin mutation flow', () => {
  test.describe('admin role', () => {
    test.beforeEach(async ({ adminPage }) => {
      // GET /admin/requests を 200 + listFixture で mock
    })

    test('成功系: pending list 表示', async ({ adminPage }) => { /* test 1 */ })
    test('成功系: approve', async ({ adminPage }) => { /* test 2 */ })
    test('成功系: reject + 理由必須', async ({ adminPage }) => { /* test 3 */ })
    test('失敗系: race（stale approve は 409）', async ({ adminPage }) => { /* test 4 */ })
  })

  test.describe('authorization boundary', () => {
    test('member: /login?gate=admin_required redirect', async ({ memberPage }) => { /* test 5 */ })
    test('anonymous: /login redirect', async ({ anonymousPage }) => { /* test 6 */ })
  })
})
```

- describe 名は日本語可（`admin-pages.spec.ts:11` 準拠）
- 共通 mock setup は `beforeEach` で集約、シナリオ固有 mock（POST 系・stale 409 mock）は test 内で `page.route()` を上書き
- screenshot 撮影は不要（NON_VISUAL）
- `test.skip` は使用しない

---

## 3. describe 階層（最終確定）

```text
test.describe('/admin/requests × admin mutation flow')
├── test.describe('admin role')          // adminPage fixture
│   ├── test 1: 成功系: pending list 表示
│   ├── test 2: 成功系: approve
│   ├── test 3: 成功系: reject + 理由必須
│   └── test 4: 失敗系: race（stale approve は 409）
└── test.describe('authorization boundary')
    ├── test 5: member: /login?gate=admin_required redirect   // memberPage fixture
    └── test 6: anonymous: /login redirect        // anonymousPage fixture
```

---

## 4. test 構造表（実装版）

| # | test 名 | fixture | 主操作 | 主 assertion |
|---|---------|---------|--------|-------------|
| 1 | 成功系: pending list 表示 | `adminPage` | `/admin/requests` 訪問 | `getByRole('row')` が 3 件、各行に `status=pending` バッジ可視 |
| 2 | 成功系: approve | `adminPage` | 任意 row の approve ボタン押下 | POST body に `{ resolution: 'approve' }`、200 受領後 該当行 DOM から消失 |
| 3 | 成功系: reject + 理由必須 | `adminPage` | reject → modal → 空 submit → reason 入力 → submit | 空時は inline error 可視、submit 時 POST body に `{ resolution: 'reject', resolutionNote: <input> }` |
| 4 | 失敗系: race（二重 approve） | `adminPage` | stale な pending row の approve を実行 | UI に toast/alert で「既に処理済み」相当の通知 |
| 5 | 認可: member は `/login?gate=admin_required` redirect | `memberPage` | `/admin/requests` 訪問 | `/login?gate=admin_required` へ redirect。admin 専用 row が不可視 |
| 6 | 認可: anonymous は `/login` redirect | `anonymousPage` | `/admin/requests` 訪問 | `page.url()` が `/login` を含む |

> `test.skip` 0 件・合計 6 test。

---

## 5. API mock 戦略（`page.route()`）

全 mock は spec 内 inline で記述。Phase 8 リファクタで `apps/web/playwright/helpers/admin-mocks.ts` に抽出する想定（本サブタスクでは抽出しない）。

| # | endpoint | URL pattern | method | fulfillment | 適用 test |
|---|----------|-------------|--------|-------------|----------|
| M1 | GET `/admin/requests` | `**/admin/requests*` | GET | `200` + `{ items: listFixture.items }` | test 1-4 の `beforeEach` |
| M2 | POST `/admin/requests/:noteId/resolve` (approve) | `**/admin/requests/*/resolve` | POST | `200` + `{ noteId, resolvedAt, resolution: 'approve' }` + request body assert | test 2 |
| M3 | POST `/admin/requests/:noteId/resolve` (reject) | `**/admin/requests/*/resolve` | POST | `200` + `{ noteId, resolvedAt, resolution: 'reject', resolutionNote }` | test 3 |
| M4 | POST `/admin/requests/:noteId/resolve` (race counter) | `**/admin/requests/*/resolve` | POST | stale 409 mock。`calls === 1` → `200`、`calls >= 2` → `409 { error: 'already_resolved' }` | test 4 専用 |
| M5 | （任意）member 用 GET `/admin/requests` | `**/admin/requests*` | GET | `403` JSON | test 5（任意・UI 側 redirect で十分なら省略） |
| M6 | （任意）anonymous 用 GET `/admin/requests` | `**/admin/requests*` | GET | `401` JSON | test 6（任意） |

### 5.1 counter 付き race mock の擬似コード

```ts
let calls = 0
await adminPage.route('**/admin/requests/*/resolve', async (route) => {
  calls += 1
  if (calls === 1) {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ noteId: 'req_001', resolvedAt: '2026-05-01T00:01:00.000Z', resolution: 'approve' }),
    })
  }
  return route.fulfill({
    status: 409,
    contentType: 'application/json',
    body: JSON.stringify({ error: 'already_resolved' }),
  })
})
```

> counter は **test scope の closure で保持**し、`test.beforeEach` への持ち込みは行わない（test 4 専用）。

### 5.2 request body assertion パターン

```ts
await adminPage.route('**/admin/requests/*/resolve', async (route) => {
  const body = route.request().postDataJSON()
  expect(body).toMatchObject({ resolution: 'reject', resolutionNote: expect.any(String) })
  return route.fulfill({ status: 200, body: JSON.stringify({ /* ... */ }) })
})
```

---

## 6. fixture object 設計

`phase-5.md` §4 と同型。本 spec 内 inline 定義。

```ts
type AdminRequestItem = {
  noteId: string         // 例: 'req_001'
  memberId: string       // 例: 'mem_alpha'
  requestStatus: 'pending'      // 一覧表示時固定
  requestedAt: string      // ISO8601
  updatedAt?: string
  resolution?: 'approve' | 'reject'
  resolutionNote?: string
}

const adminRequestItem: AdminRequestItem = {
  noteId: 'req_001',
  memberId: 'mem_alpha',
  requestStatus: 'pending',
  requestedAt: '2026-05-01T00:00:00.000Z',
}

const listFixture = {
  items: [
    { ...adminRequestItem, noteId: 'req_001', memberId: 'mem_alpha' },
    { ...adminRequestItem, noteId: 'req_002', memberId: 'mem_beta' },
    { ...adminRequestItem, noteId: 'req_003', memberId: 'mem_gamma' },
  ],
}
```

### 6.1 設計指針

| # | 指針 | 根拠 |
|---|------|------|
| 1 | inline 定義のみ。外部 JSON ファイル化しない | `phase-2.md` §6（外部 JSON 化禁止） |
| 2 | `noteId` は `req_001..003` 固定、`memberId` は `mem_alpha/beta/gamma` 固定 | flaky 防止 |
| 3 | 日時は ISO8601 固定（`2026-05-01T00:00:00.000Z`） | flaky 防止 |
| 4 | 配列件数は 3 件（一覧 render の sort / 視認性のため） | `phase-5.md` §4 |
| 5 | `mergedMemberId` は **使用禁止**（Phase 4 §1 Q2 / Phase 5 §4 結論。2b の merge 用 key であり 2a では発生しない） | 親 workflow 結論 |
| 6 | governance index §正本補正事項 1（merge response shape）は 2b スコープであり 2a では不要 | governance index 確認 |

---

## 7. selector ポリシー

| 優先順位 | selector | 用途 |
|----------|----------|------|
| 1 | `getByRole('row' | 'button' | 'dialog' | 'alert')` | アクセシブルな構造ベース |
| 2 | `getByLabel(...)` | フォーム入力（reason input 等） |
| 3 | `getByText(...)` | バッジ・toast の文言 |
| 4 | `data-testid` | 最終手段（既存 `admin-pages.spec.ts` と同じ運用） |
| ❌ 禁止 | `bg-[#xxx]` / `text-[#xxx]` / HEX 値 | CLAUDE.md UI alignment 不変条件 2 |

### 7.1 主要 selector のマッピング

| UI 要素 | 推定 selector | test |
|---------|--------------|------|
| pending list の row | `page.getByRole('row')` | 1, 2, 3, 4 |
| approve ボタン | `page.getByRole('button', { name: /承認|approve/i })` | 2, 4 |
| reject ボタン | `page.getByRole('button', { name: /却下|reject/i })` | 3 |
| reject modal | `page.getByRole('dialog')` | 3 |
| reason input | `page.getByLabel(/理由|reason/i)` | 3 |
| inline validation error | `page.getByRole('alert')` または `getByText(/必須|required/i)` | 3 |
| race 通知 toast | `page.getByRole('alert')` または `getByText(/既に処理済み|already.resolved/i)` | 4 |
| 403 page | `page.getByRole('heading', { name: /403|forbidden/i })` | 5 |

> 実際の文言は実装側に合わせ、Phase 4（実装フェーズ）で必要に応じて selector を調整する。

---

## 8. 共通テンプレート骨格（実装の足場）

```ts
import { expect } from '@playwright/test'
import { test } from '../fixtures/auth'

type AdminRequestItem = {
  noteId: string
  memberId: string
  requestStatus: 'pending'
  requestedAt: string
  updatedAt?: string
  resolution?: 'approve' | 'reject'
  resolutionNote?: string
}

const adminRequestItem: AdminRequestItem = {
  noteId: 'req_001',
  memberId: 'mem_alpha',
  requestStatus: 'pending',
  requestedAt: '2026-05-01T00:00:00.000Z',
}

const listFixture = {
  items: [
    { ...adminRequestItem, noteId: 'req_001', memberId: 'mem_alpha' },
    { ...adminRequestItem, noteId: 'req_002', memberId: 'mem_beta' },
    { ...adminRequestItem, noteId: 'req_003', memberId: 'mem_gamma' },
  ],
}

test.describe('/admin/requests × admin mutation flow', () => {
  test.describe('admin role', () => {
    test.beforeEach(async ({ adminPage }) => {
      await adminPage.route('**/admin/requests*', async (route) => {
        if (route.request().method() !== 'GET') return route.fallback()
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(listFixture),
        })
      })
    })

    test('成功系: pending list 表示', async ({ adminPage }) => {
      await adminPage.goto('/admin/requests')
      await expect(adminPage.getByRole('row')).toHaveCount(3 + 1 /* header */)
    })

    test('成功系: approve', async ({ adminPage }) => { /* M2 */ })
    test('成功系: reject + 理由必須', async ({ adminPage }) => { /* M3 */ })
    test('失敗系: race（stale approve は 409）', async ({ adminPage }) => { /* M4 + counter */ })
  })

  test.describe('authorization boundary', () => {
    test('member: /login?gate=admin_required redirect', async ({ memberPage }) => { /* test 5 */ })
    test('anonymous: /login redirect', async ({ anonymousPage }) => {
      await anonymousPage.goto('/admin/requests')
      await expect(anonymousPage).toHaveURL(/\/login/)
    })
  })
})
```

> 上記は骨格イメージ。実装フェーズで selector の具体名・assertion を実 UI に合わせ確定する。

---

## 9. リスク分析

| # | リスク | 影響 | 緩和策 |
|---|--------|------|--------|
| R1 | UI 実装側で `/admin/requests` の query / path が想定と異なる | mock パターン miss → flaky | URL pattern を `**/admin/requests*` のワイルドカードで許容。Phase 4 で実 UI 確認 |
| R2 | `signSession()` placeholder のまま | 認可テスト全滅 | Stage 1 完了済（Phase 1 §13 で確認）。本 Phase の前提条件として明示 |
| R3 | reject modal の実装が dialog primitive と異なる | selector miss | `getByRole('dialog')` を第一選択、fallback で `data-testid` |
| R4 | race 検出 UI（toast / alert）の文言が確定していない | assertion miss | 文言ベースではなく `getByRole('alert')` の出現を主 assertion とし、文言は補助 |
| R5 | `requireAdmin` middleware の挙動が member と anonymous で同一（両方 redirect 等） | test 5 / 6 のシナリオ重複 | Phase 1 §4 の Pre-condition 5 で「member `/login?gate=admin_required` redirect、anonymous `/login` redirect」と分岐確定済 |
| R6 | stale 409 mock の closure リーク（次 test に持ち越し） | flaky | counter は test 内 closure 限定（`test.beforeEach` に置かない） |

---

## 10. CI / 実行

| 観点 | 設計 |
|------|------|
| 実行ジョブ | 既存 `.github/workflows/` の playwright job がそのまま `apps/web/playwright/tests/admin-requests.spec.ts` を拾う |
| 並列度 | 既存 `apps/web/playwright.config.ts` の workers 設定に従う。本サブタスクで調整なし |
| typecheck | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` |
| lint | `mise exec -- pnpm lint` |

---

## 11. Phase 2 完了条件（DoD）

| # | 基準 | 検証方法 |
|---|------|---------|
| 1 | spec ファイル構造（§2）が確定 | テンプレート提示済 |
| 2 | describe 階層（§3）が 2 階層 + 6 test で確定 | 階層図 |
| 3 | test 構造表（§4）が 6 件 / `test.skip` 0 で確定 | 表 |
| 4 | API mock 戦略（§5）が M1-M4（必須）+ M5/M6（任意）で確定 | 表 + 擬似コード |
| 5 | fixture object 設計（§6）が `AdminRequestItem` 型 + `listFixture` で確定 | TS 型 + 値 |
| 6 | selector ポリシー（§7）が 4 段階 + 禁止項目で確定 | 表 + マッピング |
| 7 | リスク分析（§9）が R1-R6 で列挙され、各々に緩和策あり | 表 |
| 8 | 不変条件 1-5 + Stage 2 横断（page.route() 限定 / 新 fixture 禁止 / 新 endpoint 禁止 / test.skip 禁止）が反映 | §12 |

---

## 12. 不変条件チェック（Phase 2 観点）

| # | 不変条件 | 本 Phase での適合 |
|---|----------|------------------|
| 1 | 既存 API endpoint surface のみ利用 | mock 対象は GET `/admin/requests` / POST `/admin/requests/:noteId/resolve` のみ。新 endpoint 設計なし |
| 2 | OKLch トークン正本、色値直書き禁止 | selector ポリシー §7 で `bg-[#xxx]` 等を明示禁止 |
| 3 | プロトタイプ正本順位、新 primitive 禁止 | 既存 admin-pages.spec.ts と同じ selector 規約を踏襲 |
| 4 | D1 直接アクセス禁止 | 全 mock を `page.route()` で記述、binding 参照 0 |
| 5 | 既存 fixture 再利用、新 fixture 禁止 | `auth.ts` の 3 fixture を import するのみ |
| S1 | `page.route()` mock 限定 | §5 で全 mock を `page.route()` で記述 |
| S2 | `test.skip` 禁止（cascade preview の 2c のみ許容） | §4 で skip 0 件確定 |
| S3 | 新 endpoint 追加禁止 | §5 mock 対象は既存 2 endpoint のみ |
| S4 | 新 fixture 追加禁止 | §6 inline fixture object のみ、`apps/web/playwright/fixtures/` への追加なし |

---

## 13. 参照

| 用途 | path |
|------|------|
| 主入力 | `docs/30-workflows/e2e-quality-uplift-stage-2-sub-tasks/2a-admin-requests.md` |
| 親 workflow Phase 2 | `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/phase-2.md` |
| 親 workflow Phase 5（実装版 test 構造） | `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/phase-5.md` |
| API 実装 | `apps/api/src/routes/admin/requests.ts:194,254` |
| fixture 正本 | `apps/web/playwright/fixtures/auth.ts:1-67` |
| 命名・構造の参照モデル | `apps/web/playwright/tests/admin-pages.spec.ts` |
