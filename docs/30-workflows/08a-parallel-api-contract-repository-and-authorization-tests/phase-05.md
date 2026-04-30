# Phase 5: 実装ランブック

## メタ情報

| 項目 | 値 |
| --- | --- |
| タスク名 | 08a-parallel-api-contract-repository-and-authorization-tests |
| Phase 番号 | 5 / 13 |
| Phase 名称 | 実装ランブック |
| 作成日 | 2026-04-26 |
| 前 Phase | 4 (テスト戦略) |
| 次 Phase | 6 (異常系検証) |
| 状態 | pending |

## 目的

Phase 4 の verify suite を後続実装者が手順通りに進めれば作れるよう、runbook + 擬似コード + sanity check を残す。

## 実行タスク

- [ ] runbook を 7 ステップで記述 (`outputs/phase-05/runbook.md`)
- [ ] 5 種 suite ごとの test signature を `outputs/phase-05/test-signatures.md`
- [ ] vitest.config.ts placeholder
- [ ] CI workflow yml placeholder
- [ ] sanity check（local 実行 + coverage）

## 参照資料

| 種別 | パス | 用途 |
| --- | --- | --- |
| 必須 | outputs/phase-02/main.md | layout |
| 必須 | outputs/phase-04/main.md | suite signature |
| 必須 | doc/00-getting-started-manual/specs/15-infrastructure-runbook.md | wrangler / CI |

## runbook（7 ステップ）

### Step 1: 依存追加

```bash
pnpm --filter @ubm-hyogo/api add -D vitest @vitest/coverage-v8 better-sqlite3 msw @hono/node-ws
pnpm --filter @ubm/shared add -D vitest tsd  # type test
```

### Step 2: vitest.config.ts 作成

```ts
// root vitest.config.ts (apps/api/package.json scripts から参照する placeholder)
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    setupFiles: ['./test/helpers/setup.ts'],
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      thresholds: { statements: 85, branches: 80, functions: 85, lines: 85 },
      include: ['src/routes/**', 'src/repository/**', 'src/middleware/**', 'src/services/**'],
      exclude: ['**/*.spec.ts', '**/*.contract.spec.ts', 'test/**'],
    },
    typecheck: { enabled: true, include: ['**/*.type-test.ts'] },
  },
})
```

### Step 3: helpers / fixtures 整備

```ts
// apps/api/test/helpers/setup.ts (placeholder)
import { afterEach, beforeAll, afterAll, beforeEach } from 'vitest'
import { server } from '../mocks/server'
import { resetDb, createTestDb } from './db'

beforeAll(async () => {
  globalThis.testDb = await createTestDb()
  server.listen({ onUnhandledRequest: 'error' })
})
afterEach(async () => {
  await resetDb(globalThis.testDb)
  server.resetHandlers()
})
afterAll(() => server.close())
```

```ts
// apps/api/test/helpers/auth.ts (placeholder)
export function adminCookie(): Record<string, string> {
  return { Cookie: `__Secure-authjs.session-token=${signSession({ adminUserId: 'admin-1' })}` }
}
export function memberCookie(memberId = 'm-1'): Record<string, string> {
  return { Cookie: `__Secure-authjs.session-token=${signSession({ memberId })}` }
}
```

### Step 4: contract test 量産

- Phase 4 の test signature を `apps/api/src/routes/<layer>/__tests__/<endpoint>.contract.spec.ts` に配置
- 各 endpoint で「正常 1 + 異常 1〜2 + 不変条件確認 1」の最低 3 ケース
- response body は `<ViewModel>Schema.parse(body)` で zod で固定

### Step 5: repository unit test 量産

- 02a/b/c で定義された 16 repository に対し `apps/api/src/repository/__tests__/<table>.spec.ts` を配置
- CRUD（create / read / update / delete）+ list + edge を 5 ケース最低

### Step 6: authz / type / lint test 整備

- authz: `apps/api/src/middleware/__tests__/authz.spec.ts` に 9 マトリクス
- type: `packages/shared/src/__tests__/type-tests.ts` に `@ts-expect-error` 1 ケース以上
- lint: `apps/api/src/lint/__tests__/import-boundary.spec.ts` で grep

### Step 7: CI workflow yml

```yaml
# .github/workflows/api-tests.yml (placeholder)
name: api-tests
on:
  pull_request:
    paths: ['apps/api/**', 'packages/shared/**']
  push:
    branches: [dev, main]
jobs:
  vitest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @ubm/shared typecheck
      - run: pnpm --filter @ubm-hyogo/api test -- --coverage
      - uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: apps/api/coverage/
```

## sanity check

```bash
# local
pnpm --filter @ubm-hyogo/api test
# expected: 200+ tests pass, coverage statements ≥ 85%

# coverage
pnpm --filter @ubm-hyogo/api test -- --coverage
cat apps/api/coverage/coverage-summary.json | jq '.total.statements.pct'
# expected: ≥ 85
```

## 統合テスト連携

| 連携先 Phase | 連携内容 |
| --- | --- |
| Phase 6 | runbook 各 step の failure を異常系へ |
| Phase 7 | AC × runbook step マッピング |
| 下流 09a / 09b | CI workflow を release 流れへ |

## 多角的チェック観点

- 不変条件 **#1**: msw handler に `extraFields` 含む応答を必ず 1 件用意
- 不変条件 **#2**: zod schema enum で `responseEmail` を fields に含めない
- 不変条件 **#5**: authz spec を 1 ファイルに集約、9 マトリクス維持
- 不変条件 **#6**: lint test を CI で必須実行
- 不変条件 **#7**: deleted_members fixture を seed に含める
- 不変条件 **#11**: profile 編集 path への request が 404 を返す test
- a11y: 本タスク UI なし、08b へ
- 無料枠: in-memory sqlite で CI 5 min 以内

## サブタスク管理

| # | サブタスク | 担当 Phase | 状態 | 備考 |
| --- | --- | --- | --- | --- |
| 1 | runbook 7 step | 5 | pending | runbook.md |
| 2 | vitest.config placeholder | 5 | pending | coverage 閾値 |
| 3 | helpers / fixtures placeholder | 5 | pending | setup / auth / db |
| 4 | suite ごと test signature | 5 | pending | test-signatures.md |
| 5 | CI workflow yml placeholder | 5 | pending | api-tests.yml |
| 6 | sanity check | 5 | pending | local 実行 |

## 成果物

| 種別 | パス | 説明 |
| --- | --- | --- |
| ドキュメント | outputs/phase-05/main.md | runbook 本文 |
| ドキュメント | outputs/phase-05/runbook.md | 7 step |
| ドキュメント | outputs/phase-05/test-signatures.md | suite ごと signature |
| メタ | artifacts.json | phase 5 status |

## 完了条件

- [ ] runbook 7 step
- [ ] vitest.config / helpers / CI yml placeholder
- [ ] 5 suite test signature 集約

## タスク100%実行確認【必須】

- [ ] 全実行タスク completed
- [ ] 成果物配置済み
- [ ] 多角的チェック観点記述済み
- [ ] artifacts.json の phase 5 を completed

## 次 Phase

- 次: Phase 6 (異常系検証)
- 引き継ぎ: runbook step ごとの failure
- ブロック条件: runbook 未完なら Phase 6 不可
