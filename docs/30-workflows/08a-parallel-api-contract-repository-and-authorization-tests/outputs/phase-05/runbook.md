# Phase 5 — 実装 Runbook（7 ステップ）

## Step 1: 依存追加

```bash
mise exec -- pnpm --filter @ubm-hyogo/api add -D \
  @vitest/coverage-v8 \
  better-sqlite3 \
  msw

mise exec -- pnpm --filter @ubm-hyogo/shared add -D vitest
```

> 既存 vitest 2.x / miniflare 4.x は流用。`better-sqlite3` は native build のため CI では `actions/setup-node` の `cache: pnpm` を経由して build artifact を再利用する。

## Step 2: vitest.config.ts 差分

```ts
// root vitest.config.ts (apps/api/package.json scripts use --root=../.. --config=vitest.config.ts)
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    setupFiles: ['./test/helpers/setup.ts'],
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      thresholds: { statements: 85, branches: 80, functions: 85, lines: 85 },
      include: [
        'src/routes/**',
        'src/repository/**',
        'src/middleware/**',
        'src/use-cases/**',
        'src/view-models/**',
        'src/workflows/**',
      ],
      exclude: [
        '**/__tests__/**',
        '**/__fixtures__/**',
        '**/__fakes__/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/*.contract.spec.ts',
        'src/**/index.ts',
      ],
    },
    typecheck: {
      enabled: false, // brand 型 type-test は packages/shared 側で実行
      include: ['**/*.type-test.ts'],
    },
  },
})
```

## Step 3: helpers / fixtures / mocks 整備

ディレクトリ構造（新規追加分）:

```
apps/api/
├── test/
│   ├── helpers/
│   │   ├── setup.ts        # vitest setupFiles
│   │   ├── app.ts          # createTestApp() — Hono test app + binding 注入
│   │   ├── auth.ts         # adminCookie() / memberCookie()
│   │   ├── seed.ts         # fixtures namespace (members / meetings / tags / responses…)
│   │   └── db.ts           # createTestDb() / resetDb() — fakeD1 or sqlite 切替
│   └── mocks/
│       ├── server.ts       # msw setupServer
│       └── forms-api.ts    # Forms API handlers (extraFields 経路含む)
└── tests/
    └── lint/
        └── import-boundary.test.ts  # grep based
```

### Step 3-a `setup.ts`

```ts
// apps/api/test/helpers/setup.ts
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from '../mocks/server'
import { createTestDb, resetDb } from './db'

beforeAll(async () => {
  globalThis.__testDb__ = await createTestDb()
  server.listen({ onUnhandledRequest: 'error' })
})
afterEach(async () => {
  await resetDb(globalThis.__testDb__)
  server.resetHandlers()
})
afterAll(() => server.close())
```

### Step 3-b `auth.ts`

```ts
// apps/api/test/helpers/auth.ts
import { signSession } from '../../src/_shared/session'

export const adminCookie = (adminUserId = 'admin-1') => ({
  Cookie: `__Secure-authjs.session-token=${signSession({ adminUserId })}`,
})
export const memberCookie = (memberId = 'm-1') => ({
  Cookie: `__Secure-authjs.session-token=${signSession({ memberId })}`,
})
```

### Step 3-c `seed.ts`

```ts
// apps/api/test/helpers/seed.ts
import * as members from '../../src/repository/__fixtures__/members'
import * as admin from '../../src/repository/__fixtures__/admin'

export const fixtures = {
  members: {
    create: (opts: { count?: number; deletedCount?: number }) => members.seed(opts),
    deleted: () => members.seedDeleted(),
  },
  adminUsers: { admin1: admin.seedAdmin() },
  meetings: { session: (opts) => /* ... */ },
  tags: { definitions: () => /* ... */, queue: () => /* ... */ },
  responses: { withExtraFields: () => /* ... */ }, // 不変条件 #1
}
```

### Step 3-d `forms-api.ts`（msw handlers）

```ts
// apps/api/test/mocks/forms-api.ts
import { http, HttpResponse } from 'msw'
import baseFixture from '../../tests/fixtures/forms-get'

export const formsApiHandlers = [
  http.get('https://forms.googleapis.com/v1/forms/:formId/responses', () =>
    HttpResponse.json({
      responses: [
        ...baseFixture.responses,
        // 不変条件 #1: schema 外フィールドを含む応答を 1 件
        { ...baseFixture.responses[0], extraFields: { unknownKey: 'unknownValue' } },
      ],
    })
  ),
]
```

## Step 4: contract test 補強（Phase 4 §3.1）

### 補強対象

| # | path | 種別 |
| --- | --- | --- |
| 1 | `src/routes/me/__tests__/profile.contract.spec.ts` | 新規（正常 + 401 + 不変 #2） |
| 2 | `src/routes/me/__tests__/visibility-request.contract.spec.ts` | 新規 |
| 3 | `src/routes/me/__tests__/delete-request.contract.spec.ts` | 新規 |
| 4 | `src/routes/me/__tests__/profile-edit-not-found.contract.spec.ts` | 新規（#11） |
| 5 | `src/routes/public/__tests__/members.contract.spec.ts` | 新規（zod parse + #7 deleted 除外） |
| 6 | `src/routes/public/__tests__/member-profile.contract.spec.ts` | 新規 |
| 7 | `src/routes/public/__tests__/stats.contract.spec.ts` | 新規 |
| 8 | `src/routes/public/__tests__/form-preview.contract.spec.ts` | 新規 |
| 9 | `src/routes/admin/responses-sync.contract.spec.ts` | 既存 strengthen（#1 extraFields） |
| 10〜| `src/routes/admin/<route>.test.ts` を順次 contract 強化（zod parse 追加） | strengthen |

各 spec で `<ViewModel>Schema.parse(body)` を必ず呼ぶ。詳細擬似コードは `test-signatures.md`。

## Step 5: repository unit 補強（Phase 4 §3.2）

### 新規

```
src/repository/__tests__/dashboard.test.ts
src/repository/__tests__/publicMembers.test.ts
```

各ファイルで CRUD/集計/list/edge を `it.each` で 5 ケース最低。fixture は `__fixtures__/d1mock.ts` を流用し 5 件以上の seed を保証。

### 既存強化

- `members.test.ts`: deleted 行を含む list を `is_deleted=1` filter で観測（不変条件 #7）
- `responses.test.ts`: `extraFields` 列を保存できる（不変条件 #1）
- 各既存 test の fixture が 5 件未満であれば `seed.members.create({ count: 5 })` で拡張

## Step 6: authz / type / lint suite

### 6-a authz 集約 spec

```ts
// apps/api/src/middleware/__tests__/authz.spec.ts
import { describe, it, expect } from 'vitest'
import { createTestApp } from '../../../test/helpers/app'
import { adminCookie, memberCookie } from '../../../test/helpers/auth'

const app = createTestApp()

const matrix: Array<[string, string, RequestInit | undefined, number]> = [
  ['anon → public', 'GET /public/members', undefined, 200],
  ['anon → me', 'GET /me/profile', undefined, 401],
  ['anon → admin', 'GET /admin/dashboard', undefined, 401],
  ['member → public', 'GET /public/members', { headers: memberCookie() }, 200],
  ['member → me', 'GET /me/profile', { headers: memberCookie() }, 200],
  ['member → admin', 'GET /admin/dashboard', { headers: memberCookie() }, 403],
  ['admin → public', 'GET /public/members', { headers: adminCookie() }, 200],
  ['admin → me', 'GET /me/profile', { headers: adminCookie() }, 200],
  ['admin → admin', 'GET /admin/dashboard', { headers: adminCookie() }, 200],
]

it.each(matrix)('%s (%s) -> %d', async (_label, route, init, expected) => {
  const [method, path] = route.split(' ')
  const res = await app.request(path, { method, ...init })
  expect(res.status).toBe(expected)
})
```

### 6-b brand 型 type test

```ts
// packages/shared/src/__tests__/brand.type-test.ts
import { test } from 'vitest'
import type { ResponseId, MemberId, MeetingSessionId } from '../types/brands'

test('ResponseId は MemberId に代入不可', () => {
  const r = 'r_xxx' as ResponseId
  // @ts-expect-error - brand mismatch
  const m: MemberId = r
  void m
})

test('responseEmail は form fields enum に含めない (#2)', () => {
  type FormFieldKey = 'fullName' | 'nickname' /* ... 31 項目（responseEmail を含めない）*/
  // @ts-expect-error - responseEmail は system field
  const k: FormFieldKey = 'responseEmail'
  void k
})

test('MeetingSessionId と MemberId の混同', () => {
  const s = 's_1' as MeetingSessionId
  // @ts-expect-error
  const m: MemberId = s
  void m
})
```

### 6-c lint / boundary

```ts
// apps/api/tests/lint/import-boundary.test.ts
import { execSync } from 'node:child_process'
import { it, expect } from 'vitest'

it('apps/web は D1Database / drizzle-orm/d1 を import しない (#6)', () => {
  const result = execSync(
    `grep -rE "D1Database|drizzle-orm/d1|@cloudflare/d1" apps/web/src || true`,
    { cwd: process.cwd().replace(/apps\/api$/, ''), encoding: 'utf-8' }
  )
  expect(result.trim()).toBe('')
})

it('apps/web は apps/api/src/repository から直接 import しない (#6)', () => {
  const result = execSync(
    `grep -rE "from ['\\\"](\\.\\.\\/)+api\\/src\\/repository" apps/web/src || true`,
    { cwd: process.cwd().replace(/apps\/api$/, ''), encoding: 'utf-8' }
  )
  expect(result.trim()).toBe('')
})
```

## Step 7: CI workflow yml placeholder

```yaml
# .github/workflows/api-tests.yml
name: api-tests
on:
  pull_request:
    paths:
      - 'apps/api/**'
      - 'packages/shared/**'
      - '.github/workflows/api-tests.yml'
  push:
    branches: [dev, main]
concurrency:
  group: api-tests-${{ github.ref }}
  cancel-in-progress: true
jobs:
  vitest:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @ubm-hyogo/shared typecheck
      - run: pnpm --filter @ubm-hyogo/shared test
      - run: pnpm --filter @ubm-hyogo/api test --coverage
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: api-coverage
          path: apps/api/coverage/
          retention-days: 7
```

## Sanity check

```bash
# 全 suite
mise exec -- pnpm --filter @ubm-hyogo/api test
# coverage
mise exec -- pnpm --filter @ubm-hyogo/api test --coverage
mise exec -- jq '.total.statements.pct' apps/api/coverage/coverage-summary.json
# typecheck (brand 型 type test)
mise exec -- pnpm --filter @ubm-hyogo/shared test
# lint boundary 単独
mise exec -- pnpm --filter @ubm-hyogo/api test -- import-boundary
```

期待値:
- vitest pass 件数 ≥ 274
- statements coverage ≥ 85
- type test の `@ts-expect-error` が 3 行以上で正常 fail（削除すると tsc が通って test fail）
- import-boundary grep 0 件
