# Phase 2: 設計

[実装区分: 実装仕様書]

> Phase: 2 / 13

---

## 設計方針

`getServiceBinding()` の早期 return を「環境ガード(`isTestOrPlaywright()`) を満たした場合のみ `PUBLIC_API_BASE_URL` で HTTP fallback に倒す」に変更する。production / staging Cloudflare Workers runtime では `isTestOrPlaywright()` が常に false を返すため、`PUBLIC_API_BASE_URL` の有無に関わらず service binding が選択される。

## 変更対象ファイル一覧

| パス | 変更種別 | 主な変更内容 |
|------|---------|--------------|
| `apps/web/src/lib/fetch/public.ts` | 編集 | `isTestOrPlaywright()` ヘルパ追加、`getServiceBinding()` 条件変更、ファイル冒頭 transport コメント更新 |
| `apps/web/src/lib/fetch/public.spec.ts` | 編集 | AC-R-01..R-05 regression test +3..5 ケース追加 |
| `docs/30-workflows/issue-666-fetch-public-service-binding-regression/outputs/phase-11/evidence/*.txt` | 新規 | Phase 11 evidence(test 実行ログ・逆 assertion 確認ログ) |

## API / 関数シグネチャ設計

### `apps/web/src/lib/fetch/public.ts`

```ts
// 新規追加
function isTestOrPlaywright(): boolean {
  return (
    process.env.NODE_ENV === "test" ||
    process.env.PLAYWRIGHT_TEST === "1"
  );
}

// 既存編集
function getServiceBinding(): ServiceBinding | undefined {
  // test/CI 限定: PUBLIC_API_BASE_URL 明示時に HTTP fallback を優先(mock API 差し替えのため)
  if (isTestOrPlaywright() && process.env.PUBLIC_API_BASE_URL) return undefined;
  // production / staging: PUBLIC_API_BASE_URL の有無に関わらず service binding を最優先
  return readEnv().API_SERVICE;
}
```

`isTestOrPlaywright()` は public export しない(モジュール内部の helper)。`getBaseUrl()` / `doFetch()` / `fetchPublic()` / `fetchPublicOrNotFound()` のシグネチャは変更しない。

### 入力・出力・副作用

| 関数 | 入力 | 出力 | 副作用 |
|------|------|------|--------|
| `isTestOrPlaywright()` | なし(`process.env` 参照) | `boolean` | なし(read-only) |
| `getServiceBinding()` | なし | `ServiceBinding \| undefined` | なし |

副作用なし(read-only env 参照のみ)。`logTransport()` の出力ラベル `service-binding` / `http-fallback` は変更しない。

## env 判定キー設計

| キー | 想定セッター | 採用根拠 |
|------|-------------|---------|
| `NODE_ENV === 'test'` | vitest | vitest デフォルトで `NODE_ENV=test` をセット |
| `PLAYWRIGHT_TEST === '1'` | Playwright runner | `apps/web/playwright.config.ts` で明示セット |

OR 結合(いずれか一つでも真なら true)。`CI=true` は GitHub Actions の build/deploy でも常時立つため transport 判定には使わない。

## 設計上の不変条件

- `apps/web` env 不変条件: `process.env.*` 直参照は `isTestOrPlaywright()` ヘルパ 1 箇所と既存 `getBaseUrl()` / `getServiceBinding()` のみに閉じる。新規の直参照箇所を増やさない。
- `getEnv()` zod schema に `NODE_ENV` / `PLAYWRIGHT_TEST` を追加しない(test runtime 判定は zod schema の対象外と位置づける)。理由: 過剰に schema へ test 判定を入れると production runtime で `getEnv()` parse 時に test env を要求する誤シグナルになる。
- `getBaseUrl()` の `process.env.PUBLIC_API_BASE_URL ?? env.PUBLIC_API_BASE_URL ?? DEFAULT_BASE_URL` 順序は変更しない(fallback 値の優先度は本タスクのスコープ外)。

## コメント更新方針

`apps/web/src/lib/fetch/public.ts:5-8` のファイル冒頭 transport 経路コメントを以下に書き換える:

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
```

## テスト設計

詳細は Phase 4 参照。サマリ:

| ケース ID | env 設定 | service binding | `PUBLIC_API_BASE_URL` | 期待 transport |
|-----------|---------|-----------------|----------------------|--------------|
| AC-R-02 production | `NODE_ENV=production` / `CI`=未設定 / `PLAYWRIGHT_TEST`=未設定 | あり | `https://wrong-fallback.example.com` | service-binding |
| AC-R-03 CI safety | `CI=true`, `PLAYWRIGHT_TEST` 未設定 | あり | `http://127.0.0.1:8787` | service-binding |
| edge-1 staging | `NODE_ENV=production` / `CI`=未設定 | あり | 未設定 | service-binding |
| edge-2 local dev | `NODE_ENV=development` | なし | `http://localhost:8787` | http-fallback |
| edge-3 PLAYWRIGHT_TEST | `PLAYWRIGHT_TEST=1` | あり | `http://127.0.0.1:8787` | http-fallback |

## 設計上のリスクと緩和策

| リスク | 緩和策 |
|--------|--------|
| production wrangler.toml `[vars]` に誤って `PLAYWRIGHT_TEST=1` 等が混入 | 本タスクは assumption とし、混入時の挙動検出は `task-18` regression smoke 系列に hand-off |
| OpenNext Workers bundle で `process.env.NODE_ENV` が build-time に `production` 固定される挙動と runtime polyfill 仕様の差 | Phase 9 QA で OpenNext build 後の bundle に `isTestOrPlaywright()` の dead-code elimination が発生しないことを `pnpm build` で確認 |
| `binding.fetch` と `global.fetch` の同時 mock 困難 | 既存 `vi.mock('@opennextjs/cloudflare', ...)` パターンを踏襲、`afterEach` で `vi.clearAllMocks()` |
