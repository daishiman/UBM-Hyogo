# Phase 5: 実装

[実装区分: 実装仕様書]

> Phase: 5 / 13

---

## 実装対象ファイル

`apps/web/src/lib/fetch/public.ts`

## 実装手順

### Step 1: ファイル冒頭コメント書き換え

`apps/web/src/lib/fetch/public.ts:5-8` の transport 経路コメントを以下に置換する。

**Before**:
```ts
// 経路:
// 1. Cloudflare Workers 上 (production/staging) → service-binding `API_SERVICE.fetch()`
//    (同一 account workers.dev への外向き fetch loopback で 404 になる事象を回避)
// 2. それ以外 (local `next dev`) → process.env.PUBLIC_API_BASE_URL の外向き fetch
```

**After**:
```ts
// 経路:
// 1. production / staging (Cloudflare Workers runtime, isTestOrPlaywright() === false)
//    → service-binding `API_SERVICE.fetch()` を常に優先
//    (同一 account workers.dev への外向き fetch loopback 404 を回避)
// 2. test / Playwright (NODE_ENV=test / PLAYWRIGHT_TEST=1) かつ PUBLIC_API_BASE_URL 明示時
//    → process.env.PUBLIC_API_BASE_URL の HTTP fetch
//    (CI 上の deterministic mock API へ差し替え可能にするため)
// 3. それ以外 (local `next dev` で service binding 不在)
//    → process.env.PUBLIC_API_BASE_URL の HTTP fetch
//
// 注: test runtime 判定 isTestOrPlaywright() は apps/web env 不変条件
// (env 参照は getEnv()/getPublicEnv() 経由) の例外として 1 箇所に閉じる。
// 関連先行: task-05a-fetchpublic-service-binding-001 (逆方向 fallback 設計)
```

### Step 2: `isTestOrPlaywright()` ヘルパ追加

`getServiceBinding()` 直前(現行 `apps/web/src/lib/fetch/public.ts:36` の直前)に以下を挿入する。

```ts
// test runtime 判定。apps/web env 不変条件(getEnv()/getPublicEnv() 経由) の例外として
// このヘルパ 1 箇所のみで process.env を直参照する。
// セッター想定: vitest=NODE_ENV=test / Playwright=PLAYWRIGHT_TEST=1
function isTestOrPlaywright(): boolean {
  return (
    process.env.NODE_ENV === "test" ||
    process.env.PLAYWRIGHT_TEST === "1"
  );
}
```

### Step 3: `getServiceBinding()` 早期 return 条件を環境ガード化

**Before** (`apps/web/src/lib/fetch/public.ts:36-39`):
```ts
function getServiceBinding(): ServiceBinding | undefined {
  if (process.env.PUBLIC_API_BASE_URL) return undefined;
  return readEnv().API_SERVICE;
}
```

**After**:
```ts
function getServiceBinding(): ServiceBinding | undefined {
  // test/Playwright 限定: PUBLIC_API_BASE_URL 明示時に HTTP fallback を優先(mock API 差し替えのため)
  if (isTestOrPlaywright() && process.env.PUBLIC_API_BASE_URL) return undefined;
  // production / staging: PUBLIC_API_BASE_URL の有無に関わらず service binding を最優先
  return readEnv().API_SERVICE;
}
```

## 編集禁止箇所

- `getBaseUrl()` の優先順位ロジック(`process.env.PUBLIC_API_BASE_URL ?? env.PUBLIC_API_BASE_URL ?? DEFAULT_BASE_URL`)
- `doFetch()` の transport 分岐シグネチャ
- `logTransport()` ラベル(`service-binding` / `http-fallback`)
- `fetchPublic()` / `fetchPublicOrNotFound()` シグネチャ
- `interface ServiceBinding` / `interface PublicEnv` / `interface FetchPublicOptions`
- `FetchPublicNotFoundError` クラス

## 副作用がないことの確認

- `apps/web/src/lib/env.ts` の zod schema には触らない
- `apps/web/wrangler.toml` には触らない
- `apps/web/src/app/**` には触らない
- `apps/api/**` には触らない

## 実装後の grep チェック

```bash
# isTestOrPlaywright 以外で本ファイル内に process.env.* 直参照を新規追加していないこと
grep -nE "process\.env\." apps/web/src/lib/fetch/public.ts
# 期待: getBaseUrl 内・getServiceBinding 内・isTestOrPlaywright 内のみ
```

## 完了条件(Phase 5)

1. `apps/web/src/lib/fetch/public.ts` に `isTestOrPlaywright()` が追加されている
2. `getServiceBinding()` の早期 return が `isTestOrPlaywright() && process.env.PUBLIC_API_BASE_URL` に変更されている
3. ファイル冒頭コメントが更新されている
4. その他箇所(`getBaseUrl` / `doFetch` / `fetchPublic` / `fetchPublicOrNotFound`)に意図しない変更がない(`git diff` で確認)
5. `mise exec -- pnpm --filter @ubm-hyogo/web typecheck` exit 0
