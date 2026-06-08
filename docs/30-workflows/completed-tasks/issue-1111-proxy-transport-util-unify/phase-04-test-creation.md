# Phase 04 — テスト作成（TDD）

## 1. 方針

新規 util `apps/web/src/lib/fetch/transport-select.ts` は **純粋関数 3 つ**（`stripTrailingSlash` / `resolveServiceBinding` / `selectAndFetch`）のみで構成され、内部 state を持たない。したがってテストは「入力 → 戻り値・副作用（fetch 呼び出し URL / log 引数）」の写像を確認する形に限定する。private メソッド・内部 state のテストは不要。

- テストファイル: `apps/web/src/lib/fetch/__tests__/transport-select.spec.ts`（**`*.spec.ts` 固定**・`*.test.*` は CLAUDE.md 不変条件 #8 で禁止）
- mock 方針: `binding.fetch` / global `fetch` / `log` をすべて `vi.fn()` で差し替え、呼び出し回数・第 1 引数 URL・log 引数を assert する。実ネットワークアクセスは発生させない（D1 直接アクセス禁止・apps/api 非接触）。
- 各 it は §2 のケース表の 1 行に 1:1 対応させる。
- 期待挙動は phase-01 §4-7 真理値表 / phase-02 §2 の実装を不変参照とする。

### テスト実行コマンド

`apps/web` には `vitest.config.ts` が無いため、リポジトリルートから config を明示して実行する。

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts \
  apps/web/src/lib/fetch/__tests__/transport-select.spec.ts
```

## 2. 新規 util 単体テストケース設計（`transport-select.spec.ts`）

### 2.1 `stripTrailingSlash`

| # | 入力 `base` | 期待戻り値 |
| --- | --- | --- |
| T-1 | `"http://localhost:8787/"` | `"http://localhost:8787"`（末尾 `/` 除去） |
| T-2 | `"http://localhost:8787"` | `"http://localhost:8787"`（末尾 `/` 無し → 不変） |
| T-3 | `"https://api.example.com/v1/"` | `"https://api.example.com/v1"`（末尾の 1 個のみ除去・`/v1` の内部 `/` は保持） |

> 実装は `base.replace(/\/$/, "")`。末尾 1 個のみを対象とし、空文字や `/` 連続は本タスクの呼び出し側 base 形状（origin もしくは origin+path）では発生しないため正常系のみを固定する。

### 2.2 `resolveServiceBinding`

| # | 入力 `binding` | 入力 `disableBinding` | 期待戻り値 |
| --- | --- | --- | --- |
| T-4 | `{ fetch: bindingFetch }` | `true` | `undefined`（binding 無効化） |
| T-5 | `{ fetch: bindingFetch }` | `false` | `{ fetch: bindingFetch }`（同一参照をそのまま返す） |
| T-6 | `undefined` | `false` | `undefined`（binding 自体が未注入） |
| T-7 | `undefined` | `true` | `undefined` |

> 実装は `disableBinding ? undefined : binding`。判定述語（`isTestOrPlaywright`）は util に含めず、呼び出し側が計算した `disableBinding` boolean のみ受け取る（症状1/2 を吸収）。T-5 は戻り値が引数 `binding` と**同一参照**であることを `toBe` で確認する。

### 2.3 `selectAndFetch`

mock 準備:

```ts
const bindingFetch = vi.fn(async () => new Response("ok", { status: 200 }));
const log = vi.fn();
const globalFetch = vi.fn(async () => new Response("ok", { status: 201 }));
vi.stubGlobal("fetch", globalFetch); // afterEach で vi.unstubAllGlobals()
const init: RequestInit = { method: "GET" };
```

| # | binding | resolveBase | log | path | 期待 kind | fetch URL（第1引数） | log 呼び出し |
| --- | --- | --- | --- | --- | --- | --- | --- |
| T-8（binding 経路） | `{ fetch: bindingFetch }` | `() => "http://x"`（未使用） | `log` | `"/admin/x"` | `"service-binding"` | `bindingFetch` に `"https://service-binding.local/admin/x"`・global fetch 未呼出 | `log("service-binding", "/admin/x", 200)` 1 回 |
| T-9（http-fallback 経路） | `undefined` | `() => "http://localhost:8787"` | `log` | `"/members"` | `"http-fallback"` | global `fetch` に `"http://localhost:8787/members"`・binding 未呼出 | `log("http-fallback", "/members", 201)` 1 回 |
| T-10（base-unavailable 経路） | `undefined` | `() => null` | `log` | `"/x"` | `"base-unavailable"` | global `fetch` **未呼出**・binding 未呼出 | `log` **未呼出**（0 回） |
| T-11（log 未指定・route.ts 相当 / binding 経路） | `{ fetch: bindingFetch }` | `() => "http://x"` | （未指定） | `"/y"` | `"service-binding"` | `bindingFetch` に `"https://service-binding.local/y"` | log を渡していないのでログ呼び出し自体が発生しない（例外も起きない） |
| T-12（log 未指定・http-fallback 経路） | `undefined` | `() => "http://h"` | （未指定） | `"/z"` | `"http-fallback"` | global `fetch` に `"http://h/z"` | ログ呼び出しなし・例外なし |
| T-13（bindingUrlPrefix default 確認） | `{ fetch: bindingFetch }` | `() => "http://x"` | `log` | `"/p"` | `"service-binding"` | `bindingFetch` 第1引数が default prefix `"https://service-binding.local"` + path = `"https://service-binding.local/p"` | — |
| T-14（bindingUrlPrefix 明示上書き） | `{ fetch: bindingFetch }`・`bindingUrlPrefix: "https://svc"` | `() => "http://x"` | `log` | `"/p"` | `"service-binding"` | `bindingFetch` 第1引数 = `"https://svc/p"` | — |

補足 assert:

- **戻り値の `response`**: T-8/T-11/T-13/T-14 は `result.response.status === 200`（binding 側 mock）、T-9/T-12 は `201`（global fetch 側 mock）であること。
- **init 透過**: 各経路の fetch 第 2 引数が呼び出し側から渡した `init` と同一参照であること（`selectAndFetch` は init を加工しない）。
- **base-unavailable の網羅**（T-10）: `result` に `response` プロパティが存在しないこと（discriminated union の `{ kind: "base-unavailable" }` 分岐）。

## 3. 回帰テスト（既存 5 ファイル）の扱い

新規作成しない。util 切替後に**変更せず再実行して PASS を確認**する（pure refactor の機械判定ゲート）。

| 既存 spec | 担保する不変 |
| --- | --- |
| `apps/web/app/api/admin/[...path]/route.spec.ts` | admin mutation の binding/HTTP 分岐・base-unavailable 時 500・secret/header 構築 |
| `apps/web/src/lib/admin/__tests__/server-fetch.binding.spec.ts` | admin read の service-binding 経路・fixture 経路の binding 無効化 |
| `apps/web/src/lib/admin/__tests__/server-fetch.http-fallback.spec.ts` | admin read の HTTP fallback 経路・`logAdminTransport`(scope:admin) |
| `apps/web/src/lib/admin/__tests__/server-fetch.env.spec.ts` | env アクセサ経由の base 解決 |
| `apps/web/src/lib/fetch/public.spec.ts` | public read の binding/HTTP 分岐・`logTransport`(scope 無し)・PLAYWRIGHT cache bypass |

回帰一括実行:

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run --root=../.. --config=vitest.config.ts \
  apps/web/src/lib/fetch/__tests__/transport-select.spec.ts \
  apps/web/app/api/admin/[...path]/route.spec.ts \
  apps/web/src/lib/admin/__tests__/server-fetch.binding.spec.ts \
  apps/web/src/lib/admin/__tests__/server-fetch.http-fallback.spec.ts \
  apps/web/src/lib/admin/__tests__/server-fetch.env.spec.ts \
  apps/web/src/lib/fetch/public.spec.ts
```

## 4. Phase 04 完了条件

- [x] `transport-select.spec.ts` に transport 選択・base-unavailable・例外伝播の 9 cases を実装。
- [x] 各ケースの期待 kind / fetch URL / log 引数が §2 表どおりに assert されている。
- [x] `vi.fn()` mock のみで実ネットワーク・実 D1 アクセスが発生しない。
- [x] 回帰 5 ファイルは編集せず、focused suite で再実行した。
