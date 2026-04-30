# Phase 5 — Test Signatures（5 種 suite 擬似コード）

すべて採用案 C（in-memory sqlite + msw）を前提。`createTestApp()` は `apps/api/test/helpers/app.ts` を使う。

## 1. contract test

### 1-a `/public/members`

```ts
// apps/api/src/routes/public/__tests__/members.contract.spec.ts
import { describe, it, expect } from 'vitest'
import { createTestApp } from '../../../../test/helpers/app'
import { fixtures } from '../../../../test/helpers/seed'
import { PublicMemberListViewSchema } from '../../../view-models/public/public-member-list-view'

const app = createTestApp()

describe('GET /public/members', () => {
  it('returns PublicMemberListView shape (AC-1)', async () => {
    await fixtures.members.create({ count: 5 })
    const res = await app.request('/public/members?density=comfy')
    expect(res.status).toBe(200)
    expect(() => PublicMemberListViewSchema.parse(await res.json())).not.toThrow()
  })

  it('excludes members with publicConsent != consented (#5)', async () => {
    await fixtures.members.create({ count: 5 })
    const body = await (await app.request('/public/members')).json()
    expect(body.members.every((m: any) => m.publicConsent === 'consented')).toBe(true)
  })

  it('excludes is_deleted=1 (#7)', async () => {
    await fixtures.members.create({ count: 5, deletedCount: 2 })
    const body = await (await app.request('/public/members')).json()
    expect(body.members).toHaveLength(3)
  })

  it.each(['q', 'zone', 'status', 'tag', 'sort', 'density'])(
    'accepts %s query param',
    async (key) => {
      const res = await app.request(`/public/members?${key}=test`)
      expect(res.status).toBe(200)
    }
  )

  it('returns 422 on invalid sort value', async () => {
    const res = await app.request('/public/members?sort=__invalid__')
    expect(res.status).toBe(422)
  })
})
```

### 1-b `/me/profile` + #11

```ts
// apps/api/src/routes/me/__tests__/profile.contract.spec.ts
describe('GET /me/profile', () => {
  it('200 + MeProfileView shape (AC-1)', async () => {
    await fixtures.members.create({ count: 1 })
    const res = await app.request('/me/profile', { headers: memberCookie() })
    expect(res.status).toBe(200)
    expect(() => MeProfileViewSchema.parse(await res.json())).not.toThrow()
  })

  it('401 when anonymous (#5)', async () => {
    const res = await app.request('/me/profile')
    expect(res.status).toBe(401)
  })
})

// apps/api/src/routes/me/__tests__/profile-edit-not-found.contract.spec.ts
describe('PATCH /me/profile (#11)', () => {
  it('returns 404 — profile 直接編集 endpoint は存在しない', async () => {
    const res = await app.request('/me/profile', {
      method: 'PATCH',
      headers: { ...memberCookie(), 'content-type': 'application/json' },
      body: JSON.stringify({ fullName: 'X' }),
    })
    expect(res.status).toBe(404)
  })
})
```

### 1-c `/admin/sync/responses` + #1

```ts
// apps/api/src/routes/admin/responses-sync.contract.spec.ts
describe('POST /admin/sync/responses (#1 schema 固定しすぎない)', () => {
  it('saves extraFields when Forms response contains unknown keys', async () => {
    const res = await app.request('/admin/sync/responses', {
      method: 'POST',
      headers: adminCookie(),
    })
    expect(res.status).toBe(200)
    const row = await testDb
      .prepare('SELECT extra_fields FROM member_responses ORDER BY created_at DESC LIMIT 1')
      .first()
    expect(JSON.parse(row.extra_fields)).toMatchObject({ unknownKey: 'unknownValue' })
  })

  it('returns 502 + sync_jobs.failed when Forms API is down (F-8)', async () => {
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
      .prepare("SELECT * FROM sync_jobs WHERE kind='responses' ORDER BY started_at DESC")
      .first()
    expect(job.status).toBe('failed')
  })
})
```

## 2. repository unit test

```ts
// apps/api/src/repository/__tests__/members.test.ts (拡張部抜粋)
describe('membersRepository', () => {
  it.each([
    ['findById returns row with brand MemberId', async () => {
      await fixtures.members.create({ count: 1 })
      const m = await membersRepo.findById(testDb, MemberId('m-1'))
      expect(m?.id).toBe('m-1')
    }],
    ['findByEmail looks up via member_identities', async () => { /* ... */ }],
    ['create inserts members + member_identities atomically', async () => { /* ... */ }],
    ['markDeleted sets is_deleted=1 and inserts deleted_members row (#7)', async () => {
      await fixtures.members.create({ count: 1 })
      await membersRepo.markDeleted(testDb, MemberId('m-1'), 'admin-1', 'reason')
      const row = await testDb
        .prepare('SELECT is_deleted FROM members WHERE id=?')
        .bind('m-1').first()
      expect(row.is_deleted).toBe(1)
      const dmRow = await testDb
        .prepare('SELECT * FROM deleted_members WHERE member_id=?')
        .bind('m-1').first()
      expect(dmRow).toBeTruthy()
    }],
    ['list excludes is_deleted unless includeDeleted=true', async () => { /* ... */ }],
  ])('%s', async (_label, fn) => { await fn() })
})
```

```ts
// apps/api/src/repository/__tests__/publicMembers.test.ts (新規)
describe('publicMembersRepository', () => {
  it('list excludes publicConsent != consented', async () => { /* ... */ })
  it('list excludes is_deleted=1', async () => { /* ... */ })
  it('filterByTag returns only matched tag', async () => { /* ... */ })
  it('search by q matches fullName / nickname', async () => { /* ... */ })
  it('sort=name uses fullName collation', async () => { /* ... */ })
})
```

## 3. authorization 9 マトリクス

```ts
// apps/api/src/middleware/__tests__/authz.spec.ts
const matrix: Array<[string, string, RequestInit | undefined, number]> = [
  ['anon→public',  'GET /public/members',   undefined,                            200],
  ['anon→me',      'GET /me/profile',       undefined,                            401],
  ['anon→admin',   'GET /admin/dashboard',  undefined,                            401],
  ['member→public','GET /public/members',   { headers: memberCookie() },          200],
  ['member→me',    'GET /me/profile',       { headers: memberCookie() },          200],
  ['member→admin', 'GET /admin/dashboard',  { headers: memberCookie() },          403],
  ['admin→public', 'GET /public/members',   { headers: adminCookie() },           200],
  ['admin→me',     'GET /me/profile',       { headers: adminCookie() },           200],
  ['admin→admin',  'GET /admin/dashboard',  { headers: adminCookie() },           200],
]

it.each(matrix)('%s (%s) -> %d', async (_label, route, init, expected) => {
  const [method, path] = route.split(' ')
  const res = await app.request(path, { method, ...init })
  expect(res.status).toBe(expected)
})
```

## 4. type test（compile-time）

```ts
// packages/shared/src/__tests__/brand.type-test.ts
import { test } from 'vitest'
import type { ResponseId, MemberId, MeetingSessionId, AdminUserId } from '../types/brands'

test('ResponseId !== MemberId (AC-4)', () => {
  const r = 'r_xxx' as ResponseId
  // @ts-expect-error
  const m: MemberId = r
  void m
})

test('responseEmail is system field, not a form field key (#2)', () => {
  type FormFieldKey = 'fullName' | 'nickname' | 'birthYear' /* ... 31 項目（responseEmail を含めない）*/
  // @ts-expect-error
  const k: FormFieldKey = 'responseEmail'
  void k
})

test('MeetingSessionId is not assignable to MemberId', () => {
  const s = 's_1' as MeetingSessionId
  // @ts-expect-error
  const m: MemberId = s
  void m
})

test('AdminUserId is not assignable to MemberId', () => {
  const a = 'admin-1' as AdminUserId
  // @ts-expect-error
  const m: MemberId = a
  void m
})
```

## 5. lint / boundary

```ts
// apps/api/tests/lint/import-boundary.test.ts
import { execSync } from 'node:child_process'
import { it, expect } from 'vitest'
import { resolve } from 'node:path'

const ROOT = resolve(process.cwd(), '../../')

it('apps/web は D1Database を直接 import しない (#6)', () => {
  const result = execSync(
    `grep -rE "D1Database|drizzle-orm/d1|@cloudflare/d1" apps/web/src || true`,
    { cwd: ROOT, encoding: 'utf-8' }
  )
  expect(result.trim()).toBe('')
})

it('apps/web は apps/api/src/repository を直接 import しない (#6)', () => {
  const result = execSync(
    `grep -rE "from ['\\\"](\\.\\.\\/)+api\\/src\\/repository" apps/web/src || true`,
    { cwd: ROOT, encoding: 'utf-8' }
  )
  expect(result.trim()).toBe('')
})
```

## 6. consent / AuthGateState（Phase 6 連携）

```ts
// apps/api/src/routes/auth/__tests__/gate-state.contract.spec.ts
it.each([
  ['unregistered@example.com', 'unregistered'],
  ['rules_declined@example.com', 'rules_declined'],
  ['deleted@example.com', 'deleted'],
  ['ok@example.com', 'sent'],
])('email=%s -> AuthGateState=%s', async (email, gate) => {
  const res = await app.request('/auth/magic-link', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  expect(res.status).toBe(200)
  const body = await res.json()
  expect(body.gate).toBe(gate)
})
```

## 7. consent 撤回（#7 + Phase 6 F-9）

```ts
// apps/api/src/routes/public/__tests__/members.contract.spec.ts (追加)
it('member with publicConsent revoked is excluded from /public/members (F-9)', async () => {
  await fixtures.members.create({ count: 1 })
  await testDb
    .prepare('UPDATE member_status SET public_consent=? WHERE member_id=?')
    .bind('revoked', 'm-1')
    .run()
  const body = await (await app.request('/public/members')).json()
  expect(body.members.find((m: any) => m.memberId === 'm-1')).toBeUndefined()
})
```
