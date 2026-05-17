# Phase 5: 実装

**[実装区分: 実装仕様書]** — コード変更を伴う

## メタ情報

- task slug: `i02-admin-error-type-unify`
- phase: 5 / 13
- 対象ファイル:
  - `apps/web/src/features/admin/hooks/useAdminMutation.ts`
  - `apps/web/src/features/admin/hooks/index.ts`

## 目的

Phase 4 で Red にしたテストを Green に遷移させる。
`useAdminMutation.ts` 内で並立していた独自 error class `AdminMutationHttpError` を削除し、
`@/lib/fetch/authed` の `AuthRequiredError` / `FetchAuthedError` に**完全統合**する。
これにより p-10 の 401 → `/login?redirect=...` redirect logic が admin mutation でも自動発火する。

## 実行タスク

1. `useAdminMutation.ts` の import を更新（`AuthRequiredError` / `FetchAuthedError` を `@/lib/fetch/authed` から追加）
2. `AdminMutationHttpError` class 定義を削除
3. 401 throw path を `AuthRequiredError` に置換
4. 非 2xx throw path を `FetchAuthedError` に置換
5. `instanceof` 分岐 2 箇所（L144 / L148）を新 class で書き換え
6. `hooks/index.ts` から `AdminMutationHttpError` の re-export を削除（残存している場合）

## 参照資料

- 元 spec「設計」セクション（Before/After コード片を本 phase で正本とする）
- `apps/web/src/lib/fetch/authed.ts` — class signature 確認用

## 実行手順

### Step 1: import 追加

```ts
// useAdminMutation.ts 上部
import { AuthRequiredError, FetchAuthedError } from "@/lib/fetch/authed";
```

### Step 2: `AdminMutationHttpError` class 定義の削除

`useAdminMutation.ts:58` 付近に存在する以下相当の定義を**完全削除**する:

```ts
// 削除対象
export class AdminMutationHttpError extends Error {
  constructor(public status: number, public bodyText: string) {
    super(`AdminMutation HTTP ${status}`);
  }
}
```

### Step 3: throw path 置換

**Before** (`useAdminMutation.ts:106-110`):

```ts
if (res.status === 401) {
  throw new AdminMutationHttpError(401, "");
}
if (!res.ok) {
  throw new AdminMutationHttpError(res.status, text);
}
```

**After**:

```ts
if (res.status === 401) {
  throw new AuthRequiredError();
}
if (!res.ok) {
  throw new FetchAuthedError(res.status, text);
}
```

### Step 4: instanceof 分岐の書き換え

**Before** (`useAdminMutation.ts:144,148`):

```ts
if (e instanceof AdminMutationHttpError && e.status === 401) { ... }
if (e instanceof AdminMutationHttpError && e.status === 403) { ... }
```

**After**:

```ts
if (e instanceof AuthRequiredError) { ... }
if (e instanceof FetchAuthedError && e.status === 403) { ... }
```

`AuthRequiredError` は status property を持たない仕様のため、401 判定は instanceof のみで完結する。
403 判定は `FetchAuthedError.status === 403` で narrowing する（type narrowing 健全性は Phase 7 で grep + tsc で確認）。

### Step 5: `hooks/index.ts` の re-export 削除

該当ファイルに `export { AdminMutationHttpError } from "./useAdminMutation"` 相当行が存在する場合は削除する。
存在しない場合は no-op（grep で確認）。

```bash
rg "AdminMutationHttpError" apps/web/src/features/admin/hooks/index.ts
```

### Step 6: 残存 grep

```bash
rg "AdminMutationHttpError" apps/web/src
```

0 hit を確認（テスト・本体・index 全体）。

## 統合テスト連携

- p-10 redirect logic と同じ `toLoginRedirect` helper を使い、`AuthRequiredError` 時に `/login?redirect=...` へ redirect する
- p-10 未完了の場合でも throw 統一は完了可（元 spec リスク表より）

## 多角的チェック観点（AIが判断）

| 観点 | 確認方法 |
|------|---------|
| `AdminMutationHttpError` の class 定義削除 | `rg "class AdminMutationHttpError"` が 0 hit |
| import が `@/lib/fetch/authed` から | useAdminMutation.ts 冒頭 import 行を目視 |
| return 型 `AdminMutationResult.error: Error \| null` が不変 | `git diff` で型注釈が変わっていないこと |
| 401 redirect 連携が崩れていない | hook 内 `instanceof AuthRequiredError` 分岐の navigation 呼び出しが維持されている |
| `hooks/index.ts` 再 export 残骸ゼロ | `rg "AdminMutationHttpError" apps/web/src` 全体 0 hit |

## サブタスク管理

- [ ] Step 1: import 追加
- [ ] Step 2: class 定義削除
- [ ] Step 3: throw 置換（2 箇所）
- [ ] Step 4: instanceof 分岐置換（2 箇所）
- [ ] Step 5: index.ts re-export 削除（該当時）
- [ ] Step 6: 残存 grep 0 hit 確認

## 成果物

### 変更対象 3 ファイルの差分要点

#### `apps/web/src/features/admin/hooks/useAdminMutation.ts`

- `import { AuthRequiredError, FetchAuthedError } from "@/lib/fetch/authed";` を追加
- `export class AdminMutationHttpError extends Error { ... }` 定義を**完全削除**
- L106-110 の throw 2 箇所を `AuthRequiredError` / `FetchAuthedError` に置換
- L144 の `e instanceof AdminMutationHttpError && e.status === 401` を `e instanceof AuthRequiredError` に置換
- L148 の `e instanceof AdminMutationHttpError && e.status === 403` を `e instanceof FetchAuthedError && e.status === 403` に置換
- 戻り値型 `AdminMutationResult.error: Error \| null` は不変

#### `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.ts`

- Phase 4 で更新済み。本 phase では Green 化のみ確認
- import: `AdminMutationHttpError` → `AuthRequiredError` / `FetchAuthedError`
- 401 assertion: `toBeInstanceOf(AuthRequiredError)`
- 403 / 5xx assertion: `toBeInstanceOf(FetchAuthedError)` + `.status === N`

#### `apps/web/src/features/admin/hooks/index.ts`

- `AdminMutationHttpError` の re-export 行を削除（存在する場合のみ）
- 他の named export は不変

## 完了条件

- `rg "AdminMutationHttpError" apps/web/src` が 0 hit
- `pnpm typecheck` PASS
- `pnpm -F @ubm-hyogo/web test -- --run useAdminMutation` Green
- `apps/web` の coverage Statements / Branches / Functions / Lines いずれも **>= 80%** を維持

## タスク100%実行確認【必須】

- [ ] 上記 6 サブタスクすべて完了
- [ ] grep 残存 0 hit
- [ ] typecheck PASS
- [ ] useAdminMutation spec Green

## 次Phase

Phase 6: ローカル検証（typecheck / lint / focused test / coverage-guard）
