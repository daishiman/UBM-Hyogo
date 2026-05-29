# Phase 5 — 実装

## 変更対象ファイル

| パス | 種別 | 概要 |
|------|------|------|
| `apps/web/src/lib/admin/server-fetch.ts` | 編集 | `fetchAdmin` 末尾の HTTP fetch を service-binding 優先に置換 |
| `apps/web/src/lib/admin/__tests__/server-fetch-service-binding.spec.ts` | 新規 | 6 ケース(Phase 4 参照) |

## 関数シグネチャ

### 既存(変更なし — 外部 API 維持)

```ts
export async function fetchAdmin<T>(
  path: string,
  opts: AdminFetchOptions = {},
): Promise<T>
```

### 新規 internal helper(`apps/web/src/lib/admin/server-fetch.ts` 内に追加)

```ts
function getAdminFetcher(): typeof fetch {
  const env = getPublicFetchEnv();
  const isTestRuntime = env.NODE_ENV === "test" || env.PLAYWRIGHT_TEST === "1";
  if (isTestRuntime) return fetch;
  const binding = env.API_SERVICE;
  if (binding && typeof binding.fetch === "function") {
    return binding.fetch.bind(binding);
  }
  return fetch;
}
```

`getPublicFetchEnv()` に既に `API_SERVICE?: ServiceBinding` と `NODE_ENV` / `PLAYWRIGHT_TEST` が含まれる前提(`apps/web/src/lib/env.ts:54-58, 121-136` 既存)。`getEnv()` は `INTERNAL_API_BASE_URL` / `INTERNAL_AUTH_SECRET` 解決に使い、transport 切替は `getPublicFetchEnv()` へ閉じる。

### `fetchAdmin` 末尾の置換差分(疑似コード)

```ts
// before
const res = await fetch(url, {
  method: opts.method ?? "GET",
  headers,
  cache: "no-store",
  ...(opts.body !== undefined ? { body: JSON.stringify(opts.body) } : {}),
});

// after
const fetcher = getAdminFetcher();
const res = await fetcher(url, {
  method: opts.method ?? "GET",
  headers,
  cache: "no-store",
  ...(opts.body !== undefined ? { body: JSON.stringify(opts.body) } : {}),
});
```

## 入力 / 出力 / 副作用

- 入力: `path` (string), `opts` (method, body)
- 出力: `Promise<T>` (JSON parse 済)
- 副作用: API Worker に subrequest(service-binding 経由 or HTTP fetch 経由)
- ヘッダ: `x-internal-auth` (env), `cookie` (next/headers), `content-type` (POST/PATCH 時), `accept`

## ローカル実行・検証コマンド

```bash
# 型チェック
mise exec -- pnpm typecheck

# Lint
mise exec -- pnpm lint

# 新規 spec のみ
mise exec -- pnpm --filter=@ubm-hyogo/web exec vitest run src/lib/admin/__tests__/server-fetch-service-binding.spec.ts

# admin server-fetch 関連 spec 一括
mise exec -- pnpm --filter=@ubm-hyogo/web exec vitest run src/lib/admin/__tests__/

# 全 vitest
mise exec -- pnpm test
```

## DoD (Definition of Done)

- [x] `pnpm typecheck` green
- [x] `pnpm lint` green
- [x] 新規 spec 6 ケース pass
- [x] `apps/web/src/lib/admin/__tests__/` 配下既存 spec 全 pass
- [x] `pnpm test` 実行。初回 full run は API/D1 hook timeout 8 件で fail、失敗 6 files を `--poolOptions.forks.minForks=1 --poolOptions.forks.maxForks=1` で再実行し 37 tests PASS
- [ ] `bash scripts/verify-pr-ready.sh` green (`verify:phase12-compliance` / `gate-metadata:validate` PASS。`indexes:rebuild drift` は regenerated index files が未コミットのため commit user-gate 後に解消)
- [ ] (user-gated) staging deploy 後 `/admin/meetings` authenticated request が 200 / list 描画
- [ ] (user-gated) `wrangler tail` で ADMIN_FETCH_404 が観測されない
