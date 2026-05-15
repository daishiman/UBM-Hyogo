# Phase 4: テスト計画

[実装区分: 実装仕様書]

> Phase: 4 / 13

---

## テスト対象

`apps/web/src/lib/fetch/public.ts` の `getServiceBinding()` 環境ガード挙動。具体的には `isTestOrPlaywright()` の env 判定結果と `PUBLIC_API_BASE_URL` の組み合わせによる transport 選択(service-binding / http-fallback)。

## テストファイル

| ファイル | 変更種別 |
|----------|---------|
| `apps/web/src/lib/fetch/public.spec.ts` | 編集(追記) |

新規 spec ファイルは作らない。既存 `public.spec.ts` の末尾に `describe('getServiceBinding env guard regression', ...)` block を追加する。

## 既存 mock 経路の踏襲

`apps/web/src/lib/fetch/public.spec.ts:6-28` の以下既存 pattern を踏襲する:

- `cloudflareEnv: { API_SERVICE?, PUBLIC_API_BASE_URL? }` を closure で保持
- `cloudflareContext = vi.fn(() => ({ env: cloudflareEnv }))` を `@opennextjs/cloudflare` の mock として注入
- `reset()` で `cloudflareEnv` と `process.env.PUBLIC_API_BASE_URL` を初期化
- `mockFetchOnce` / `restoreFetch` は `apps/web/src/test-utils/fetch-mock` から import

`process.env.NODE_ENV` / `process.env.CI` / `process.env.PLAYWRIGHT_TEST` は `vi.stubEnv()` / `vi.unstubAllEnvs()` で個別に stub する。`CI` は safety case 用であり fallback trigger にはしない。`afterEach(() => vi.unstubAllEnvs())` を追加。

## テストケース一覧

| ID | 名前 | env 設定 | binding | `PUBLIC_API_BASE_URL`(process.env) | 期待 transport | assert 内容 |
|----|------|---------|---------|-----------------------------------|-------------|---------|
| AC-R-02 | production context で service binding が最優先される | `NODE_ENV=production`, `CI`=unstub, `PLAYWRIGHT_TEST`=unstub | あり | `https://wrong-fallback.example.com` | service-binding | `bindingFetch` 1 回呼ばれる / `global.fetch` 呼ばれない / url=`https://service-binding.local/health` |
| AC-R-01 | NODE_ENV=test で HTTP fallback が優先される | `NODE_ENV=test` | あり | `http://127.0.0.1:8787` | http-fallback | `global.fetch` 1 回呼ばれる / `bindingFetch` 呼ばれない |
| AC-R-03 | CI=true 単独では service binding が優先される | `NODE_ENV=production`, `CI=true`, `PLAYWRIGHT_TEST`=unstub | あり | `http://127.0.0.1:8787` | service-binding | `bindingFetch` 1 回呼ばれる / `global.fetch` 呼ばれない |
| edge-1 | staging で `PUBLIC_API_BASE_URL` 未設定 → service binding | `NODE_ENV=production`, `CI`=unstub | あり | 未設定 | service-binding | `bindingFetch` 1 回 / `global.fetch` 0 回 |
| edge-2 | local dev で service binding 不在 → HTTP fallback | `NODE_ENV=development` | なし | `http://localhost:8787` | http-fallback | `global.fetch` 1 回 / url=`http://localhost:8787/health` |
| edge-3 | PLAYWRIGHT_TEST=1 では HTTP fallback 優先 | `PLAYWRIGHT_TEST=1` | あり | `http://127.0.0.1:8787` | http-fallback | `global.fetch` 1 回 / `bindingFetch` 0 回 |

## 期待される transport assertion パターン

```ts
// service-binding 期待
expect(bindingFetch).toHaveBeenCalledTimes(1);
expect(globalFetchSpy).not.toHaveBeenCalled();
const [url] = bindingFetch.mock.calls[0];
expect(url).toBe("https://service-binding.local/health");

// http-fallback 期待
expect(globalFetchSpy).toHaveBeenCalledTimes(1);
expect(bindingFetch).not.toHaveBeenCalled();
const [url] = globalFetchSpy.mock.calls[0];
expect(url).toBe(`${expectedBaseUrl}/health`);
```

## 逆 assertion 妥当性確認(Phase 9 で実施)

AC-R-02 の test を一時的に以下に書き換え、`pnpm test` が **fail** することを確認する。

```ts
// 一時的逆書き(commit しない)
expect(bindingFetch).not.toHaveBeenCalled();
```

確認後すぐ元に戻し、`git diff` でクリーンであることを観測。差分は commit せず手元観測のみで evidence とする。

## 含まないテスト

- Playwright e2e は本タスクで追加しない(unit test で transport 選択ロジックを直接検証できるため)
- visual regression test は追加しない(NON_VISUAL)
- `apps/api` 側 endpoint の integration test は追加しない

## ローカル実行コマンド

```bash
mise exec -- pnpm --filter @ubm-hyogo/web test src/lib/fetch/public.spec.ts
```
