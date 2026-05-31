# Phase 5: 実装（TDD GREEN） — AdminFetchError typed class

**[実装区分: 実装仕様書]**

## 1. 変更ファイル一覧（FB-RT-03: 新規/修正 必須記載）

| パス | 種別 | 変更内容 |
| --- | --- | --- |
| `apps/web/src/lib/admin/server-fetch.ts` | **修正** | `AdminFetchError` class + `isAdminFetchError` guard を export 追加。error path（line 509-530）の throw を置換 |
| `apps/web/src/lib/server-fetch/safe-fetch.ts` | **修正** | `statusFromError` 抽出（構造化 status 優先 + 正規表現 fallback）。`normalizeError` から呼ぶ |
| `apps/web/src/lib/admin/__tests__/admin-fetch-error.spec.ts` | **新規** | Phase 4 の TC-AFE-01〜11 |
| `apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts` | **修正** | TC-SF-STATUS 追記 |

> 不変: `apps/web/src/lib/admin/safe-server-fetch.ts`（consumer）は変更しない。`apps/api` 変更なし。

## 2. 実装手順

### Step 1: `server-fetch.ts` に class + guard を追加
`AdminFetchOptions` interface の近傍（既存 export 群の後ろ）に Phase 2 §3.1 のコードを追加する。

```ts
export class AdminFetchError extends Error {
  readonly status: number;
  readonly path: string;
  readonly responseBodySnippet: string | null;

  constructor(opts: { path: string; status: number; responseBody?: string | null }) {
    const rawBody = opts.responseBody ?? null;
    const messageSuffix = rawBody ? ` body=${rawBody.slice(0, 256)}` : "";
    super(`admin api ${opts.path} failed: ${opts.status}${messageSuffix}`);
    this.name = "AdminFetchError";
    this.status = opts.status;
    this.path = opts.path;
    this.responseBodySnippet = rawBody === null ? null : rawBody.slice(0, 500);
  }
}

export function isAdminFetchError(error: unknown): error is AdminFetchError {
  return (
    error instanceof AdminFetchError ||
    (error instanceof Error && error.name === "AdminFetchError")
  );
}
```

### Step 2: error path（line 509-530）の throw を置換
現状の `bodySnippet` 文字列組み立てを削除し、生 `rawBody` を取得して `AdminFetchError` に渡す（Phase 2 §4 のコード）。

- Before（line 510-513, 530）:
  ```ts
  let bodySnippet = "";
  try {
    const text = await res.text();
    if (text) bodySnippet = ` body=${text.slice(0, 256)}`;
  } catch { /* ... */ }
  // ...
  throw new Error(`admin api ${path} failed: ${res.status}${bodySnippet}`);
  ```
- After:
  ```ts
  let rawBody: string | null = null;
  try {
    rawBody = await res.text();
  } catch { /* body 読み取り失敗は致命的でない */ }
  // ...（404 warn は不変）...
  throw new AdminFetchError({ path, status: res.status, responseBody: rawBody });
  ```

> **read 回数不変**: `res.text()` は error path で 1 回のみ。`Response.clone()` は導入しない。

### Step 3: `safe-fetch.ts` の `statusFromError` 抽出
Phase 2 §5 のコードで `normalizeError` を強化。`STATUS_FROM_MESSAGE` は維持。`AdminFetchError` を import しない（duck typing）。

### Step 4: テスト追加
Phase 4 の `admin-fetch-error.spec.ts` を新規作成し、`safe-fetch.spec.ts` に TC-SF-STATUS を追記。

## 3. 入力・出力・副作用の最終定義

| 関数/クラス | 入力 | 出力 | 副作用 |
| --- | --- | --- | --- |
| `AdminFetchError` | `{path, status, responseBody?}` | typed error instance | なし |
| `isAdminFetchError` | `unknown` | `boolean`（type predicate） | なし |
| `statusFromError`（safe-fetch 内 private） | `Error` | `number \| null` | なし |
| `fetchAdmin` error path | `res`（not ok） | throw `AdminFetchError` | `console.warn`（非prod 404 時、不変） |

## 4. エラーハンドリング / エッジケース

- `res.text()` reject → `rawBody=null` → suffix なし・snippet=null（現状 `bodySnippet=""` と message 上は同一結果）
- body 空文字 → suffix 抑止（falsy）・snippet=`""`
- status が非整数になることは fetch Response.status の仕様上ない（常に integer）が、`statusFromError` は `Number.isInteger` で防御
- Workers cross-module で `instanceof` false → `isAdminFetchError` の `name` fallback で吸収

## 5. ローカル実行・検証コマンド

```bash
# focused 新規 + regression
mise exec -- pnpm exec vitest run \
  apps/web/src/lib/admin/__tests__/admin-fetch-error.spec.ts \
  apps/web/src/lib/admin/__tests__/server-fetch.binding.spec.ts \
  apps/web/src/lib/admin/__tests__/safe-server-fetch.spec.ts \
  apps/web/src/lib/admin/__tests__/safe-server-fetch-404-vs-401.spec.ts \
  apps/web/src/lib/admin/__tests__/server-fetch.env.spec.ts \
  apps/web/src/lib/server-fetch/__tests__/safe-fetch.spec.ts

mise exec -- pnpm --filter @ubm-hyogo/web typecheck
mise exec -- pnpm lint
```

## 6. DoD（Definition of Done）

- [ ] Step 1-4 完了
- [ ] 新規 spec（TC-AFE-01〜11 + TC-SF-STATUS）green
- [ ] 既存 regression 5 spec green（message byte-identical 確認）
- [ ] `pnpm typecheck` green（`@ubm-hyogo/web`）
- [ ] `pnpm lint` green
- [ ] `grep -rn "throw new Error(\`admin api" apps/web/src/lib/admin/server-fetch.ts` = 0 件（置換完了確認）
- [ ] `apps/web/src/lib/server-fetch/safe-fetch.ts` に `AdminFetchError` の import が無いこと（責務境界確認）
