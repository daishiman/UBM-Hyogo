[実装区分: 実装仕様書]

> CONST_004 判定根拠: 本 Phase 6 は sub-task 2a の Playwright spec（実コード）に対する境界条件・認可線引きの **テスト拡充** を仕様化する。出力ファイル `apps/web/playwright/tests/admin-requests.spec.ts` は CI で実行される TypeScript ソースであり、ラベル `taskType=docs-only` より実態優先（CONST_004）に従い実装仕様書扱い。

---

# Phase 6: テスト拡充 — sub-task 2a `/admin/requests` E2E

## 1. メタ情報

| 項目 | 値 |
|------|-----|
| sub-task ID | `2a` |
| 対象 spec | `apps/web/playwright/tests/admin-requests.spec.ts` |
| coverageTier | standard（lines >= 70%, critical smoke 100%） |
| 焦点 | 認可境界（403 vs `/login` redirect）、reject reason 必須 validation、race 決定論観測 |

> Phase 5 の 6 件最小テストに対し、**境界条件と認可線引きの assertion** を spec 内に追加する。test 件数は 6 件のまま、各 test 内で expect を追加する形で拡充する（test 追加は行わない、CONST_007 単一サイクル整合）。

---

## 2. 認可境界の網羅（admin-only access path）

| # | role | 入力 cookie | API 応答 | UI 期待 | 拡充 assertion |
|---|------|-------------|---------|---------|---------------|
| 5 | member | `__Secure-authjs.session-token`（isAdmin=false） | 403 JSON（`requireAdmin`） | admin layout で 403 page **または** `/profile` redirect | `await expect(memberPage).toHaveURL(/\/profile|\/admin\/requests/)` AND `getByText(/403\|権限がありません/i).or(/* redirect 済 */)` を OR 評価 |
| 6 | anonymous | cookie 無し | 401 JSON | `/login` redirect | `await expect(anonymousPage).toHaveURL(/\/login/)` |
| 1–4 | admin | `__Secure-authjs.session-token`（isAdmin=true） | 200 | admin UI 描画 | `getByRole('table')` または `getByRole('row')` 可視 |

### 2.1 403 vs `/login` redirect の判定方針

| 入力 | API 応答 | UI 期待 | spec 観点 |
|------|---------|---------|-----------|
| cookie 無し | 401 | `/login` redirect | URL アサーション（`toHaveURL(/\/login/)`） |
| cookie 有 + isAdmin=false | 403 | 403 page **または** `/profile` redirect | URL OR DOM のいずれか可（`toHaveURL.or(getByText)` 等価表現で吸収） |
| cookie 有 + isAdmin=true | 200 | admin UI 描画 | DOM 要素可視 |

> UI 実装変更耐性のため、**URL / DOM のどちらか一方** を確認すれば足りる OR 設計とする。`expect.poll` で吸収しても可。

### 2.2 admin 専用要素の不可視確認（test 5 の追加 assertion）

```text
test('認可: member は /login?gate=admin_required redirect', async ({ memberPage }) => {
  await memberPage.goto('/admin/requests')
  // OR 条件: profile redirect が起きているか、または 403 page DOM が見えている
  await expect(memberPage.locator('body')).toBeVisible()
  // admin 専用要素（approve / reject ボタン）は不可視
  await expect(memberPage.getByRole('button', { name: /承認|approve/i })).toHaveCount(0)
  await expect(memberPage.getByRole('button', { name: /却下|reject/i })).toHaveCount(0)
})
```

---

## 3. reject reason 必須 validation の境界拡充（test 3）

`adminRequestResolveBodySchema`（`packages/shared`）と `apps/api/src/routes/admin/requests.ts:263-266` を二重 gate として、UI 側 modal の inline error と API 422 の両経路を確認する。

| step | 操作 | 期待 UI | 期待 Network |
|------|------|---------|-------------|
| 1 | reject ボタン click | modal 表示 | なし |
| 2 | reason 空のまま submit | inline error 可視（`getByRole('alert')` または `getByText(/必須\|required/i)`）。modal は閉じない | POST 送信 0 回（client side validation） |
| 3 | reason に "spam" 入力 → submit | modal 閉じる、行 detached | POST 1 回 / body `{ resolution:'reject', resolutionNote:'spam' }` |

> step 2 の「POST 送信 0 回」は `let postCalls = 0` を test scope で保持し、`route.fulfill` 内で `postCalls += 1` してから assertion する。client side validation が動作していない場合は API 422 を観測することで二重 gate を成立させる（OR 条件）。

---

## 4. race 決定論観測の境界拡充（test 4）

| 観点 | 拡充内容 |
|------|---------|
| call count | `expect(calls).toBe(2)` を最終 assert として固定 |
| 1 回目 status code | 200 / `requestStatus:'resolved'` |
| 2 回目 status code | 409 / `error:'already_resolved'` / `currentStatus:'resolved'` |
| UI 通知 | `getByRole('alert')` または `getByText(/既に処理済み\|already_resolved/i)` のいずれかが visible |
| flaky 耐性 | 2 回目 click は row detach 後となる可能性があるため `.catch(() => {})` で握る |

---

## 5. 失敗系・境界条件の追加マトリクス（test 内 expect 追加）

| spec | test | 追加 assertion | 根拠 |
|------|------|---------------|------|
| 2a | test 2（approve） | POST request body の Content-Type が `application/json` であること、body parse 結果に `resolution:'approve'` が **唯一の resolution key** であること | `adminRequestResolveBodySchema` |
| 2a | test 3（reject） | reason 空 submit で POST が **0 回**、または API 422 のいずれか OR | client / server 二重 gate |
| 2a | test 4（race） | `expect(calls).toBe(2)` 必須、2 回目 click 後の row detach 確認 | stale 409 mock の決定論性 |
| 2a | test 5（member） | approve / reject ボタンが `toHaveCount(0)` | admin 専用 UI 不可視 |
| 2a | test 6（anonymous） | URL に `/login` を含むことに加え、`/admin` 配下の admin DOM が描画されていない（`getByRole('table')` 不可視） | redirect 完了確認 |

---

## 6. critical smoke 100% への寄与

| route | smoke（Stage 1） | mutation（Stage 2 / 2a） | 計 |
|-------|------------------|-------------------------|-----|
| `/admin/requests` | ✅ | ✅ approve / reject / race / 認可 3 ロール | 100% |

> 本サブタスク 2a 単体で `/admin/requests` の critical smoke 100% を達成する。他 admin route（identity-conflicts / members / audit）は 2b / 2c が担当（独立）。

---

## 7. coverage 目標値（standard tier）

| 観点 | 目標 | 達成手段 |
|------|------|---------|
| line coverage（apps/web 全体） | >= 70% | 既存 baseline + Stage 2 spec で +N%、本 2a 単体での寄与は限定的（Playwright spec は vitest line cov に直接乗らない） |
| critical route smoke 成功率 | 100% | §6 |
| `/admin/requests` の主要 mutation flow | approve / reject / race の 3 path カバー | §3, §4 |

> 70% 未達観測時は親 workflow Phase 9 で追加 vitest unit test を補完。本サブタスク 2a 単体の責務は smoke 100% 達成までとする。

---

## 8. 不変条件チェック（拡充後）

| # | 不変条件 | 適合 |
|---|---------|------|
| 1 | 既存 API のみ接続 | 拡充内容も既存 endpoint surface のみ |
| 2 | OKLch トークン正本（HEX 直書き禁止） | selector 色値依存なし |
| 4 | D1 直接アクセス禁止 | `page.route()` 限定 |
| 5 | 既存 fixture 再利用 | 3 fixture を継続利用 |
| Stage 2 横断 | `test.skip` 禁止 | 6 件すべて `test()`、拡充は test 内 expect 追加で実施（test 件数増減なし） |

---

## 9. Phase 6 完了定義

- [x] 認可境界（admin / member / anonymous）の 3 ロール × 1 route assertion 設計済（§2）
- [x] 403 vs `/login` の判定方針確定（§2.1）
- [x] admin 専用要素不可視 assertion（§2.2）追加済
- [x] reject reason 必須 validation の二重 gate（§3）確定
- [x] race 決定論観測の境界（§4）確定
- [x] 失敗系・境界条件マトリクス（§5）確定
- [x] critical smoke 100% 寄与経路（§6）確定

> Phase 7（カバレッジ確認）へ進める。
