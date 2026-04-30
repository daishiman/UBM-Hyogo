# Phase 6 成果物 — 異常系検証 (08a)

## 1. 目的と Phase 5 引き取り

Phase 5 で確定した 5 種 verify suite の signature と runbook 7 ステップに対し、`apps/api` で起こりうる failure を **12 カテゴリ** で網羅し、各 category × 関連 endpoint × expected status のマトリクスとして固定する。sync 失敗 / consent 撤回 / 削除済み / AuthGateState の 4 特例は **専用 test 擬似コード**を残す。

## 2. failure cases（12 カテゴリ）

| # | カテゴリ | 発生条件 | 関連 endpoint | expected | 備考 / 不変条件 |
| --- | --- | --- | --- | --- | --- |
| F-1 | 401 (unauth) | 未ログインで保護領域 | `/me/*`, `/admin/*` | 401 | `session-guard` middleware / #5 |
| F-2 | 403 (forbidden) | member が admin endpoint を叩く | `/admin/*` | 403 | `require-admin` middleware / #5 |
| F-3 | 404 (resource) | 存在しない `:memberId` / `:sessionId` / `:queueId` | `/admin/members/:id`, `/admin/meetings/:id/attendance/:memberId` 他 | 404 | repository `findById` が null |
| F-4 | 404 (route, #11) | profile 直接編集 path への request | `PATCH /me/profile`, `PATCH /admin/members/:id/profile` | 404 | route 不在を恒久固定 / #11 |
| F-5 | 409 (conflict) | UNIQUE 制約違反（重複 attendance / tag queue resolve / magic token reuse） | `POST /admin/meetings/:id/attendance`, `POST /admin/tags/queue/:id/resolve` | 409 | D1 UNIQUE error → 409 |
| F-6 | 422 (zod parse fail) | 不正な body / query | 全 POST / PATCH + 一部 GET | 422 | zod issues 配列を返却 |
| F-7 | 5xx (D1 一時障害) | D1 binding が unreachable | 全 endpoint | 503 | retry hint header 推奨 |
| F-8 | sync 失敗（Forms API down） | Google Forms API が 502 / network error | `POST /admin/sync`, `POST /admin/sync/schema`, `POST /admin/sync/responses` | 502 | sync_jobs 行に `status=failed` を必ず残す |
| F-9 | consent 撤回 | `member_status.public_consent` が `consented` → `revoked` に変化 | `GET /public/members`, `GET /public/members/:id` | 該当 member 消える | #7 / #5 |
| F-10 | rules_declined | login 時に `rulesConsent != consented` | `POST /auth/magic-link`, `GET /auth/gate-state` | 200 + `gate=rules_declined` | enumeration 防止 |
| F-11 | deleted login | `is_deleted=1` member の再 login | `POST /auth/magic-link`, `GET /auth/gate-state` | 200 + `gate=deleted` | #7 |
| F-12 | unregistered | DB に `member_identities` が無い email で login 試行 | `POST /auth/magic-link` | 200 + `gate=unregistered` | enumeration 防止 |

## 3. category × endpoint matrix

| カテゴリ | public | me | admin | auth |
| :--- | :---: | :---: | :---: | :---: |
| F-1 401 | — | ✓ | ✓ | — |
| F-2 403 | — | — | ✓ | — |
| F-3 404 (resource) | — | — | ✓ | — |
| F-4 404 (route #11) | — | ✓ | ✓ (members/:id/profile) | — |
| F-5 409 | — | — | ✓ (attendance, tag queue, magic token) | — |
| F-6 422 | ✓ (query) | ✓ (body) | ✓ (body) | ✓ (body) |
| F-7 5xx | ✓ | ✓ | ✓ | ✓ |
| F-8 sync 502 | — | — | ✓ (sync/*) | — |
| F-9 consent 撤回 | ✓ | — | — | — |
| F-10 rules_declined | — | — | — | ✓ |
| F-11 deleted login | — | — | — | ✓ |
| F-12 unregistered | — | — | — | ✓ |

## 4. 特例テスト擬似コード

### 4-1 sync 失敗（F-8 / #1）

```ts
// apps/api/src/routes/admin/responses-sync.contract.spec.ts
it('returns 502 + sync_jobs.status=failed when Forms API is unreachable', async () => {
  server.use(
    http.get('https://forms.googleapis.com/v1/forms/:formId/responses', () =>
      HttpResponse.error()
    )
  )
  const res = await app.request('/admin/sync/responses', {
    method: 'POST',
    headers: adminCookie(),
  })
  expect(res.status).toBe(502)
  const job = await testDb
    .prepare("SELECT * FROM sync_jobs WHERE kind='responses' ORDER BY started_at DESC LIMIT 1")
    .first()
  expect(job.status).toBe('failed')
})
```

### 4-2 consent 撤回（F-9 / #7）

```ts
// apps/api/src/routes/public/__tests__/members.contract.spec.ts
it('member excluded when publicConsent revoked', async () => {
  await fixtures.members.create({ count: 1 })
  await testDb
    .prepare('UPDATE member_status SET public_consent=? WHERE member_id=?')
    .bind('revoked', 'm-1')
    .run()
  const body = await (await app.request('/public/members')).json()
  expect(body.members.find((m: any) => m.memberId === 'm-1')).toBeUndefined()
})
```

### 4-3 AuthGateState 4 種（F-10 / F-11 / F-12 + 正常）

```ts
// apps/api/src/routes/auth/__tests__/gate-state.contract.spec.ts
it.each([
  ['unregistered@example.com', 'unregistered'],
  ['rules_declined@example.com', 'rules_declined'],
  ['deleted@example.com', 'deleted'],
  ['ok@example.com', 'sent'],
])('email=%s -> gate=%s', async (email, expected) => {
  const res = await app.request('/auth/magic-link', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  expect(res.status).toBe(200)
  const body = await res.json()
  expect(body.gate).toBe(expected)
})
```

### 4-4 profile 編集 404（F-4 / #11）

```ts
// apps/api/src/routes/me/__tests__/profile-edit-not-found.contract.spec.ts
it.each([
  ['PATCH /me/profile', 'PATCH', '/me/profile', memberCookie()],
  ['PATCH /admin/members/:id/profile', 'PATCH', '/admin/members/m-1/profile', adminCookie()],
])('%s -> 404 (#11 profile 編集なし)', async (_label, method, path, cookie) => {
  const res = await app.request(path, {
    method,
    headers: { ...cookie, 'content-type': 'application/json' },
    body: JSON.stringify({ fullName: 'X' }),
  })
  expect(res.status).toBe(404)
})
```

### 4-5 重複 attendance 409（F-5）

```ts
// apps/api/src/routes/admin/attendance.test.ts (追加)
it('returns 409 on duplicate attendance insert', async () => {
  await fixtures.meetings.session({ id: 's-1' })
  await fixtures.members.create({ count: 1 })
  const body = JSON.stringify({ memberIds: ['m-1'] })
  const headers = { ...adminCookie(), 'content-type': 'application/json' }
  await app.request('/admin/meetings/s-1/attendance', { method: 'POST', headers, body })
  const res = await app.request('/admin/meetings/s-1/attendance', { method: 'POST', headers, body })
  expect(res.status).toBe(409)
})
```

## 5. 不変条件カバレッジ（failure 経由）

| 不変条件 | failure | 観測点 |
| --- | --- | --- |
| #1 schema 固定しすぎない | F-8 sync 失敗 | sync_jobs.failed が残っても extraFields 列の保持構造は崩れない |
| #2 responseEmail system field | F-6 zod parse fail | body に `responseEmail` を含めると 422 |
| #5 3 層分離 | F-1 401, F-2 403 | middleware で必ず止まる |
| #6 apps/web → D1 直 import 禁止 | (lint test) | 違反時 lint suite が即 fail |
| #7 論理削除 | F-9 consent 撤回, F-11 deleted login | `is_deleted=1` / `revoked` で除外 |
| #11 profile 編集なし | F-4 | 404 で恒久固定 |

## 6. 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 4 verify suite | F-1〜F-12 を 5 種 suite に逆配賦（verify-suite-matrix.md §5） |
| Phase 7 AC matrix | failure × AC マッピング |
| 下流 09a smoke | staging で同 failure を Playwright から再現可能性確認 |

## 7. 多角的チェック観点

- 不変条件 **#1**: F-8 sync 失敗時に `extraFields` 列を保持する経路を test として残す
- 不変条件 **#2**: F-6 zod fail で `responseEmail` を fields に含めると拒絶
- 不変条件 **#5**: F-1 / F-2 で 3 層分離が破られない
- 不変条件 **#7**: F-9 / F-11 で論理削除と consent 撤回が `/public/members` から member を必ず除外
- 不変条件 **#11**: F-4 で profile 編集 path 404 を恒久固定
- a11y / 無料枠: failure test も in-memory で実行、CI 0 円維持

## 8. 完了条件チェック

- [x] failure cases ≥ 10 カテゴリ（12 カテゴリ）
- [x] category × endpoint matrix（§3）
- [x] sync / consent / AuthGateState 特例 test 擬似コード（§4）
- [x] 不変条件カバレッジ（§5）

## 9. 次 Phase への引き継ぎ

- 12 failure を Phase 7 ac-matrix.md の異常系列に展開
- F-3 404 / F-5 409 / F-7 5xx は admin 系 endpoint で個別に test ケース化（既存 admin route test の補強として）
