# Sub-task 2a — `/admin/requests` E2E 実装仕様書

> 本仕様書は **Stage 2 サブタスク 2a** の実装仕様書である。
> Workflow 全体は Stage 2 parent の仕様書パッケージから派生したが、本サブタスクは実コードファイル
> （Playwright `.spec.ts`）を同一サイクルで追加するため、実装サイクルが消費する
> **CONST_004（実装区分判定基準）準拠の「実装仕様書」**として作成する。
> 判断根拠: 出力対象が `apps/web/playwright/tests/admin-requests.spec.ts` という
> 実行可能な TypeScript ソースを生成するための受け入れ基準であり、CI（`pnpm test:e2e`）で green 判定される
> ランタイム成果物に直接接続する。

---

## 1. メタ情報

| 項目 | 値 |
|------|-----|
| workflow_id | `e2e-quality-uplift-stage-2` |
| sub-task ID | `2a` |
| 対象ファイル | `apps/web/playwright/tests/admin-requests.spec.ts` |
| 種別 | E2E（Playwright） |
| Implementation Mode | `new`（新規追加） |
| 起点日 | 2026-05-09 |
| coverageTier | standard（line >= 70% / critical smoke 100%） |
| workflow_state | spec_verified |
| evidence_state | runtime_pending |
| visualEvidence | NON_VISUAL（mock 駆動・スクリーンショット不要） |
| 単一サイクル | CONST_007 適用（本仕様書 → spec 実装 → green 化を 1 サイクルで完了） |
| 実装区分 | **実装仕様書**（CONST_004） |
| 実装区分判定根拠 | 出力ファイルが Playwright spec の TypeScript ソースであり、CI run-time に組み込まれる実装コード成果物のため |
| 親仕様書 | `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/index.md`、`phase-2.md`、`phase-4.md` §3.1 §4、`phase-5.md` §3.1 §4 |

---

## 2. 目的・スコープ

### 2.1 目的

`/admin/requests` ルートの **mutation flow（approve / reject）** と **race（二重 approve → 409）**、
さらに **admin-only 認可境界** を Playwright + `page.route()` mock のみで検証する。
D1 直接アクセスを介さず、決定論的に approve/reject UX と admin gate の `/login?gate=admin_required` / anonymous redirect 分岐を保証する。

### 2.2 スコープ

| 含む | 含まない |
|------|----------|
| approve 成功 / reject 成功 / stale approve race / 認可 3 ロール検証 | 新規 endpoint 追加 |
| `page.route()` による API mock | D1 schema 変更 |
| `adminRequestItem` fixture object 定義（spec 内 inline） | Google Form 仕様変更 |
| `apps/web/playwright/fixtures/auth.ts` の既存 fixture 再利用 | 新 fixture 追加 |
|   | mock helper の `helpers/` 抽出（Phase 8 で実施） |

---

## 3. 変更対象ファイル一覧

| # | path | 区分 | 行数目安 | 補足 |
|---|------|------|----------|------|
| 1 | `apps/web/playwright/tests/admin-requests.spec.ts` | 新規 | 実装に応じた最小行数 | 本サブタスクの主成果物 |
| 2 | `apps/web/playwright/fixtures/auth.ts` | 既存・参照のみ | — | `adminPage` / `memberPage` / `anonymousPage` を import |
| 3 | `apps/api/src/routes/admin/requests.ts` | 既存・参照のみ | — | mock 対象 endpoint shape の正本（GET 194 行付近 / POST resolve 254 行付近） |

> 本サブタスクで **修正・削除対象ファイルは存在しない**。

---

## 4. test 構造（実装版）

`phase-4.md` §3.1 と `phase-5.md` §3.1 を整流し、最終形を以下に確定する。

| # | test 名 | fixture | 主操作 | 主 assertion |
|---|---------|---------|--------|-------------|
| 1 | 成功系: pending list 表示 | `adminPage` | `/admin/requests` 訪問 | `getByRole('row')` が 3 件、各行に `status=pending` バッジ可視 |
| 2 | 成功系: approve | `adminPage` | 任意 row の approve ボタン押下 | POST body に `{ resolution: 'approve' }`、200 受領後 該当行 DOM から消失（再 fetch or optimistic） |
| 3 | 成功系: reject + 理由必須 | `adminPage` | reject ボタン → modal → 空送信で validation → reason 入力後 submit | 空時は inline error 可視、submit 時 POST body に `{ resolution: 'reject', resolutionNote: <input> }` |
| 4 | 失敗系: race（stale approve は 409） | `adminPage` | stale な pending row の approve を実行 | UI に toast/alert で「既に処理済み」相当の通知 |
| 5 | 認可: member は `/login?gate=admin_required` redirect | `memberPage` | `/admin/requests` 訪問 | URL が `/login` を含み、admin 専用 row が不可視 |
| 6 | 認可: anonymous は `/login` redirect | `anonymousPage` | `/admin/requests` 訪問 | `page.url()` が `/login` を含む |

> `test.skip` は **使用しない**（cascade preview スキップは sub-task 2c のみ）。

### 4.1 describe 階層

```text
test.describe('/admin/requests × admin mutation flow', () => {
  test.describe('admin role', () => { test 1..4 }) // adminPage fixture
  test.describe('authorization boundary', () => { test 5, 6 }) // memberPage / anonymousPage
})
```

---

## 5. API mock pattern（`page.route()`）

`phase-4.md` §4 を実装版に整流。全 mock は spec 内 inline で記述し、Phase 8 リファクタで
`apps/web/playwright/helpers/admin-mocks.ts` に抽出する想定（本サブタスクでは抽出しない）。

| # | endpoint | URL pattern | method | fulfillment |
|---|----------|-------------|--------|-------------|
| 1 | GET `/admin/requests` | `**/admin/requests*` | GET | `200` + `{ items: [adminRequestItem × 3] }`（test 1-4 の `beforeEach`） |
| 2 | POST `/admin/requests/:noteId/resolve` (approve) | `**/admin/requests/*/resolve` | POST | `200` + `{ noteId, resolvedAt, resolution: 'approve' }`、request body assert |
| 3 | POST `/admin/requests/:noteId/resolve` (reject) | `**/admin/requests/*/resolve` | POST | `200` + `{ noteId, resolvedAt, resolution: 'reject', resolutionNote }` |
| 4 | POST `/admin/requests/:noteId/resolve` (race) | `**/admin/requests/*/resolve` | POST | stale 409 mock。`calls === 1` → `200`、`calls >= 2` → `409 { error: 'already_resolved' }` |

### 5.1 counter 付き race mock の擬似コード

```text
let calls = 0
await adminPage.route('**/admin/requests/*/resolve', async (route) => {
  calls += 1
  if (calls === 1) {
    return route.fulfill({ status: 200, json: { noteId, resolvedAt, resolution: 'approve' } })
  }
  return route.fulfill({ status: 409, json: { error: 'already_resolved' } })
})
```

> counter は **test scope の closure で保持**し、`test.beforeEach` への持ち込みは行わない（test 4 専用）。

---

## 6. fixture object 標準形

`phase-5.md` §4 と同型。本 spec 内 inline 定義。

```ts
type AdminRequestItem = {
  noteId: string         // 例: 'req_001'
  memberId: string       // 例: 'mem_alpha'
  requestStatus: 'pending'      // 一覧表示時固定
  requestedAt: string           // ISO8601
  requestedReason: string | null
  requestedPayload: { desiredState?: string } | null
}

const adminRequestItem: AdminRequestItem = {
  noteId: 'req_001',
  memberId: 'mem_alpha',
  requestStatus: 'pending',
  requestedAt: '2026-05-01T00:00:00.000Z',
  requestedReason: null,
  requestedPayload: { desiredState: 'public' },
}
```

> `mergedMemberId` 等は **使用しない**（Phase 4 §1 Q2 / Phase 5 §4 結論）。

### 6.1 list fixture

```ts
const listFixture = {
  items: [
    { ...adminRequestItem, noteId: 'req_001', memberId: 'mem_alpha' },
    { ...adminRequestItem, noteId: 'req_002', memberId: 'mem_beta' },
    { ...adminRequestItem, noteId: 'req_003', memberId: 'mem_gamma' },
  ],
}
```

---

## 7. 入出力・副作用（test 別）

| # | test | 前提状態 | 操作 | 期待 UI 観測 | 期待 Network 観測 | 副作用 |
|---|------|----------|------|-------------|------------------|--------|
| 1 | list 表示 | `adminPage` cookie 有 / GET mock 装着 | route 訪問 | row 3 件・pending バッジ | GET `/admin/requests` 1 回 | なし（mock） |
| 2 | approve | 1 と同じ + POST 200 mock | row[0] approve | 該当 row 消失 | POST resolve 1 回、body `{ resolution: 'approve' }` | なし |
| 3 | reject | 1 と同じ + POST 200 mock + reason input | reject → modal → 空 → 入力 → submit | 空 submit で inline error → 入力後 row 消失 | POST resolve 1 回、body `{ resolution: 'reject', resolutionNote }` | なし |
| 4 | race | stale 409 mock | approve 連続 2 回 | 2 回目で error toast/alert | POST resolve 2 回 | なし |
| 5 | member | `memberPage` cookie | 訪問 | `/login?gate=admin_required` redirect | middleware admin gate で遮断 | なし |
| 6 | anonymous | `anonymousPage`（cookie なし） | 訪問 | URL に `/login` を含む | API 401（mock 任意） | なし |

> 副作用は全て mock 上に留まり、D1 / Google API / file system へ伝播しない（不変条件 5 維持）。

---

## 8. テスト方針

| 区分 | カウント | 必須 / 任意 | 備考 |
|------|---------|-------------|------|
| 成功系 | 3（test 1, 2, 3） | 必須 | approve / reject / list 表示 |
| 失敗系 | 1（test 4） | 必須 | stale approve race（409） |
| 認可 | 2（test 5, 6） | 必須 | member `/login?gate=admin_required` / anonymous `/login` redirect |
| `test.skip` | 0 | **禁止** | cascade preview の skip は sub-task 2c のみ |
| 合計 | 6 | — | — |

### 8.1 selector ポリシー

- `getByRole` / `getByLabel` / `getByText` を優先（accessible roles ベース）
- 色値依存禁止（`bg-[#xxx]` 等を test 内で expect しない、CLAUDE.md UI alignment 不変条件 2）
- `data-testid` は最終手段（既存 admin-pages.spec.ts と同じ運用）

---

## 9. ローカル実行コマンド

```bash
mise exec -- pnpm install
mise exec -- pnpm --filter @ubm-hyogo/web test:e2e admin-requests.spec.ts
mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm lint
```

> `pnpm install --force` は不要（lockfile 変更を伴わないため）。

---

## 10. Definition of Done（DoD）

| # | 基準 | 検証方法 |
|---|------|---------|
| 1 | `apps/web/playwright/tests/admin-requests.spec.ts` が存在する | `test -f` |
| 2 | 仕様ケース 6 件が過不足なく存在する | Playwright `--list` または spec inspect |
| 3 | `mise exec -- pnpm --filter @ubm-hyogo/web test:e2e admin-requests.spec.ts` で **6 test 全 green / skip 0** | Playwright reporter |
| 4 | `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` pass | tsc exit 0 |
| 5 | `mise exec -- pnpm lint` pass | ESLint exit 0 |
| 6 | `adminPage` / `memberPage` / `anonymousPage` の 3 ロール分岐が test 構造に存在 | spec inspect（`getByRole` + describe 階層） |
| 7 | `page.route()` mock のみで実行され、D1 / Google API への直接アクセスが 0 件 | spec 内 `route.fulfill` 確認 + `requestEnv` 等の binding 参照なし |
| 8 | `test.skip` 0 件（cascade preview skip は 2c のみ） | `grep -c "test\.skip" admin-requests.spec.ts == 0` |
| 9 | fixture object に `mergedMemberId` 等の禁止 key を含まない | `grep "mergedMemberId" admin-requests.spec.ts == 0` |
| 10 | stale approve が 409 を返す経路が記述されている | spec inspect |

---

## 11. 不変条件チェック（CLAUDE.md UI alignment 1–5）

| # | 不変条件 | 本 spec での適合 |
|---|----------|-----------------|
| 1 | 既存 API のみ接続。新規 endpoint 追加・D1 schema 変更・Google Form 仕様変更禁止 | mock 対象は `apps/api/src/routes/admin/requests.ts` の既存 GET / POST resolve のみ。新 endpoint 0 |
| 2 | OKLch トークン正本化。HEX 直書き / `bg-[#xxx]` 禁止 | spec の selector に色値依存なし。`getByRole` / `getByText` 優先 |
| 3 | プロトタイプ正本順位。primitives + tokens + rhythm 維持 | 本 spec は UI primitives を生やさず、既存 `/admin/requests` 画面に対する e2e のみ |
| 4 | D1 直接アクセス禁止 | `page.route()` mock のみ。`apps/web` から D1 binding 参照 0 |
| 5 | (Stage 2 横断) 既存 fixture 再利用 / 新 fixture 禁止 | `auth.ts` の `adminPage` / `memberPage` / `anonymousPage` を import |

加えて Stage 2 横断の不変条件:

- 既存 API endpoint surface のみ利用（index.md §不変条件） — OK
- spec のみ作成（実装は spec ファイル自身。Phase 8 の helper 抽出は本サブタスク範囲外） — OK

---

## 12. 依存・ブロッカー

| 項目 | 状態 | 備考 |
|------|------|------|
| Stage 1（admin smoke + fixtures 整備） | **完了済み** | `signSession()` 活性化 / `adminPage` 等利用可能 |
| `apps/api/src/routes/admin/requests.ts` 実装 | 完了済み | GET 194 行付近 / POST resolve 254 行付近 |
| `apps/web/playwright/fixtures/auth.ts` | 完了済み | 1–67 行に 3 fixture 完備 |
| Open Question Q1（`requireAdmin` 動作） | 解決済（Phase 4 §1） | middleware は member/anonymous とも `/login` redirect。API proxy は非 admin を 403 JSON |
| 他サブタスク（2b / 2c / 2d） | **独立** | 2a の green 化は他サブタスク完了に依存しない |

> **ブロッカー: なし**。本仕様書受領後すぐに spec 実装フェーズへ進める。

---

## 13. 参照（正本）

| 用途 | path |
|------|------|
| Stage 全体スコープ | `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/index.md` |
| 設計詳細 | `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/phase-2.md` |
| test 構造表（Red） | `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/phase-4.md` §3.1 §4 |
| 実装版 test 構造 + fixture | `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/phase-5.md` §3.1 §4 |
| API 実装（GET / POST resolve） | `apps/api/src/routes/admin/requests.ts:194,254` |
| fixture 正本 | `apps/web/playwright/fixtures/auth.ts:1-67` |
| 命名・構造の参照モデル | `apps/web/playwright/tests/admin-pages.spec.ts` |
| UI alignment 不変条件 | `CLAUDE.md` § UI prototype alignment / MVP recovery |

---

## 14. 完了条件サマリ

- [x] メタ情報表（§1）が完備
- [x] 変更対象ファイル一覧（§3）が確定
- [x] test 構造（§4）が 6 件で確定
- [x] API mock pattern（§5）が race counter 付きで記述
- [x] fixture object 標準形（§6）が `adminRequestItem` 型として確定
- [x] 入出力・副作用表（§7）が test 別に整理
- [x] テスト方針（§8）が成功 3 / 失敗 1 / 認可 2 / skip 0 で確定
- [x] ローカル実行コマンド（§9）が 4 行で確定
- [x] DoD（§10）が 10 項目で確定
- [x] 不変条件チェック（§11）で CLAUDE.md UI alignment 1–5 全適合
- [x] 依存・ブロッカー（§12）でブロッカーなし確認

> 本仕様書は **CONST_007（単一実装サイクル内完了）** に整合する。
> 受領後、`apps/web/playwright/tests/admin-requests.spec.ts` の新規作成を 1 サイクルで完了し、
> §10 DoD に従い green 化を確認する。
