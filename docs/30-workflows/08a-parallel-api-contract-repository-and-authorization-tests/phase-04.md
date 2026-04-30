# Phase 4: テスト戦略

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 08a-parallel-api-contract-repository-and-authorization-tests |
| Phase 番号 | 4 / 13 |
| Phase 名称 | テスト戦略 |
| 作成日 | 2026-04-26 |
| 前 Phase | 3 (設計レビュー) |
| 次 Phase | 5 (実装ランブック) |
| 状態 | pending |

## 目的

採用案 C（in-memory sqlite + msw）の上で、5 種 verify suite（contract / unit / authz / type / lint）の test signature を確定し、AC-1〜7 を 1:1 でカバーする matrix を作る。

## 実行タスク

- [ ] 5 種 verify suite の test signature 設計
- [ ] verify suite × AC matrix を `outputs/phase-04/verify-suite-matrix.md`
- [ ] coverage 目標 (statements 85% / branches 80%) を vitest.config に反映する placeholder
- [ ] 1 endpoint あたりの test ケース数の最低ライン

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/main.md | layout |
| 必須 | outputs/phase-03/main.md | 採用案 C |
| 必須 | doc/00-getting-started-manual/specs/01-api-schema.md | endpoint schema |
| 必須 | doc/00-getting-started-manual/specs/04-types.md | brand 型 |

## 5 種 verify suite

### 1. contract test

```ts
// apps/api/src/routes/public/__tests__/members.contract.spec.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { PublicMemberListViewSchema } from '@ubm/shared/viewmodel/public'

describe('GET /public/members', () => {
  beforeEach(seed.minimal)

  it('returns PublicMemberListView shape', async () => {
    const res = await app.request('/public/members?density=comfy')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(() => PublicMemberListViewSchema.parse(body)).not.toThrow()
  })

  it('excludes members with publicConsent != consented', async () => {
    const body = await (await app.request('/public/members')).json()
    expect(body.members.every((m: any) => m.publicConsent === 'consented')).toBe(true)
  })

  it('excludes members with isDeleted=true (#7)', async () => {
    const body = await (await app.request('/public/members')).json()
    expect(body.members.find((m: any) => m.memberId === fixtures.deletedMemberId)).toBeUndefined()
  })

  it.each(['q','zone','status','tag','sort','density'])('accepts %s query param', async (key) => {
    const res = await app.request(`/public/members?${key}=test`)
    expect(res.status).toBe(200)
  })
})
```

### 2. repository unit test

```ts
// apps/api/src/repository/__tests__/members.spec.ts
describe('membersRepository', () => {
  it.each([
    ['findById returns member with brand MemberId', () => /* ... */],
    ['findByEmail returns identity row', () => /* ... */],
    ['create inserts members + member_identities atomically', () => /* ... */],
    ['markDeleted sets is_deleted=1 and inserts deleted_members row', () => /* ... */],
    ['list excludes is_deleted=1 unless includeDeleted=true', () => /* ... */],
  ])('%s', async (_, fn) => { await fn() })
})
```

### 3. authorization test

```ts
// apps/api/src/middleware/__tests__/authz.spec.ts
const matrix: Array<[string, RequestInit | undefined, number]> = [
  ['anonymous + GET /admin/members', undefined, 401],
  ['member + GET /admin/members', { headers: memberCookie() }, 403],
  ['admin + GET /admin/members', { headers: adminCookie() }, 200],
  ['anonymous + GET /me', undefined, 401],
  ['member + GET /me', { headers: memberCookie() }, 200],
  ['anonymous + GET /public/stats', undefined, 200],
  // ... 9 ケース以上
]
it.each(matrix)('%s -> %d', async (_, init, expected) => {
  const res = await app.request(/* path from label */, init)
  expect(res.status).toBe(expected)
})
```

### 4. type test

```ts
// packages/shared/src/__tests__/type-tests.ts
import { test } from 'vitest'
import type { ResponseId, MemberId, AdminUserId } from '../types/brands'

test('ResponseId is not assignable to MemberId (#7 brand 型)', () => {
  const r: ResponseId = 'r_xxx' as ResponseId
  // @ts-expect-error - ResponseId は MemberId に代入不可
  const m: MemberId = r
  void m
})

test('responseEmail is not in form fields enum (#2)', () => {
  type FormFieldKey = 'fullName' | 'nickname' /* ... 31 項目 */
  // @ts-expect-error - responseEmail は system field
  const k: FormFieldKey = 'responseEmail'
  void k
})
```

### 5. lint / import boundary test

```ts
// apps/api/src/lint/__tests__/import-boundary.spec.ts
import { execSync } from 'node:child_process'
it('apps/web does NOT import @cloudflare/d1 / D1Database / drizzle-orm/d1 (#6)', () => {
  const result = execSync(
    `grep -rE "from ['\"]@cloudflare/d1['\"]|D1Database|drizzle-orm/d1" apps/web/src || true`,
    { encoding: 'utf-8' }
  )
  expect(result.trim()).toBe('')
})

it('apps/web does NOT import apps/api/repository/* directly (#6)', () => {
  const result = execSync(`grep -rE "from ['\"]\\.\\./api/repository" apps/web/src || true`, { encoding: 'utf-8' })
  expect(result.trim()).toBe('')
})
```

## verify suite × AC matrix

| AC | contract | unit | authz | type | lint |
| --- | --- | --- | --- | --- | --- |
| AC-1 全 endpoint contract green | ✓ | — | — | — | — |
| AC-2 全 repo unit pass | — | ✓ | — | — | — |
| AC-3 認可 9 マトリクス | ✓ (補強) | — | ✓ | — | — |
| AC-4 type test (responseId !== memberId) | — | — | — | ✓ | — |
| AC-5-#1 schema 固定しすぎない | ✓ (extraFields 経路) | — | — | — | — |
| AC-5-#2 responseEmail system field | ✓ | — | — | ✓ | — |
| AC-5-#5 3 層分離 | ✓ | — | ✓ | — | — |
| AC-5-#6 apps/web → D1 禁止 | — | — | — | — | ✓ |
| AC-5-#7 論理削除 | ✓ | ✓ | — | — | — |
| AC-5-#11 profile 編集なし | ✓ (404) | — | ✓ | — | — |
| AC-6 coverage ≥ 85% / 80% | — | — | — | — | — (vitest.config) |
| AC-7 CI workflow yml | — | — | — | — | — (yml) |

## 1 endpoint あたり最低ケース

- contract: 正常 1 + 422 (invalid input) 1 + 不変条件確認 1〜2 = 3〜4 ケース
- authz: 401 / 403 / 200 = 3 ケース
- 合計 1 endpoint あたり 6〜7 test ケース、約 30 endpoint で 200 ケース前後

## coverage 目標

```ts
// vitest.config.ts (placeholder)
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      thresholds: {
        statements: 85,
        branches: 80,
        functions: 85,
        lines: 85,
      },
      include: ['src/routes/**', 'src/repository/**', 'src/middleware/**', 'src/services/**'],
      exclude: ['src/**/*.contract.spec.ts', 'src/**/*.spec.ts', 'test/**'],
    },
  },
})
```

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 5 | 5 種 suite を runbook で実装手順化 |
| Phase 7 | AC matrix |
| Phase 11 | `pnpm test` 実行 evidence |

## 多角的チェック観点

- 不変条件 **#1**: contract test で `extraFields` を含む response を verify
- 不変条件 **#2**: type + contract で `responseEmail` を fields に含めない
- 不変条件 **#5**: authz matrix 9 種で 3 層境界
- 不変条件 **#6**: lint test で grep
- 不変条件 **#7**: contract + repo unit で deleted_members 経路
- 不変条件 **#11**: contract で profile 編集 endpoint への request が 404

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | contract test signature | 4 | pending | 30 endpoint |
| 2 | repository unit signature | 4 | pending | 16 repo |
| 3 | authz signature | 4 | pending | 9 matrix |
| 4 | type test signature | 4 | pending | brand 型 |
| 5 | lint test signature | 4 | pending | grep |
| 6 | verify-suite-matrix.md | 4 | pending | AC × suite |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-04/main.md | テスト戦略 |
| matrix | outputs/phase-04/verify-suite-matrix.md | AC × suite |
| メタ | artifacts.json | phase 4 status |

## 完了条件

- [ ] 5 種 suite signature 確定
- [ ] AC × suite matrix 全行マッピング
- [ ] coverage 閾値 placeholder 記述

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 成果物配置済み
- [ ] 多角的チェック観点記述済み
- [ ] artifacts.json の phase 4 を completed

## 次 Phase

- 次: Phase 5 (実装ランブック)
- 引き継ぎ: 5 suite signature と coverage 目標
- ブロック条件: signature 未完なら Phase 5 不可
