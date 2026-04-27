# Typecheck レポート（Phase 9 成果物）

## 実行コマンド

```bash
mise exec -- pnpm typecheck
# = pnpm -r typecheck
# = 各 workspace の `tsc -p tsconfig.json --noEmit`
```

## 結果

| Workspace | tsconfig | 結果 | エラー件数 |
| --- | --- | --- | --- |
| `packages/shared` | packages/shared/tsconfig.json | ✅ Done | 0 |
| `packages/integrations` | packages/integrations/tsconfig.json | ✅ Done | 0 |
| `apps/web` | apps/web/tsconfig.json | ✅ Done | 0 |
| `apps/api` | apps/api/tsconfig.json | ✅ Done | 0 |

合計 4/4 PASS。Exit code 0。

## TypeScript 設定確認

### 厳格モード設定

| 設定 | 値 | 確認 |
| --- | --- | --- |
| `strict` | true | ✅ 厳格モード有効 |
| `exactOptionalPropertyTypes` | true | ✅ optional プロパティが厳密に区別される |
| `noUncheckedIndexedAccess` | true（推定） | 配列インデックスアクセスが undefined を含む |
| `noImplicitAny` | true（strict 由来） | – |

### `exactOptionalPropertyTypes: true` 対応箇所

Phase 5 実装で以下のパターンを採用し、typecheck PASS を維持:

1. **errors.ts: `fromUnknown` 内の log 構築**

```ts
const log: ApiErrorLogExtra = { cause: err, context: { originalMessage: err.message } };
if (err.stack !== undefined) log.stack = err.stack;
return new ApiError({ code: fallbackCode, log });
```

→ `stack` は optional のため、undefined 代入を避けて条件付き付与。

2. **error-handler.ts: log payload 構築**

```ts
const log: StructuredLogInput["log"] = {};
if (apiError.log.stack !== undefined) log.stack = apiError.log.stack;
if (apiError.log.sqlStatement !== undefined) log.sqlStatement = apiError.log.sqlStatement;
// ... 同パターン
```

→ optional フィールドを条件分岐で構築。

3. **buildResponse 内の debug field 構築**

```ts
const debug: { originalMessage: string; stackPreview?: string } = { originalMessage };
if (stackPreview !== undefined) debug.stackPreview = stackPreview;
clientView.debug = debug;
```

→ stackPreview が undefined の場合は付与しない。

## ApiError 型同期確認

| 確認項目 | 結果 |
| --- | --- |
| apps/api 側で `ApiError` を throw / serialize 可能 | ✅ `@ubm-hyogo/shared/errors` から import |
| apps/web 側で `ApiErrorClientView` を narrowing 可能 | ✅ `isApiErrorClientView()` 型述語が typecheck 通過 |
| `UbmErrorCode` literal union が 15 件で固定 | ✅ 型定義レベルで確認、追加時は型エラー |
| `UBM_ERROR_CODES` が `Record<UbmErrorCode, UbmErrorCodeMeta>` を充足 | ✅ `as const satisfies` で強制 |

## Hono Context 型対応

`apps/api/src/middleware/error-handler.ts` で `Context<any>` を使用:

```ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyContext = Context<any>;
```

理由: `apps/api` の Env 型（`DB`, `GOOGLE_SERVICE_ACCOUNT_JSON`, `SHEET_ID`, `FORM_ID`）と middleware の最小要件（`ENVIRONMENT` のみ optional）の差を吸収するため、middleware 側を Bindings 非依存にする。

代替案: ジェネリクス `<T extends { ENVIRONMENT?: string }>` も検討したが、Hono の `app.onError` シグネチャが具象 Context を要求するため、`any` 採用で整合性を確保。

## subpath import 解決確認

`mise exec -- pnpm typecheck` 通過は、以下の解決が成功していることを意味する:

```ts
import { ApiError, isApiError, type ApiErrorClientView } from "@ubm-hyogo/shared/errors";
import { logError, type StructuredLogInput } from "@ubm-hyogo/shared/logging";
```

`packages/shared/package.json#exports` に明示された `./errors` / `./logging` subpath が tsc / pnpm の両方で正しく解決されている。

## Phase 10 への引き継ぎ

- typecheck エラーゼロ
- ApiError 型同期 PASS
- subpath import 解決 PASS
- `exactOptionalPropertyTypes` の厳格モード下で全コードが PASS

## 完了条件

- [x] `mise exec -- pnpm typecheck` exit code 0
- [x] 4 workspace projects 全件 Done
- [x] ApiError 型が apps/web 側で正しく narrowing されている
- [x] subpath import 解決が成功している
