# API Contract Test Pattern

> Hono route × zod schema × fetch 型契約を test で固定し、route と test 間の schema drift を遮断するパターン。
> 08a タスク（`docs/30-workflows/08a-parallel-api-contract-repository-and-authorization-tests/`）の実装結果を canonical 例とする。

## 設計原則

1. **zod schema は route と test で同一実体を共有する**: route handler が `requestSchema.parse()` / `responseSchema.parse()` で使う schema を test 側でも import し、test 内で別途 inline 定義しない。schema 再定義は drift の温床となる。
2. **fetch 型 ≠ implementation 型**: 公開 API は `app.fetch(req, env)` を直接叩く Vitest test で観測する。internal class の unit test は別系統として扱い、両者を契約 layer で繋ぐ。
3. **error schema 不変条件を必ず assert**: 既存 `packages/shared` の error schema（`{ code, message, details? }` 等）を全エラー応答で検証。code 値は string union として固定、details の有無は code 単位で決定。
4. **status code matrix を 1 ファイルで集約**: `200 / 201 / 400 / 401 / 403 / 404 / 409 / 422 / 429 / 500` の各分岐を 1 endpoint につき網羅。代表 endpoint だけでなく zod 400 と認可 401/403 は全 endpoint で必ず観測する。

## 配置規約

| 種別 | 配置 | 例 |
|---|---|---|
| cross-cutting（authz / invariants / brand-type） | `apps/api/src/__tests__/` | `authz-matrix.test.ts` / `invariants.test.ts` / `brand-type.test.ts` |
| per-table repository | `apps/api/src/repository/__tests__/` | `repository/__tests__/<table>.test.ts` |
| per-route handler | `apps/api/src/routes/<area>/<route>.test.ts`（route と co-located） | `routes/admin/schema.test.ts` |
| middleware | `apps/api/src/middleware/__tests__/` | `middleware/__tests__/require-admin.test.ts` |

co-located vs `__tests__/` の使い分け:
- 1 つの実装ファイルに 1 つの test ファイルが対応する場合は **co-located**（route handler / service / workflow など）
- 横断的な観測（複数 route / 複数 module / invariant 集約）は **`__tests__/`**

## 必須 assertion 群

各 contract test で以下を必ず観測する:

1. **status code**: `expect(res.status).toBe(200)` / `expect([200, 201]).toContain(res.status)` 等
2. **response shape**: `responseSchema.parse(await res.json())` が throw しないこと（zod による narrow）
3. **error schema**: 異常系で `errorSchema.parse(await res.json())` が throw しないこと、`code` が想定 union 内にあること
4. **brand 型 runtime**: brand 型を返す場合、`isResponseId(json.id)` 等の type guard が true を返すこと
5. **idempotency**: 同一 payload を 2 回投げた結果が等価（`POST /resolve` 等）

## エラー schema 不変条件

- error 応答は必ず `{ error: { code: string, message: string, details?: object } }` 形式
- `code` は `<area>.<failure>` 形式（例: `attendance.session_not_found` / `schema_diff.collision`）
- `details` は code 単位で固定の shape を持つ（自由 object にしない）
- HTTP status と `code` の対応は 1:N（同一 status 内で複数 code が許容、ただし code は status を決定する）

## 例: 08a `invariants.test.ts`

```ts
// apps/api/src/__tests__/invariants.test.ts
describe('invariant #1: questionId は code string literal で固定しない', () => {
  it('repository 層で questionId の文字列リテラルを直接埋め込んでいない', () => {
    // grep ベースの源コード走査 or AST 解析で literal questionId を検出
  });
});

describe('invariant #2: response_fields.stable_key は __extra__:<questionId> で extra field を識別', () => {
  it('extra field 検出時に __extra__: prefix が必ず付与される', async () => {
    // ...
  });
});
```

`describe('invariant #N: <短い意味>', ...)` 命名規約で `outputs/phase-12/phase12-task-spec-compliance-check.md` の trace 表と 1:1 マッピング。

## 例: route-level contract test

```ts
// apps/api/src/routes/admin/schema.test.ts
describe('POST /admin/schema/aliases', () => {
  it('zod 400 - body が schema 不適合', async () => {
    const res = await app.fetch(...)
    expect(res.status).toBe(400)
    const json = errorSchema.parse(await res.json())
    expect(json.error.code).toBe('validation_failed')
  })

  it('happy path - dryRun=false で audit_log に schema_diff.alias_assigned が追記される', async () => { /* ... */ })
})
```

## アンチパターン

- ❌ test 内で zod schema を inline 定義（`const localSchema = z.object(...)`）— route と drift する
- ❌ status code のみ assert して response body を検証しない — schema drift を見逃す
- ❌ 異常系を 1 つの it で複数まとめて検証 — どの分岐で fail したか判別不能
- ❌ `expect.any(String)` の多用 — brand 型 runtime 健全性が失われる

## 関連 reference

- [authz-matrix-pattern.md](authz-matrix-pattern.md) — authz 軸の網羅 pattern
- [d1-mock-factory-setup.md](d1-mock-factory-setup.md) — D1 binding mock の共通 factory
- [fake-d1-repository-pattern.md](fake-d1-repository-pattern.md) — repository 層の fake pattern
- [patterns.md](patterns.md) — 汎用実行パターン集
