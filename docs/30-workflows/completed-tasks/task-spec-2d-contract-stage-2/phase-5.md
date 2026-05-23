# Phase 5: 実装（TDD Green）

| 項目 | 値 |
|------|-----|
| workflow | task-spec-2d-contract-stage-2 |
| phase | 5 |
| 起点日 | 2026-05-11 |
| 実装区分 | 実装仕様書 |
| classification | NON_VISUAL / contract |
| coverageTier | standard |

---

## 1. 実装手順

| # | 手順 | 対象 |
|---|------|------|
| 1 | route 側 3 ファイルに named export 微修正を加える | `member-delete.ts` / `requests.ts` / `audit.ts` |
| 2 | `contract-stage-2.test.ts` を新規作成し、import / fixture / describe 構造を埋める | `apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts` |
| 3 | `pnpm --filter @ubm-hyogo/api typecheck` で型解決 | CI / local |
| 4 | `pnpm --filter @ubm-hyogo/api test contract-stage-2` で 7 describe green を確認 | CI / local |

---

## 2. route 側 named export 微修正（diff 雛形）

### 2.1 `apps/api/src/routes/admin/member-delete.ts:10`

```diff
- const DeleteBodyZ = z.object({
+ export const DeleteBodyZ = z.object({
    reason: z.string().min(1).max(500),
  });
```

### 2.2 `apps/api/src/routes/admin/requests.ts:40` 末尾

```diff
  const ListQueryZ = z.object({ ... });
  // ... 既存ファイル末尾に以下を追加:
+ export { ListQueryZ as ListRequestsQueryZ };
```

### 2.3 `apps/api/src/routes/admin/audit.ts:14` 末尾

```diff
  const QueryZ = z.object({ ... });
  // ... 既存ファイル末尾に以下を追加:
+ export { QueryZ as ListAuditQueryZ };
```

> 既存呼び出しを破壊しないため、元 const 名は維持し、別名 re-export で 2d test 側 import を可能にする。

---

## 3. 新規 spec ファイル雛形（コードは Phase 5 実装時に記述）

```ts
// apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts
import { describe, it, expect, expectTypeOf } from 'vitest';
import {
  MergeIdentityRequestZ,
  DismissIdentityConflictRequestZ,
  MergeIdentityResponseZ,
  DismissIdentityConflictResponseZ,
  IdentityConflictRowZ,
  ListIdentityConflictsResponseZ,
  adminRequestResolveBodySchema,
} from '@ubm-hyogo/shared';
import { ListRequestsQueryZ } from '../requests';
import { ListAuditQueryZ } from '../audit';
import { DeleteBodyZ } from '../member-delete';

// fixture object（2d test 内 inline、`as const` 固定）
const adminRequestItem = { /* ... */ } as const;
// ... 他 fixture も同様

describe('GET /admin/requests', () => {
  it('query schema が UI fixture を parse できる', () => { /* ... */ });
  // ...
});
// 7 describe を Phase 4 の構造表通りに展開
```

---

## 4. ファイル構成チェック

| 項目 | 値 |
|------|-----|
| 行数目安 | 200-260 |
| describe 数 | 7 |
| `z.object(` 個数 | 0（CONST_007） |
| skip 個数 | 0 |
| 外部 mock | 0（pure unit） |

---

## 5. Green 確認

| command | 期待 |
|---------|------|
| `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` | exit 0 |
| `mise exec -- pnpm --filter @ubm-hyogo/api test contract-stage-2` | 7 describe pass、fail 0、skip 0 |

---

## メタ情報

| 項目 | 値 |
|------|-----|
| taskType | implementation |
| visualEvidence | NON_VISUAL |
| workflow_state | implemented-local-runtime-pending |
| TDD state | Green |

## 目的

route 3 ファイルの named export と 1 つの contract test だけで、schema 重複なしに 7 endpoint の fixture contract を Green にする。

## 実行タスク

1. `DeleteBodyZ` を non-breaking named export にする。
2. `ListQueryZ` / `QueryZ` を別名 re-export する。
3. `contract-stage-2.test.ts` を作成し inline fixture を `as const` で固定する。
4. focused test / typecheck / grep gate を Green にする。

## 参照資料

- `apps/api/src/routes/admin/member-delete.ts`
- `apps/api/src/routes/admin/requests.ts`
- `apps/api/src/routes/admin/audit.ts`
- `apps/api/src/routes/admin/__tests__/contract-stage-2.test.ts`

## 成果物

- route named export 3 件
- `contract-stage-2.test.ts`
- focused test Green evidence

## 完了条件

- [x] `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` が exit 0
- [x] `mise exec -- pnpm --filter @ubm-hyogo/api test contract-stage-2` が exit 0
- [x] `z.object(` 0 件、skip 0 件
- [x] タスク100%実行確認: Phase 5 の実行タスクをすべて完了してから Phase 6 へ進む

## 統合テスト連携

本 Phase の focused Vitest が main integration point。DB / Network / Cloudflare binding を触らない pure unit として、CI の `@ubm-hyogo/api` test job に自然登録される。
