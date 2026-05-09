# Sub-task 2c — `admin-member-delete.spec.ts` 実装仕様書

> **[実装区分: 実装仕様書]**
>
> 判断根拠（CONST_004）:
> - 後続成果物は Playwright `.spec.ts` ファイル（`apps/web/playwright/tests/admin-member-delete.spec.ts`）
> - Phase 1-3 の要件・設計は Stage 2 ワークフロー（`phase-1.md` / `phase-2.md` / `phase-3.md`）で確定済
> - 本ドキュメントは「コード実装に直接落とせる test 構造・mock pattern・fixture 形・DoD」を確定する位置付け
> - したがって要件仕様書ではなく **実装仕様書** として作成する

---

## 1. メタ情報

| key | value |
| --- | --- |
| workflow | `e2e-quality-uplift-stage-2` |
| sub-task ID | 2c |
| 実装区分 | 実装仕様書（Phase 4-5 を実コードに落とす） |
| 対象ファイル | `apps/web/playwright/tests/admin-member-delete.spec.ts`（新規） |
| 対象 route | `/admin/members`（delete gate） |
| 対象 endpoint | `POST /admin/members/:memberId/delete` / `GET /admin/audit` / `GET /admin/members` |
| coverageTier | `standard`（lines >= 70% / critical route smoke 100%） |
| visualEvidence | `NON_VISUAL` |
| implementation_mode | `new` |
| workflow_state | `spec_verified` |
| evidence_state | `runtime_pending` |
| Tier-aware skip 例外 | cascade preview 1 件のみ（CONST_007 例外条件 1, 2 該当） |
| 起点日 | 2026-05-09 |

---

## 2. 変更対象ファイル一覧

| # | path | 種別 | 状態 | 行数目安 |
|---|------|------|------|----------|
| 1 | `apps/web/playwright/tests/admin-member-delete.spec.ts` | E2E (Playwright) | 新規 | **180-220 行** |

> 修正対象なし。新規 1 ファイルのみ。`apps/api/src/routes/admin/member-delete.ts` および `apps/api/src/routes/admin/audit.ts` は **参照のみ**（変更禁止 = Stage 2 不変条件 1）。

---

## 3. test 構造表（6 ケース）

`test.describe('/admin/members × delete', () => { ... })` 配下に以下 6 test を配置する。

| # | test 名 | fixture | 主 assertion | 状態 |
|---|---------|---------|-------------|------|
| 1 | `成功系: 二段確認 → 削除（reason 入力）` | `adminPage` | (a) 1 段目 delete button click → 2 段目 confirm dialog 表示 / (b) reason 入力 textarea に文字列入力 / (c) confirm 押下で `POST /admin/members/:id/delete` body `{ reason: '<入力値>' }` / (d) 200 返却後 UI 該当 row が `is_deleted=true` 表示 | active |
| 2 | `cascade preview（API 未実装・Stage 3 持越し）` | — | `test.skip()` で明示 + `// TODO(stage-3): cascade preview API 未実装` コメント | **skip（唯一の例外）** |
| 3 | `失敗系: reason 空 → 422 inline error` | `adminPage` | (a) confirm dialog で reason 未入力のまま submit / (b) UI inline error メッセージ表示 / (c) API は body `{ reason: '' }` で叩かれず UI バリデーションで止まる **または** API が 422 を返した場合に inline error にマップされる の 2 層を許容 | active |
| 4 | `audit log entry 連動` | `adminPage` | (a) 削除成功後に audit 一覧画面遷移 or 同画面再 fetch / (b) `GET /admin/audit` mock を設定し `action='admin.member.deleted'` の entry が一覧に表示される | active |
| 5 | `認可: member は 403 page` | `memberPage` | `/admin/members` 訪問 → API が 403 → UI が 403 page or `/profile` redirect / delete button が DOM に存在しない | active |
| 6 | `認可: anonymous は /login redirect` | `anonymousPage` | `/admin/members` 訪問 → `page.url()` が `/login` を含む | active |

> **skip 1 件のみ許容**。これ以外で `test.skip` / `test.fixme` を追加することは禁止（DoD §10 で明示）。

### 3.1 test #1 擬似コード

```text
test('成功系: 二段確認 → 削除（reason 入力）', async ({ adminPage }) => {
  // GET /admin/members 一覧 mock
  await adminPage.route('**/admin/members*', fulfillJson(memberListFixture))

  // POST delete mock（reason 検証付き）
  await adminPage.route('**/admin/members/*/delete', async (route) => {
    const body = await route.request().postDataJSON()
    expect(body).toEqual({ reason: expect.any(String) })
    expect(body.reason.length).toBeGreaterThan(0)
    await route.fulfill({ status: 200, json: memberDeleteResponse })
  })

  await adminPage.goto('/admin/members')

  // 1 段目: 削除 button click
  await adminPage.getByRole('button', { name: /削除/ }).first().click()

  // 2 段目: confirm dialog（reason textarea）
  const dialog = adminPage.getByRole('dialog')
  await dialog.getByLabel(/理由/).fill('退会希望につき削除')
  await dialog.getByRole('button', { name: /確定|削除する/ }).click()

  // is_deleted 表示切替
  await expect(adminPage.getByText(/削除済み|is_deleted/)).toBeVisible()
})
```

### 3.2 test #2（skip）擬似コード

```text
// TODO(stage-3): cascade preview API 未実装。
// 実装位置: docs/30-workflows/e2e-quality-uplift-stage-3/
// 関連: phase-4.md §1 Q5（grep -rn "delete-preview|deletePreview|cascade.*preview" → 0 件）
test.skip('cascade preview（API 未実装・Stage 3 持越し）', async () => {})
```

### 3.3 test #3 擬似コード

```text
test('失敗系: reason 空 → 422 inline error', async ({ adminPage }) => {
  await adminPage.route('**/admin/members*', fulfillJson(memberListFixture))
  await adminPage.route('**/admin/members/*/delete', async (route) => {
    // API 層 422（DeleteBodyZ.parse 失敗を再現）
    await route.fulfill({
      status: 422,
      json: { error: 'invalid_body', issues: [{ path: ['reason'], message: 'required' }] },
    })
  })

  await adminPage.goto('/admin/members')
  await adminPage.getByRole('button', { name: /削除/ }).first().click()
  const dialog = adminPage.getByRole('dialog')
  // reason 未入力のまま submit
  await dialog.getByRole('button', { name: /確定|削除する/ }).click()

  // UI inline error 表示（UI バリデーション or API 422 ハンドリング）
  await expect(dialog.getByText(/理由.*必須|required/)).toBeVisible()
})
```

### 3.4 test #4 擬似コード

```text
test('audit log entry 連動', async ({ adminPage }) => {
  await adminPage.route('**/admin/members*', fulfillJson(memberListFixture))
  await adminPage.route('**/admin/members/*/delete', fulfillJson(memberDeleteResponse))
  await adminPage.route('**/admin/audit*', fulfillJson({ items: [auditEntry], nextCursor: null }))

  // delete 実行（test #1 と同じ流れの簡略版）
  await adminPage.goto('/admin/members')
  await adminPage.getByRole('button', { name: /削除/ }).first().click()
  await adminPage.getByRole('dialog').getByLabel(/理由/).fill('audit 検証用')
  await adminPage.getByRole('dialog').getByRole('button', { name: /確定|削除する/ }).click()

  // audit 画面に遷移（or 同画面で audit panel 再 fetch）
  await adminPage.goto('/admin/audit')
  await expect(adminPage.getByText('admin.member.deleted')).toBeVisible()
})
```

### 3.5 test #5 / #6 擬似コード

```text
test('認可: member は 403 page', async ({ memberPage }) => {
  await memberPage.route('**/admin/members*', (route) =>
    route.fulfill({ status: 403, json: { error: 'forbidden' } }),
  )
  await memberPage.goto('/admin/members')
  // 403 page or /profile redirect
  const ok =
    (await memberPage.getByText(/403|権限がありません/).isVisible().catch(() => false)) ||
    memberPage.url().includes('/profile')
  expect(ok).toBeTruthy()
  await expect(memberPage.getByRole('button', { name: /削除/ })).toHaveCount(0)
})

test('認可: anonymous は /login redirect', async ({ anonymousPage }) => {
  await anonymousPage.goto('/admin/members')
  expect(anonymousPage.url()).toContain('/login')
})
```

---

## 4. API mock pattern（`page.route()` 戦略）

| endpoint | URL pattern | method | mock 戦略 |
|----------|------------|--------|----------|
| `GET /admin/members` | `**/admin/members*` | GET | inline fixture（`memberListFixture` 3 件、うち 1 件は active で削除可能） |
| `POST /admin/members/:id/delete` | `**/admin/members/*/delete` | POST | reason 空 / null → 422 `{ error:'invalid_body', issues:[...] }` / reason 有 → 200 `memberDeleteResponse` |
| `GET /admin/audit` | `**/admin/audit*` | GET | `{ items: [auditEntry], nextCursor: null }`（`action='admin.member.deleted'` 1 件以上） |

> mock helper は spec 内 inline で記述（Phase 5 §2.2 方針）。Phase 8 で `apps/web/playwright/helpers/admin-mocks.ts` への抽出を予定するが本 sub-task の範囲外。

> mock URL pattern は `**/admin/...` の **suffix match** を採用し、API base URL（dev/staging/prod の絶対 URL 差分）に依存しない。

---

## 5. fixture object 標準形

`test.describe` の外、ファイル冒頭に const 定義する。phase-5 §4 の標準形に整合。

| 名前 | 形 | 用途 |
|------|-----|------|
| `memberListFixture` | `{ items: [{ id:'mem_001', displayName:'山田太郎', isDeleted:false, ... }, ...], nextCursor: null }` | GET `/admin/members` mock |
| `memberDeleteResponse` | `{ id: 'mem_001', isDeleted: true, deletedAt: '2026-05-09T00:00:00Z' }` | POST delete 200 response |
| `auditEntry` | `{ auditId: 'aud_001', actorId: 'admin_001', action: 'admin.member.deleted', targetId: 'mem_001', createdAt: '2026-05-09T00:00:00Z' }` | GET audit response |

> shape は `apps/api/src/routes/admin/member-delete.ts:53-56` の `DeleteBodyZ` parse 後のレスポンス、`apps/api/src/routes/admin/audit.ts:144` の audit response shape に同型であること（contract test 2d で別途検証される）。

---

## 6. 入出力・副作用

| 項目 | 内容 |
|------|------|
| 入力 | Playwright fixture (`adminPage` / `memberPage` / `anonymousPage`) のみ。実 D1 / 実 API 呼び出しなし |
| 出力 | `pnpm test:e2e` の 5 test green + 1 test skipped、レポート（`apps/web/playwright-report/`） |
| 副作用 | なし（`page.route()` mock 完結。実 fetch・実 D1 書込みなし） |
| 環境変数 | 既存 `apps/web/playwright.config.ts` の baseURL に従う。本 spec で env 追加なし |

---

## 7. テスト方針

1. **skip 禁止**: cascade preview 1 件以外で `test.skip` / `test.fixme` を追加しない（CONST_007）。Tier-aware standard で 1 件 skip が許容される根拠は phase-4.md §1 Q5（API 未実装）と CONST_007 例外条件 1（外部依存未実装）, 2（後続 Stage 持越し明記）の 2 条件同時該当。
2. **reason 必須 validation の二重化**: UI inline validation（textarea required）と API 422 ハンドリング（`DeleteBodyZ.parse` 失敗）の **両層** を test #3 でカバーする。どちらか一方だけのカバーは不可。
3. **二段確認の明示**: test #1 で「1 段目 button click」「2 段目 confirm dialog 表示」「dialog 内 reason 入力」「dialog 内 confirm button」の 4 ステップを別々に assert する（一段確認の取り違えを防ぐ）。
4. **audit 連動の確認方法**: test #4 は `GET /admin/audit` の mock を設定し、UI 上の audit 表示で `action='admin.member.deleted'` 文字列を検出する。actorId / targetId の一致は contract test 2d 側で検証する。
5. **認可 3 ロール**: admin（成功）/ member（403）/ anonymous（redirect）の **3 分岐すべて** を本 spec 内でカバー。Stage 1 fixture（`apps/web/playwright/fixtures/auth.ts`）を再利用し、新 fixture は禁止。
6. **D1 直接アクセス禁止**: `page.route()` mock のみ使用。`apps/web` から D1 binding を叩く UI 経路がないことを前提に、すべて HTTP レイヤで mock する（CLAUDE.md 重要不変条件 5）。
7. **selector 戦略**: `getByRole` / `getByLabel` / `getByText` を優先。色値依存・class 名依存のセレクタは禁止（OKLch 不変条件 / Stage 2 不変条件 5）。

---

## 8. ローカル実行コマンド

```bash
# 依存インストール（Node 24 + pnpm 10 を mise 経由で確実に使用）
mise exec -- pnpm install

# 本 spec のみ実行
mise exec -- pnpm --filter @ubm-hyogo/web test:e2e admin-member-delete.spec.ts

# 型チェック
mise exec -- pnpm --filter @ubm-hyogo/web typecheck

# lint
mise exec -- pnpm lint
```

> 全 E2E spec を流す場合は `mise exec -- pnpm --filter @ubm-hyogo/web test:e2e`。CI では `apps/web/playwright.config.ts` の retries 設定に従う。

---

## 9. DoD（Definition of Done）

| # | 項目 | 検証方法 |
|---|------|---------|
| 1 | ファイル `apps/web/playwright/tests/admin-member-delete.spec.ts` が存在する（180-220 行） | `wc -l apps/web/playwright/tests/admin-member-delete.spec.ts` |
| 2 | cascade preview を除く **5 test が green** | `pnpm --filter @ubm-hyogo/web test:e2e admin-member-delete.spec.ts` 結果 |
| 3 | cascade preview test が `test.skip(...)` で明示され、`// TODO(stage-3)` コメント付き（fail / error にしない） | spec 静的検査 + Playwright report の `skipped: 1` |
| 4 | `pnpm typecheck` pass（spec ファイル含む） | コマンド exit code 0 |
| 5 | `pnpm lint` pass | コマンド exit code 0 |
| 6 | 認可 3 ロール（admin / member / anonymous）すべて分岐 test 存在 | spec 内 `adminPage` / `memberPage` / `anonymousPage` 出現確認 |
| 7 | mock は `page.route()` のみ。`fetch` / `node:fetch` / 実 API 呼び出しなし | spec 内 grep（`page.route(` 出現 ≥ 3、直接 `fetch(` 出現 = 0） |
| 8 | reason 必須 validation を UI inline と API 422 の **両層** で確認 | test #3 内に inline error assertion と 422 mock の両方が存在 |
| 9 | 新 fixture を追加していない（`adminPage` / `memberPage` / `anonymousPage` 再利用のみ） | `apps/web/playwright/fixtures/` に diff なし |
| 10 | skip は cascade preview の **1 件のみ** | spec 内 `test.skip` 出現 = 1、`test.fixme` 出現 = 0 |

---

## 10. 持越し記録（Stage 3 への送り）

| 項目 | 内容 |
|------|------|
| 持越し対象 | cascade preview test（test #2） |
| 持越し理由 | `/admin/members/:id/delete-preview` または同等の cascade preview endpoint が **API 未実装**。phase-4.md §1 Q5 にて `grep -rn "delete-preview\|deletePreview\|cascade.*preview"` 結果 0 件で確認済 |
| CONST_007 例外条件該当 | (1) 外部/未実装依存（API 未実装）/ (2) 後続 Stage 持越し明記 — **2 条件同時該当** |
| 実施場所 | `docs/30-workflows/e2e-quality-uplift-stage-3/`（後続ワークフロー） |
| 復活条件 | Stage 3 で cascade preview API が実装され次第、本 spec の test #2 を `test.skip` から active 化する。Stage 3 phase-4 で `grep` 再実行し endpoint 実在を確認すること |
| spec 内記述 | `test.skip('cascade preview（API 未実装・Stage 3 持越し）', ...)` + `// TODO(stage-3): cascade preview API 未実装` コメント |
| トレーサビリティ | phase-4.md §1 Q5 / phase-5.md §3.3 / 本仕様書 §3 #2 / Stage 2 index.md §「サブタスク構成」表 2c 行 |

---

## 11. 不変条件チェック

| # | 不変条件 | 本 spec での担保 |
|---|---------|----------------|
| 1 | 既存 API endpoint surface のみ利用、新 endpoint・D1 schema 変更禁止 | mock 対象は `member-delete.ts` / `audit.ts` の既存 endpoint のみ。新 endpoint mock を追加しない |
| 2 | `apps/web` から D1 直接アクセス禁止 | spec は `page.route()` で HTTP 層を mock。D1 binding 参照なし |
| 3 | OKLch 正本（HEX 直書き禁止） | selector に色値を使用しない（`getByRole` / `getByLabel` / `getByText` のみ） |
| 4 | 既存 fixture 再利用、新 fixture 禁止 | `adminPage` / `memberPage` / `anonymousPage`（`apps/web/playwright/fixtures/auth.ts:1-67`）のみ使用 |
| 5 | reason は zod schema で必須（`DeleteBodyZ`） | test #3 で 422 を mock し、UI inline error を検証 |
| 6 | spec のみ作成、コード生成は範囲外 | 本仕様書は `.spec.ts` 1 ファイルの test 構造のみ規定 |
| 7 | E2E は決定論的 | mock counter / state を test scope で完結。test 間共有 state なし |

---

## 12. 依存・ブロッカー

| 項目 | 状態 |
|------|------|
| API 実装ブロッカー | **なし**。`POST /admin/members/:id/delete`（`apps/api/src/routes/admin/member-delete.ts:44`）/ `GET /admin/audit`（`apps/api/src/routes/admin/audit.ts:144`）はいずれも実装済 |
| Stage 1 完了前提 | `signSession()` 活性化済み・`adminPage` / `memberPage` / `anonymousPage` fixture 整備済（Stage 1 完了済） |
| Phase 1-3 GO | 完了済（Stage 2 index.md「Phase 1-13 ステータス」表参照） |
| 他 sub-task 依存 | なし（2a / 2b / 2d とは並列実行可能。2d contract test と endpoint shape を共有するが互いに独立） |
| 後続持越し | cascade preview のみ Stage 3 へ持越し（§10 参照） |

---

## 参照

- 本仕様書の上位設計: `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/index.md`
- 要件: `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/phase-1.md`
- 設計: `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/phase-2.md`
- TDD Red 設計: `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/phase-4.md` §1 Q3 Q5 / §3.3 / §4
- TDD Green 設計: `docs/30-workflows/completed-tasks/e2e-quality-uplift-stage-2/phase-5.md` §3.3 / §4
- API 実装（参照のみ・変更禁止）:
  - `apps/api/src/routes/admin/member-delete.ts`（delete L44 / restore L121 / `DeleteBodyZ` L10 / 422 path L53-56）
  - `apps/api/src/routes/admin/audit.ts`（GET L144）
- Fixture: `apps/web/playwright/fixtures/auth.ts`（L1-67）
- 不変条件正本: `CLAUDE.md` 「重要な不変条件」「UI prototype alignment / MVP recovery」「不変条件（task-02..22 共通）」
