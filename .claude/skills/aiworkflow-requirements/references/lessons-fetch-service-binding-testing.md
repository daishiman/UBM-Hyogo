# Lessons Learned: UT-05A fetchPublic Service-Binding Testing

> 起源: `docs/30-workflows/ut-05a-fetchpublic-service-binding-001/` (Issue #387)
> 適用: `apps/web/src/lib/fetch/public.ts` の transport 二経路（service-binding / HTTP fallback）の実装と test 設計

## L-UT05A-FP-001: `getCloudflareContext()` mock は closure + reset が必要

`@opennextjs/cloudflare` の `getCloudflareContext()` を `vi.mock` するとき、戻り値の `env` をテスト毎に書き換えるためには module-scope closure (`cloudflareEnv`) を持たせ、`beforeEach` で `cloudflareEnv = {}` にリセットする pattern が必要だった。

- 単純に `vi.mock(..., () => ({ getCloudflareContext: () => ({ env: { ... } }) }))` で書くと test 間で `env.API_SERVICE` が固定され、HTTP fallback 経路の検証で前テストの service binding が leak する。
- 正解は `let cloudflareEnv: Record<string, unknown> = {}` を mock module の closure に置き、`vi.mock` の factory が closure を参照する。各 test で `cloudflareEnv.API_SERVICE = mockBinding` のように差し替え、`beforeEach` で `cloudflareEnv = {}`。

## L-UT05A-FP-002: service-binding テストは globalFetch も並行 mock

service-binding 経路の AC-1（binding 優先）を検証するとき、`vi.stubGlobal('fetch', ...)` で globalThis.fetch も mock しないと、binding.fetch 実装に bug が混入して fallback パスへすり抜けても green になる。

- `binding.fetch` mock 呼び出し回数 = 1、globalFetch 呼び出し回数 = 0 を **両方** assert する。
- 逆に HTTP fallback テストでは `env.API_SERVICE` 未注入で globalFetch 呼び出し回数 = 1 を assert し、binding 側 spy が呼ばれていないことも assert する。
- 双方向 assertion で「binding を見ているつもりが http に落ちていた」事故を即時検知できる。

## L-UT05A-FP-003: transport label は構造化 console.log で deploy verification と test 契約を共有する

`logTransport(transport: 'service-binding' | 'http-fallback', meta)` を 1 関数で正本化し、`apps/web/src/lib/fetch/public.ts` 内で transport 確定時に必ず呼ぶ。

- test 側は `console.log` を `vi.spyOn(console, 'log')` で観察し、第一引数が `[fetchPublic]` prefix + transport field を含む構造化 payload であることを assert する。
- AC-5 の deploy verification は `bash scripts/cf.sh tail` で同じ payload を grep し、production / staging で binding 経路に乗っているかを確認する。
- test 実装と runtime evidence が **同一の structured log contract** を共有することで、test green = runtime tail で transport label が出る、を保証できる。
- 構造化と書式安定が前提なので、`console.log(...)` の引数順や key 名を変えると runtime 側 grep が壊れる。変更時は phase-11 evidence contract も同 wave で更新する。

## L-UT05A-FP-004: HTTP fallback 経路は loopback subrequest 404 に注意し、service-binding を一次経路にする

HTTP fallback URL は `getBaseUrl()` 経由で `PUBLIC_API_BASE_URL` を読むが、staging で同一 Cloudflare account の `*.workers.dev` に対する loopback subrequest が 404 を返す事象が表面化した。

- このため production / staging では **service-binding が必ず一次経路**でなければならない。HTTP fallback は local dev (`pnpm dev` 等) で `API_SERVICE` binding が未注入のときの保険であり、`workers.dev` ホスト宛の loopback fetch を期待しない。
- service-binding URL は `https://service-binding.local${path}` を使う。host は worker 側で無視されるが、`new URL(...)` parse が必要なため正規 URL の体裁を維持する。
- AC-5 の tail 検証では production / staging で `transport: 'service-binding'` が出ていることを必須化し、`http-fallback` が出ていたら configuration drift として扱う（`apps/web/wrangler.toml` の `[services]` binding 未設定を疑う）。

## L-UT05A-FP-005: classification は "spec_created / runtime evidence pending" を堅持する

`apps/web/src/lib/fetch/public.ts` と `*.test.ts` は実装＆静的 PASS まで進んでいるが、Phase 11 の deploy / curl / tail evidence は user の明示指示後にのみ取得する。

- skill 同期では `implemented-local` ではなく `spec_created / implementation / runtime evidence pending_user_approval` を採用する。理由: production / staging の `cf.sh deploy` は user-gated boundary であり、ここを越えるまで runtime PASS は claim できない。
- Issue #387 は CLOSED のまま、commit / push / PR / production deploy も user 明示指示後のみ。

---

## 同期参照

- `docs/30-workflows/ut-05a-fetchpublic-service-binding-001/index.md`
- `docs/30-workflows/ut-05a-fetchpublic-service-binding-001/outputs/phase-11/{code-diff-summary.md,staging-curl.log,production-curl.log,wrangler-tail-staging.log,local-dev-fallback.log,redaction-checklist.md}`
- `apps/web/src/lib/fetch/public.ts`, `apps/web/src/lib/fetch/public.test.ts`
- `apps/web/wrangler.toml`, `apps/api/wrangler.toml`
