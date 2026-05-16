# parallel-i02-admin-error-type-unify: admin mutation の error 型を共有化

**[実装区分: 実装仕様書]** — コード変更を伴う

## 目的

`parallel-08` と `parallel-10` が共有を前提とした 401/403 error path が、
実コードでは **2 系統の error class が並立** している:

- `apps/web/src/lib/fetch/authed.ts`: `AuthRequiredError` (401) / `FetchAuthedError` (status, bodyText)
- `apps/web/src/features/admin/hooks/useAdminMutation.ts:58`: 独自 `AdminMutationHttpError`

`useAdminMutation` 内の 401/403 分岐 (`useAdminMutation.ts:144,148`) が `AdminMutationHttpError`
のみを参照しており、p-10 の `AuthRequiredError` based redirect logic と相互運用できない。

本タスクは 2 系統を**単一型に統合**し、p-10 で実装される 401 → `/login?next=...` redirect が
admin mutation でも自動発火するようにする。

## スコープ

### 含む
- `useAdminMutation` 内 error class の `AuthRequiredError` / `FetchAuthedError` への置き換え
- 既存テスト (`useAdminMutation.spec.tsx`) の expected error class を更新
- `AdminMutationHttpError` の削除（または `@deprecated` 経由 re-export で破壊回避）

### 含まない
- `authed.ts` の error class の signature 変更
- 新規 redirect logic の追加（p-10 既存 logic を流用する前提）
- API endpoint 側の error response 変更

## 変更対象ファイル

| Path | 種別 | 理由 |
|------|------|------|
| `apps/web/src/features/admin/hooks/useAdminMutation.ts` | modify | error class を `AuthRequiredError` / `FetchAuthedError` 経由に統一 |
| `apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.tsx` | modify | expected error class を更新 |
| `apps/web/src/features/admin/hooks/index.ts` | modify | 旧 `AdminMutationHttpError` の export を削除（または `@deprecated` 維持） |

## 設計

### 1. error throw path の置き換え

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
import { AuthRequiredError, FetchAuthedError } from "@/lib/fetch/authed";

if (res.status === 401) {
  throw new AuthRequiredError();
}
if (!res.ok) {
  throw new FetchAuthedError(res.status, text);
}
```

### 2. error 分岐の置き換え

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

### 3. 破壊回避

`AdminMutationHttpError` の利用箇所は spec 内 + 同 hook ファイル内に限定（grep 結果より）。
完全削除して問題なし。残す場合は以下のみ:

```ts
/** @deprecated Use FetchAuthedError from @/lib/fetch/authed instead. */
export { FetchAuthedError as AdminMutationHttpError } from "@/lib/fetch/authed";
```

本 spec では**完全削除を採用**（再 export 経由の混乱回避）。

### 4. authed.ts の修正

不要（既存 class signature を変更しない）。

## 関数シグネチャ

`useAdminMutation` の戻り値型 `AdminMutationResult.error` は `Error | null` のまま不変。
内部実装のみ変更。

## 入出力・副作用

| ケース | 旧 throw | 新 throw | 観測される動作 |
|--------|---------|---------|--------------|
| 401 | `AdminMutationHttpError(401, "")` | `AuthRequiredError` | p-10 redirect logic が catch して `/login?next=...` 発火 |
| 403 | `AdminMutationHttpError(403, body)` | `FetchAuthedError(403, body)` | hook 内 toast 表示（変更なし） |
| 5xx | `AdminMutationHttpError(5xx, body)` | `FetchAuthedError(5xx, body)` | ErrorBoundary trigger（変更なし） |

## テスト方針

### 追加・更新するテスト

`apps/web/src/features/admin/hooks/__tests__/useAdminMutation.spec.tsx` の以下行を更新:

```ts
// before
expect(getResult().error).toBeInstanceOf(AdminMutationHttpError);
expect((getResult().error as AdminMutationHttpError).status).toBe(403);

// after
import { AuthRequiredError, FetchAuthedError } from "@/lib/fetch/authed";
expect(getResult().error).toBeInstanceOf(FetchAuthedError);
expect((getResult().error as FetchAuthedError).status).toBe(403);
```

401 case は `toBeInstanceOf(AuthRequiredError)` に変更。

### 既存テスト

- `apps/web/src/lib/fetch/authed.spec.ts` は変更なし（既存通過）
- p-10 redirect logic の test がある場合（要 grep `AuthRequiredError`）、本変更後に admin mutation 経由でも redirect が trigger することを確認する int test を 1 件追加

## ローカル実行・検証コマンド

```bash
mise exec -- pnpm typecheck
mise exec -- pnpm lint
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run useAdminMutation
mise exec -- pnpm -F "@ubm-hyogo/web" test -- --run authed
```

## DoD

- [ ] `useAdminMutation.ts` から `AdminMutationHttpError` の class 定義を削除
- [ ] 401 / 非 2xx の throw が `AuthRequiredError` / `FetchAuthedError` に切替
- [ ] hook 内 instanceof 判定が新 class に切替
- [ ] `useAdminMutation.spec.tsx` の assertion が新 class で PASS
- [ ] `hooks/index.ts` から旧 export 削除（または deprecated 経由 alias のみ）
- [ ] `pnpm typecheck` PASS（type narrowing が新型で成立）
- [ ] `pnpm lint` PASS

## リスク

| リスク | 対策 |
|--------|------|
| `AdminMutationHttpError` を import している外部箇所がある | grep で全件 (`useAdminMutation.ts` / test の 2 箇所のみ確認済) を再確認後に削除 |
| p-10 redirect logic が未実装で 401 → redirect が動作しない | 本 spec の DoD は throw 切替まで。redirect 動作は p-10 spec の責務 |

## 並列性

- 独立: i01, i03, i04, i05 と編集対象ファイル重複なし
- 依存: なし（p-10 が未完了でも throw 統一は完了可）

## スコープ確定ノート

このタスクは canonical workflow root へ昇格するか、in-place fix で完結するかをここで明示する。

- **status**: pending
- **canonical_workflow**: null（in-place fix で完結予定）
- **判断**: 編集対象は 3 ファイルかつ既存 error class への置換のみで影響範囲が限定的。Phase 1-13 のフル昇格は不要と判断し、本 spec.md を発注書として in-place fix で完結させる。実装着手時に副作用が想定を超える場合は canonical workflow root (`docs/30-workflows/i02-admin-error-type-unify/`) へ昇格させ、`artifacts.json` の `canonical_workflow` を更新する。
