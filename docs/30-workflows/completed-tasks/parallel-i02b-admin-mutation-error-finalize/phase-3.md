# Phase 3: システム仕様整合確認

## メタ情報

| 項目 | 値 |
| --- | --- |
| Phase | 3 / 13 |
| 種別 | 整合性確認 |
| 入力 | Phase 2 設計 |
| 出力 | read-only 不変条件確認ログ |

## 目的

本 spec が依存する外部ファイル（`FetchAuthedError` / `AdminMutationResult` 型）の現行 signature を read-only で確認し、本サイクル内で変更しないことを宣言する。

## 確認対象

### `apps/web/src/lib/fetch/errors.ts:1-17`

```ts
export class FetchAuthedError extends Error {
  readonly status: number;
  readonly bodyText: string;
  constructor(status: number, bodyText: string);
}
```

- 引数順 `(status, bodyText)` が `AdminMutationError(status, message)` と一致する
- user-facing fallback では `bodyText` を参照すること（`message` は固定文言）

### `apps/web/src/lib/admin/api.ts:11-22`

```ts
export interface AdminMutationOk<T>  { ok: true;  status: number; data: T; }
export interface AdminMutationErr    { ok: false; status: number; error: string; data?: unknown; }
export type AdminMutationResult<T>   = AdminMutationOk<T> | AdminMutationErr;
```

- `AdminMutationErr.error: string`（**non-nullable**）→ throw 時の defensive `?? ""` 不要
- これらは `Admin*` 命名だが `AdminMutationError` クラスとは**別概念**。本サイクルでは**削除しない**

### `apps/web/src/features/admin/hooks/index.ts`

- `AdminMutationError` は元から非 export → 変更不要

## 実行手順

```bash
# read-only 確認
sed -n '1,20p' apps/web/src/lib/fetch/errors.ts
sed -n '1,30p' apps/web/src/lib/admin/api.ts
cat apps/web/src/features/admin/hooks/index.ts
```

## 不変条件

| 項目 | 不変 |
| --- | --- |
| `FetchAuthedError` シグネチャ | 変更禁止 |
| `AdminMutationResult` / `AdminMutationOk` / `AdminMutationErr` 型 | 削除禁止・signature 変更禁止 |
| `apps/web/src/features/admin/hooks/index.ts` re-export 列 | 変更不要 |
| API endpoint 側 error response | 変更禁止 |

## 完了条件


- [x] Phase 3 の完了条件を満たす証跡が保存されている。
- 4 つの read-only 不変条件が現行コードで真と確認できる
- 想定外の差異が見つかった場合は Phase 2 に戻り設計修正

## 参照資料

- source spec §設計, §スコープ（含まない）
- Phase 2 出力

## 実行タスク

- Phase 3 の本文に記載済みの手順を実行し、完了証跡を該当 outputs に保存する。

## 統合テスト連携

- NON_VISUAL のため画面証跡ではなく、focused Vitest / typecheck / lint / grep gate のログで連携確認する。
