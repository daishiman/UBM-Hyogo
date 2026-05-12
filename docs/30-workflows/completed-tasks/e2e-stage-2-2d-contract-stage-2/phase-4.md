# Phase 4: テスト作成（TDD Red → Green）

| 項目 | 値 |
|------|-----|
| 起点日 | 2026-05-10 |
| 前提 | Phase 1-3 GO |

## 1. Open Questions の解決

| # | 問い | 解決 | 根拠 |
|---|------|------|------|
| Q1 | response shape が zod export されていない場合の同型確認手段 | `expectTypeOf<typeof fixture>().toMatchTypeOf<...>()`（vitest 標準 API） | phase-2 §4 |
| Q2 | merge response の正本 shape | shared `MergeIdentityResponseZ` = `{ mergedAt, targetMemberId, archivedSourceMemberId, auditId }`。親 workflow phase-4 §1 Q2 の旧記述は誤りで本 spec で補正済 | 元仕様 §13 A |
| Q3 | `DeleteBodyZ` を 2d test から参照する手段 | route から named export（`const` → `export const` 1 字句追加）。`packages/shared` 昇格は今回目的に不要（CONST_007 + phase-4 §1 Q6） | 元仕様 §3 / 苦戦箇所メモ |
| Q4 | `ListQueryZ` / `QueryZ` の名前衝突回避 | 別名 named export（`ListRequestsQueryZ` / `ListAuditQueryZ`）として再 export。route 内部識別子は不変 | 元仕様 §3 #3, #4 |
| Q5 | `adminRequestResolveBodySchema` の import 元 | `@ubm-hyogo/shared` barrel（既存 export） | 元仕様 §4 |
| Q6 | fixture の所在 | 2d test 内 inline `as const`。別ファイル化は Phase 8 リファクタの責務 | 元仕様 §5 |

## 2. テストファイル

| path | 種別 | 状態 | 行数目安 |
|------|------|------|---------|
| `apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` | Vitest contract test | 新規 | 251 |

## 3. Red / Green 方針

**Red**: route 3 ファイルの named export 化を行わない状態で test を書くと、`import { DeleteBodyZ } from '../member-delete'` 等が `Module has no exported member` で typecheck 失敗（compile-time red）。

**Green**:
1. 先に route 3 ファイルに `export` を付与する（各 +1 字句）。
2. test ファイルを新規作成し 7 describe を実装。
3. `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` で 7 describe 全 pass + skip 0。

## 4. 検証コマンド

| 観点 | コマンド | 期待 |
|------|---------|------|
| test 認識 | `mise exec -- pnpm exec vitest run --root=. --config=vitest.config.ts apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts --reporter=verbose` | 全 it 列挙、合計 22 |
| Vitest | 同上 | 全 pass / skip 0 |
| typecheck | `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | exit 0 |
| lint | `mise exec -- pnpm --filter @ubm-hyogo/api lint` | exit 0 |
| schema 重複定義禁止 | `grep -c 'z\\.object(' apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` | `0` |
| `apps/web` import 禁止 | `grep -c "from 'apps/web\\|from '@ubm-hyogo/web\\|from '\\.\\./.*apps/web" apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` | `0` |
| skip 禁止 | `grep -cE '\\b(test\|it\|describe)\\.skip\\b' apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` | `0` |
| 行数 | `wc -l apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` | 251 |

## 5. failing test の代表例（Red 段階で観測される現象）

| # | 操作 | 期待エラー |
|---|------|----------|
| 1 | route export 付与前に test を実行 | `error TS2305: Module '"../member-delete"' has no exported member 'DeleteBodyZ'.` |
| 2 | export 付与後、fixture から `archivedSourceMemberId` を欠落させて parse | `MergeIdentityResponseZ.parse` が `ZodError: Required` を throw |
| 3 | export 付与後、`reason: ''` を fixture にして `DeleteBodyZ.parse` を not throw 期待 | `Expected to throw` で fail（min(1) 違反 → throws が正） |
