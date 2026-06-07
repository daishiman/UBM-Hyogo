# Task A — server-side fetch を service-binding 優先へ統一

[実装区分: 実装仕様書]
implementation_mode: new

> Lane A。`apps/web` の web→api server-side fetch 全経路を service-binding（`API_SERVICE`）優先へ統一し、`localhost` / `127.0.0.1` fallback を `local` 環境限定（fail-closed）にする。1 実装サイクル / 1 PR（CONST_007）で完了するスコープ。

---

## 0. 背景（根本原因・確定済み）

ステージング `https://ubm-hyogo-web-staging.daishimanju.workers.dev` の `/profile` で「セッション情報を取得できませんでした」が出る真因:

- `apps/web`（Cloudflare Workers / OpenNext）が**同一 Cloudflare account 上の** API Worker（`ubm-hyogo-api-staging`）へ「plain `fetch()` で外向き HTTP（`https://ubm-hyogo-api-staging.daishimanju.workers.dev`）」すると、同一 account の `*.workers.dev` 宛 loopback で **404** を返す。
- `apps/web/src/lib/fetch/public.ts:6-8` はこれを「service-binding `API_SERVICE.fetch()` を常に優先」で回避済み。しかし `fetchAuthed`（`apps/web/src/lib/fetch/authed.ts:47`）と各 proxy / auth route は plain `fetch(target)` のまま未対応。
- 先行タスク `task-05a-fetchpublic-service-binding-001` が `public.ts` だけを service-binding 化した取りこぼしが原因。
- 401 ではなく **404** が出る事実が「`sessionGuard` 到達前（API ルーティング層 / loopback）で失敗」を示す（`apps/api/src/middleware/session-guard.ts:78-99` は 401/410 のみ返す）。

このタスクは server-side fetch 全経路を `public.ts` と同じ service-binding 優先に揃える。

---

## 1. 変更対象ファイル一覧（パス + 変更種別）

| # | パス | 種別 | 概要 |
|---|------|------|------|
| 1 | `apps/web/src/lib/fetch/transport.ts` | **新規** | transport 選択を単一化する `resolveApiFetch` / `ApiTransportEnv` |
| 2 | `apps/web/src/lib/fetch/authed.ts` | 編集 | `getApiBaseEnv()` → `getAuthEnv()` + `resolveApiFetch()` 経由に切替（binding 優先） |
| 3 | `apps/web/src/lib/env.ts` | 編集 | `getEnvironment(rawEnv?)` 追記 |
| 4 | `apps/web/app/api/me/[...path]/route.ts` | 編集 | `FALLBACK_INTERNAL_API` 直 fetch → `resolveApiFetch()` 経由（`getAuthEnv()` 由来） |
| 5 | `apps/web/app/api/admin/[...path]/route.ts` | 編集 | `LOCAL_DEV_FALLBACK` 直 fetch → `resolveApiFetch()` 経由（`getAdminFetchEnv()` 由来） |
| 6 | `apps/web/app/api/auth/magic-link/route.ts` | 編集 | `FALLBACK_INTERNAL_API` 直 fetch → `resolveApiFetch()` 経由 |
| 7 | `apps/web/app/api/auth/magic-link/verify/route.ts` | 編集 | 同上 |
| 8 | `apps/web/app/api/auth/gate-state/route.ts` | 編集 | 同上 |
| 9 | `apps/web/src/lib/auth/verify-magic-link.ts` | 編集 | `resolveApiBase()` → `resolveApiFetch()` 経由（`fetchImpl` / `apiBaseUrl` override は維持） |
| 10 | `apps/web/src/lib/fetch/transport.spec.ts` | **新規** | `resolveApiFetch` の 5 分岐網羅 |
| 11 | `apps/web/src/lib/fetch/authed.spec.ts` | 編集 | binding 優先 / search 保持 / 401 / 非 2xx の追加・既存維持 |
| 12 | `apps/web/app/api/me/[...path]/route.route.spec.ts` | **新規** | proxy の binding 優先 + cookie / search 保持 |

> **スコープ外（Lane B / C）**: `public.ts` の client localhost 根絶（Lane B）、`scripts/` の secret parity / grep gate / staging smoke（Lane C）。本タスクは server-side fetch の transport 統一のみ。

> **不変条件**: env 参照は `apps/web/src/lib/env.ts` の公開アクセサ経由のみ（`process.env.*` 直接禁止・CLAUDE.md task-02）。D1 直接アクセス禁止（不変条件 #5）。認証境界は fail-closed（不変条件 #11）。

---

## 2. 主要関数 / 型のシグネチャ・構造

### 2-1. `transport.ts`（新規）

```ts
// apps/web/src/lib/fetch/transport.ts（新規）
// web → api の server-side fetch transport 選択を単一化する。
// 同一 Cloudflare account の *.workers.dev への外向き fetch は loopback 404 になるため、
// staging / production では service-binding(API_SERVICE) を最優先する（public.ts:6-8 と同方針）。

export interface ApiTransportEnv {
  /** Workers binding。staging / production で wrangler.toml [[services]] により注入される。 */
  API_SERVICE?: { fetch: typeof fetch };
  /** 解決済みの HTTP base URL（INTERNAL_API_BASE_URL or PUBLIC_API_BASE_URL）。末尾 / は呼び出し前に正規化推奨。 */
  baseUrl?: string;
  /** 実行環境。fail-closed 判定に使う。 */
  environment?: "local" | "staging" | "production";
  /** test / Playwright 実行中か（NODE_ENV==="test" || PLAYWRIGHT_TEST==="1"）。 */
  isTest?: boolean;
}

export type ApiTransport =
  | { kind: "service-binding"; fetch: typeof fetch }
  | { kind: "http"; baseUrl: string };

/**
 * transport を 1 箇所で決定する。判定優先順は §3-1 の表を参照。
 * 全条件に当てはまらない（base URL も binding も無く非 local）場合は throw（fail-closed）。
 */
export function resolveApiFetch(env: ApiTransportEnv): ApiTransport;

/** service-binding 経由の URL を組む。host は worker 側で無視されるが URL parse のため固定 host を使う（public.ts:69 と同パターン）。 */
export const SERVICE_BINDING_ORIGIN = "https://service-binding.local";
```

### 2-2. `getEnvironment`（env.ts 追記）

```ts
// apps/web/src/lib/env.ts（追記）
export function getEnvironment(
  rawEnv: RawEnv = readRawEnv(),
): "local" | "staging" | "production" {
  const v = rawEnv["ENVIRONMENT"];
  return v === "staging" || v === "production" ? v : "local";
}
```

### 2-3. `fetchAuthed` 改修後の形

```ts
export const fetchAuthed = async <T>(path: string, init?: RequestInit): Promise<T>
```

シグネチャは不変。内部の transport 選択のみ差替。`AuthRequiredError`（401）/ `FetchAuthedError`（非 2xx）/ cookie 転送 / `cache: "no-store"` は現状維持。

### 2-4. proxy route（共通形）

各 route のシグネチャ（`proxy(req, ctx)` / `POST` / `GET` 等）は不変。`apiBase()` 系の文字列解決を `resolveApiFetch()` ベースの transport 選択へ置換し、`url` 組み立てと `fetch` 呼び出しだけを transport 分岐に通す。cookie / authorization / content-type / `cf-connecting-ip` の forward、`url.search` / `url.searchParams` の保持は現状維持。

---

## 3. 入力 / 出力 / 副作用

### 3-1. `resolveApiFetch` の分岐挙動（判定優先順）

上から順に評価し、最初に一致した分岐を採用する。

| 評価順 | 条件 | 返り値 | 理由 |
|--------|------|--------|------|
| (a) | `isTest && baseUrl` あり | `{ kind: "http", baseUrl }` | test / Playwright で deterministic mock API へ差替可能にする（public.ts:37-38 と同方針） |
| (b) | `API_SERVICE` あり | `{ kind: "service-binding", fetch: API_SERVICE.fetch }` | staging / production の正規経路。loopback 404 回避 |
| (c) | `baseUrl` あり（binding 無・非 test） | `{ kind: "http", baseUrl }` | local `next dev` で binding 不在のケース |
| (d) | 全無 & `environment === "local"` | `{ kind: "http", baseUrl: "http://localhost:8787" }` | local fallback のみ許可 |
| (e) | 全無 & 非 local | **throw** `Error("resolveApiFetch: API transport unresolved (no API_SERVICE binding and no base URL) in non-local runtime")` | fail-closed。staging / production で silent に localhost へ落とさない（AC-3） |

> **(a) を (b) より先**にするのは、vitest / Playwright が `API_SERVICE` を mock として持ちつつ HTTP mock API に向けたいケースがあるため（既存 `public.ts` の `getServiceBinding()` が `isTestOrPlaywright() && PUBLIC_API_BASE_URL` で binding を返さない挙動と同一）。

### 3-2. service-binding 経路の URL 組み立て

- `kind === "service-binding"`: `await transport.fetch(\`${SERVICE_BINDING_ORIGIN}${path}\`, init)`。host は worker 側で無視される。`path` は先頭 `/` 始まり前提。proxy では `path = "/me/..." + url.search` のように **search を連結したフルパス**を渡す。
- `kind === "http"`: `await fetch(\`${transport.baseUrl}${path}\`, init)`。`baseUrl` は末尾 `/` 除去済みを前提（各 route で `.replace(/\/$/, "")` 後に渡す）。

### 3-3. cookie / search の保持（副作用なし・透過）

- `fetchAuthed`: `cookies()`（`next/headers`）から全 cookie を `name=value; ...` で `cookie` ヘッダに転送（現状の `buildCookieHeader` を維持）。`init.headers` をマージ。
- proxy 群: `req.headers` の `cookie` / `authorization` / `content-type` / `x-ubm-dev-session`（me）/ `cf-connecting-ip`（auth）を transport へ素通し。`url.search`（me / admin）/ `url.searchParams`（gate-state の `email`）を upstream URL に保持。
- loopback 回避: staging / production では binding 経由になるため、**外向き HTTP（loopback 404 を誘発する経路）には到達しない**。これが AC-1 / AC-2 の達成手段。

### 3-4. Before / After スニペット（各変更箇所）

#### (A) `authed.ts`

**Before**（`apps/web/src/lib/fetch/authed.ts:7,12-21,40-51`）:

```ts
import { getApiBaseEnv } from "@/lib/env";

const resolveApiBase = (): string => {
  const env = getApiBaseEnv();
  const internal = env.INTERNAL_API_BASE_URL;
  if (internal && internal.length > 0) return internal.replace(/\/$/, "");
  const pub = env.PUBLIC_API_BASE_URL;
  if (pub && pub.length > 0) return pub.replace(/\/$/, "");
  throw new Error(
    "fetchAuthed: neither INTERNAL_API_BASE_URL nor PUBLIC_API_BASE_URL is configured",
  );
};
// ...
  const base = resolveApiBase();
  const url = `${base}${path}`;
  const cookieHeader = await buildCookieHeader();
  const headers = new Headers(init?.headers);
  if (cookieHeader.length > 0) headers.set("cookie", cookieHeader);
  if (!headers.has("accept")) headers.set("accept", "application/json");

  const res = await fetch(url, {
    ...init,
    headers,
    cache: "no-store",
  });
```

**After**:

```ts
import { getAuthEnv, getEnvironment } from "@/lib/env";
import { resolveApiFetch, SERVICE_BINDING_ORIGIN } from "./transport";

// NODE_ENV / PLAYWRIGHT_TEST は env.ts 経由でのみ参照する（process.env 直接禁止）。
// getAuthEnv は API_SERVICE / INTERNAL_API_BASE_URL を返す（env.ts:136-142）。
const isTestRuntime = (): boolean => {
  // env.ts の readRawEnv() は PLAYWRIGHT_TEST=1 時に process.env を merge する（env.ts:102-104）。
  // NODE_ENV はテスト時のみ "test"。どちらも env.ts 経由の rawEnv から読む。
  const raw = readRawEnvForTransport();
  return raw["NODE_ENV"] === "test" || raw["PLAYWRIGHT_TEST"] === "1";
};
// ...
  const env = getAuthEnv();
  const transport = resolveApiFetch({
    API_SERVICE: env.API_SERVICE,
    baseUrl: env.INTERNAL_API_BASE_URL
      ? env.INTERNAL_API_BASE_URL.replace(/\/$/, "")
      : undefined,
    environment: getEnvironment(),
    isTest: isTestRuntime(),
  });
  const cookieHeader = await buildCookieHeader();
  const headers = new Headers(init?.headers);
  if (cookieHeader.length > 0) headers.set("cookie", cookieHeader);
  if (!headers.has("accept")) headers.set("accept", "application/json");

  const res =
    transport.kind === "service-binding"
      ? await transport.fetch(`${SERVICE_BINDING_ORIGIN}${path}`, {
          ...init,
          headers,
          cache: "no-store",
        })
      : await fetch(`${transport.baseUrl}${path}`, {
          ...init,
          headers,
          cache: "no-store",
        });
```

> **`isTestRuntime` の `NODE_ENV` / `PLAYWRIGHT_TEST` 参照について**: `process.env` 直接参照は不変条件で禁止。`env.ts` に test runtime を expose する小ヘルパ `getTransportRuntimeEnv()`（`{ isTest: boolean }` か `{ NODE_ENV?, PLAYWRIGHT_TEST? }`）を追加し、`authed.ts` / proxy はそれを呼ぶ。既存 `getPublicFetchEnv` / `getAdminFetchEnv` が `NODE_ENV` / `PLAYWRIGHT_TEST` を返す（env.ts:167-170,186-189）ので、**`getAuthEnv` 系の rawEnv から `isTest` を算出する小ヘルパ**を env.ts に置くのが最小。実装者は `getAdminFetchEnv()` / `getPublicFetchEnv()` の既存パターンに倣い `getAuthEnv` 拡張ではなく**専用ヘルパ追加**で対応すること（既存 `getAuthEnv` 戻り値型を壊さない）。

> 上記スニペットの `readRawEnvForTransport()` は説明用の仮称。実装では env.ts に `getTransportRuntimeIsTest(rawEnv?)` を追加し、`authed.ts` / 各 proxy はそれを import して使う。

#### (B) `env.ts`（追記 2 関数）

```ts
// getEnvironment は §2-2 のとおり。加えて test runtime 判定を expose:
export function getTransportRuntimeIsTest(rawEnv: RawEnv = readRawEnv()): boolean {
  const processEnv = readProcessEnv();
  const nodeEnv = processEnv["NODE_ENV"] ?? rawEnv["NODE_ENV"];
  const pw = processEnv["PLAYWRIGHT_TEST"] ?? rawEnv["PLAYWRIGHT_TEST"];
  return nodeEnv === "test" || pw === "1";
}
```

#### (C) `app/api/me/[...path]/route.ts`

**Before**（`route.ts:10-18,42-43,59`）:

```ts
import { getAuthEnv } from "../../../../src/lib/env";

const FALLBACK_INTERNAL_API = "http://127.0.0.1:8787";

const apiBase = (): string => {
  const v = getAuthEnv().INTERNAL_API_BASE_URL;
  if (v && v.length > 0) return v.replace(/\/$/, "");
  return FALLBACK_INTERNAL_API;
};
// ...
  const tail = path.join("/");
  const target = `${apiBase()}/me${tail ? `/${tail}` : ""}${url.search}`;
// ...
  const upstream = await fetch(target, init);
```

**After**:

```ts
import { getAuthEnv, getEnvironment, getTransportRuntimeIsTest } from "../../../../src/lib/env";
import { resolveApiFetch, SERVICE_BINDING_ORIGIN } from "../../../../src/lib/fetch/transport";
// ...
  const tail = path.join("/");
  const subpath = `/me${tail ? `/${tail}` : ""}${url.search}`; // 先頭 / 始まりのフルパス
  const env = getAuthEnv();
  const transport = resolveApiFetch({
    API_SERVICE: env.API_SERVICE,
    baseUrl: env.INTERNAL_API_BASE_URL
      ? env.INTERNAL_API_BASE_URL.replace(/\/$/, "")
      : undefined,
    environment: getEnvironment(),
    isTest: getTransportRuntimeIsTest(),
  });
  const upstream =
    transport.kind === "service-binding"
      ? await transport.fetch(`${SERVICE_BINDING_ORIGIN}${subpath}`, init)
      : await fetch(`${transport.baseUrl}${subpath}`, init);
```

> `FALLBACK_INTERNAL_API = "http://127.0.0.1:8787"` 定数は **削除**。local fallback は `resolveApiFetch` の (d) 分岐（`http://localhost:8787`）が担う。`url.search` を `subpath` に含めることで search params を保持（既存挙動と同じ）。requireSession（401）/ cookie・content-type forward / `x-ubm-dev-session` 転送は現状維持。

#### (D) `app/api/admin/[...path]/route.ts`

**Before**（`route.ts:14-26,71,100`）: `LOCAL_DEV_FALLBACK = "http://127.0.0.1:8787"` と `apiBase(): string | null`（`process.env` 直参照で staging/production 時 null 返却し 500）。

**After**: `getAdminFetchEnv()`（`API_SERVICE` / `INTERNAL_API_BASE_URL` を返す。env.ts:174-191）由来で `resolveApiFetch` を呼ぶ。

```ts
import { getAdminFetchEnv, getEnvironment, getTransportRuntimeIsTest } from "../../../../src/lib/env";
import { resolveApiFetch, SERVICE_BINDING_ORIGIN } from "../../../../src/lib/fetch/transport";
// ...
  const env = getAdminFetchEnv();
  let transport: ReturnType<typeof resolveApiFetch>;
  try {
    transport = resolveApiFetch({
      API_SERVICE: env.API_SERVICE,
      baseUrl: env.INTERNAL_API_BASE_URL
        ? env.INTERNAL_API_BASE_URL.replace(/\/$/, "")
        : undefined,
      environment: getEnvironment(),
      isTest: getTransportRuntimeIsTest(),
    });
  } catch {
    // 既存の fail-fast 500 を維持（staging/production で env も binding も無いケース）
    return new Response(
      JSON.stringify({
        ok: false,
        error: "internal_api_base_url_missing",
        message: "INTERNAL_API_BASE_URL is not configured for this environment",
      }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
  const subpath = `/admin/${path.join("/")}${url.search}`;
  // headers 組み立て（x-internal-auth / sync bearer 等）は現状維持
  const upstream =
    transport.kind === "service-binding"
      ? await transport.fetch(`${SERVICE_BINDING_ORIGIN}${subpath}`, init)
      : await fetch(`${transport.baseUrl}${subpath}`, init);
```

> admin route の既存「`LOCAL_DEV_FALLBACK` を local 限定で許可し、staging/production で 500」という fail-fast 意図（`route.ts:10-13` コメント）は、`resolveApiFetch` の (d)/(e) 分岐 + 上記 try/catch で**同等以上**に保たれる（binding があれば 200、無ければ local のみ fallback、非 local は throw→500）。`x-internal-auth` / `needsSyncAdminBearer` の Bearer 付与 / `SYNC_ADMIN_TOKEN` 欠落 500 / `requireAdmin`（403）は現状維持。

#### (E) `app/api/auth/magic-link/route.ts` / `verify/route.ts` / `gate-state/route.ts`

3 つとも `FALLBACK_INTERNAL_API = "http://127.0.0.1:8787"` + `resolveApiBase()` を持つ同型。

**Before**（例: `magic-link/route.ts:9-16,20,24`）:

```ts
const FALLBACK_INTERNAL_API = "http://127.0.0.1:8787";
const resolveApiBase = (): string => {
  const v = getAuthEnv().INTERNAL_API_BASE_URL;
  if (v && v.length > 0) return v.replace(/\/$/, "");
  return FALLBACK_INTERNAL_API;
};
// ...
  const upstream = `${resolveApiBase()}/auth/magic-link`;
  const res = await fetch(upstream, { method: "POST", headers, body });
```

**After**（共通パターン）:

```ts
import { getAuthEnv, getEnvironment, getTransportRuntimeIsTest } from "@/lib/env";
import { resolveApiFetch, SERVICE_BINDING_ORIGIN } from "@/lib/fetch/transport";

const selectTransport = () => {
  const env = getAuthEnv();
  return resolveApiFetch({
    API_SERVICE: env.API_SERVICE,
    baseUrl: env.INTERNAL_API_BASE_URL
      ? env.INTERNAL_API_BASE_URL.replace(/\/$/, "")
      : undefined,
    environment: getEnvironment(),
    isTest: getTransportRuntimeIsTest(),
  });
};
// ...
  const transport = selectTransport();
  const subpath = `/auth/magic-link`; // verify は `/auth/magic-link/verify`、gate-state は `/auth/gate-state?email=...`
  const res =
    transport.kind === "service-binding"
      ? await transport.fetch(`${SERVICE_BINDING_ORIGIN}${subpath}`, { method: "POST", headers, body })
      : await fetch(`${transport.baseUrl}${subpath}`, { method: "POST", headers, body });
```

> gate-state は `encodeURIComponent(email)` を含む query（`route.ts:20`）を `subpath` に保持。`cf-connecting-ip` 転送（3 route 共通）は現状維持。`selectTransport` は各 route ファイル内のローカル helper として置く（共通モジュール化は任意・Lane A スコープは「transport 選択を `resolveApiFetch` 経由にする」までで十分）。

#### (F) `src/lib/auth/verify-magic-link.ts`

**Before**（`verify-magic-link.ts:5-13,84-95`）: `FALLBACK_INTERNAL_API` + `resolveApiBase(override?)`。`input.fetchImpl` / `input.apiBaseUrl` で差替可能。

**After**: `apiBaseUrl` override がある時はそれを HTTP base として使い（テスト互換）、無い時は `resolveApiFetch` で transport を選ぶ。`fetchImpl` override は維持。

```ts
import { getAuthEnv, getEnvironment, getTransportRuntimeIsTest } from "../env";
import { resolveApiFetch, SERVICE_BINDING_ORIGIN } from "../fetch/transport";
// ...
export const verifyMagicLink = async (input: VerifyMagicLinkInput): Promise<VerifyMagicLinkResult> => {
  const fetchImpl = input.fetchImpl ?? fetch;
  // apiBaseUrl 明示時（既存テスト互換）は HTTP 直叩き。
  let url: string;
  let callFetch: typeof fetch = fetchImpl;
  if (input.apiBaseUrl && input.apiBaseUrl.length > 0) {
    url = `${input.apiBaseUrl.replace(/\/$/, "")}/auth/magic-link/verify`;
  } else {
    const env = getAuthEnv();
    const transport = resolveApiFetch({
      API_SERVICE: env.API_SERVICE,
      baseUrl: env.INTERNAL_API_BASE_URL
        ? env.INTERNAL_API_BASE_URL.replace(/\/$/, "")
        : undefined,
      environment: getEnvironment(),
      isTest: getTransportRuntimeIsTest(),
    });
    if (transport.kind === "service-binding") {
      url = `${SERVICE_BINDING_ORIGIN}/auth/magic-link/verify`;
      // fetchImpl override が無い場合のみ binding.fetch を使う
      if (!input.fetchImpl) callFetch = transport.fetch;
    } else {
      url = `${transport.baseUrl}/auth/magic-link/verify`;
    }
  }
  // 以降の try/catch（temporary_failure fail-closed）・JSON parse・shape 検証は現状維持。
  // res = await callFetch(url, {...}) に置換。
};
```

> `temporary_failure` への fail-closed 変換（通信失敗・想定外 shape）、`isValidUser` / `KNOWN_REASONS` / `mapVerifyReasonToLoginError` は完全に現状維持。`apiBaseUrl` override の優先は既存 spec（`route.route.spec.ts`）互換のため保持。

---

## 4. テスト方針

> **SIGKILL リスク回避**: vitest は必ず**対象ファイルを明示指定**で実行する（`apps/web` 全件実行は重く OOM/SIGKILL の恐れ）。

### 4-1. 新規 `transport.spec.ts`（5 分岐網羅）

`apps/web/src/lib/fetch/transport.spec.ts`。純関数なので mock 不要。

| ケース | 入力 | 期待 |
|--------|------|------|
| TC-A1 | `{ isTest: true, baseUrl: "https://mock.test", API_SERVICE: {fetch} }` | `{ kind: "http", baseUrl: "https://mock.test" }`（(a) test+baseUrl は binding より優先） |
| TC-A2 | `{ API_SERVICE: {fetch}, environment: "staging" }` | `{ kind: "service-binding", fetch }`（(b) binding 優先） |
| TC-A3 | `{ baseUrl: "http://localhost:8787", environment: "local" }`（binding 無・非 test） | `{ kind: "http", baseUrl: "http://localhost:8787" }`（(c)） |
| TC-A4 | `{ environment: "local" }`（全無） | `{ kind: "http", baseUrl: "http://localhost:8787" }`（(d) local fallback） |
| TC-A5 | `{ environment: "staging" }`（全無・非 local） | **throw**（(e) fail-closed）。`expect(() => resolveApiFetch(...)).toThrow(/unresolved/)` |

> 追加で「`isTest` だが `baseUrl` 無 + `API_SERVICE` あり → binding」（(a) は baseUrl 必須なので skip して (b)）の境界も 1 ケース足すと堅い。

### 4-2. `authed.spec.ts`（編集）

既存 `vi.mock("@/lib/env", () => ({ getApiBaseEnv: ... }))`（spec:17-19）を `getAuthEnv` / `getEnvironment` / `getTransportRuntimeIsTest` の mock へ更新。既存 13 ケース（path 検証 / cookie 転送 / 200 / 401 / 403 / 500 / network-fail / 末尾 / 除去 / headers マージ / source grep）は意味を保ったまま移行。

追加ケース:

| ケース | 内容 |
|--------|------|
| TC-B1 | `getAuthEnv` が `API_SERVICE` を返す（staging 相当）→ `binding.fetch` が `https://service-binding.local/me` で呼ばれ、global `fetch` は呼ばれない |
| TC-B2 | binding 経由でも 401 → `AuthRequiredError`、非 2xx → `FetchAuthedError`（binding.fetch の返す Response で検証） |
| TC-B3 | search 保持: `fetchAuthed("/me/x?cursor=abc")` → 呼ばれた URL に `?cursor=abc` が含まれる（binding / http 両方） |
| TC-B4 | source grep（既存 spec:159-166 を維持）: `authed.ts` に `process.env[` と `127.0.0.1` が無い。**`transport.ts` にも同 grep を追加**（local fallback は `localhost:8787` で `127.0.0.1` 不使用に統一） |

> 既存 spec:120-148（`INTERNAL` 末尾 / 除去 / `PUBLIC` fallback / 双方未指定 fail-fast）は `getAuthEnv` ベースに読み替える。`PUBLIC_API_BASE_URL` fallback は authed では使わなくなる（INTERNAL only + binding）ため、該当ケースは「binding 無 + INTERNAL 無 + 非 local → throw」へ置換する。

### 4-3. 新規 `me route.route.spec.ts`

`apps/web/app/api/me/[...path]/route.route.spec.ts`（`*.route.spec.ts` 接尾辞は既存 auth route spec に倣う。不変条件 #8 の `*.spec.ts` を満たす）。

`getAuth`（session）と `getAuthEnv` / `getEnvironment` / `getTransportRuntimeIsTest` を mock。

| ケース | 内容 |
|--------|------|
| TC-C1 | 未認証（`memberId` 無）→ 401 `{code:"UNAUTHENTICATED"}`（`requireSession` 維持の確認） |
| TC-C2 | 認証済 + `API_SERVICE` あり → `binding.fetch` が `https://service-binding.local/me/...` で呼ばれ global `fetch` 不使用（loopback 回避の核） |
| TC-C3 | search 保持: `GET /api/me/foo?a=1` → upstream subpath に `/me/foo?a=1` |
| TC-C4 | cookie / content-type forward: req の `cookie` が transport の init.headers に乗る |
| TC-C5 | 非 test + binding 無 + 非 local（staging で env 欠落）→ `resolveApiFetch` throw が proxy で表面化（500 か throw のいずれか・実装した挙動に合わせて assert） |

### 4-4. 既存 contract spec への影響

- `app/api/auth/magic-link/route.route.spec.ts:50-58`（`falls back to local API ... 127.0.0.1:8787`）: **transport の local fallback が `localhost:8787` に変わる**ため、この期待値を更新（`http://localhost:8787/auth/magic-link`）。または env mock で `environment:"local"` を明示し新 fallback URL を assert。
- `verify/route.route.spec.ts` / `magic-link/route.route.spec.ts` の binding 不在・INTERNAL 明示ケースは (b)→(c) 経路で従来 URL のまま通る（`vi.stubEnv("INTERNAL_API_BASE_URL", ...)` 維持・`isTest` true 経路 (a) でも HTTP）。テスト実行時は `NODE_ENV==="test"` のため (a) で HTTP に落ちる→既存期待 URL を保てる。**実装者は既存 3 route spec を実行し、127.0.0.1 期待のみ localhost へ更新**すること。
- `verify-magic-link` を呼ぶ callback spec（`callback/email/route.route.spec.ts`）: `apiBaseUrl` / `fetchImpl` override 経路を維持したため影響なし（要再実行確認）。

### 4-5. vitest 対象ファイル指定（実行コマンド）

```bash
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  src/lib/fetch/transport.spec.ts \
  src/lib/fetch/authed.spec.ts \
  src/lib/fetch/public.spec.ts \
  app/api/me/'[...path]'/route.route.spec.ts \
  app/api/auth/magic-link/route.route.spec.ts \
  app/api/auth/magic-link/verify/route.route.spec.ts \
  app/api/auth/callback/email/route.route.spec.ts
```

> filter 名は `apps/web/package.json` の `name` を確認して合わせる（`@ubm-hyogo/web` 想定）。glob 展開を避けるため `[...path]` はクォートする。

---

## 5. ローカル実行 / 検証コマンド

```bash
# 1. 型チェック（全 workspace）
mise exec -- pnpm typecheck

# 2. lint（必要なら --fix）
mise exec -- pnpm lint

# 3. 対象 vitest（§4-5 の明示指定。全件実行は避ける）
mise exec -- pnpm --filter @ubm-hyogo/web exec vitest run \
  src/lib/fetch/transport.spec.ts src/lib/fetch/authed.spec.ts \
  src/lib/fetch/public.spec.ts \
  app/api/me/'[...path]'/route.route.spec.ts \
  app/api/auth/magic-link/route.route.spec.ts \
  app/api/auth/magic-link/verify/route.route.spec.ts

# 4. PR pre-flight（docs-only gate / phase12 compliance / indexes drift）
bash scripts/verify-pr-ready.sh
```

> staging runtime smoke（`/me` 200 / `/profile` 認証カード非表示）は Lane C の `scripts/smoke-staging-me.sh` で実施し、**user-gated**（CONST_007 例外・実 deploy/secret 必要）。本 Lane A の DoD には含めない。

---

## 6. DoD（Definition of Done）

| ID | 条件 | 検証手段 |
|----|------|---------|
| AC-1 | staging / production で `fetchAuthed` が `API_SERVICE` binding 経由で API を叩き、`/me` が 200 を返す（loopback 404 解消） | unit（TC-B1 binding 優先選択）+ staging smoke（Lane C・user-gated） |
| AC-2 | 全 server-side proxy / auth route（me / admin / magic-link / verify / gate-state / verify-magic-link）が binding 優先で transport を選ぶ（plain 外向き `fetch` を staging/production で行わない） | unit（TC-C2 + 各 route spec）+ source grep（`FALLBACK_INTERNAL_API` / `LOCAL_DEV_FALLBACK` 定数の消滅） |
| AC-3 | `localhost` / `127.0.0.1` への到達は `environment === "local"` のみ。staging / production で base URL も binding も無い場合は throw（fail-closed・silent localhost fallback 禁止） | unit（TC-A5 throw + TC-A4 local fallback）+ `transport.ts` source grep（`127.0.0.1` 不在・`localhost` は local 分岐のみ） |
| AC-4 | cookie / authorization / content-type / search params の forward が全 route で現状維持 | unit（TC-B3 / TC-C3 / TC-C4） |
| AC-5 | `process.env.*` 直接参照を新規に増やさない（env.ts アクセサ経由のみ） | source grep（変更 9 ファイルに `process.env[` 直参照なし。admin route の既存 `process.env` 直参照は除去） |
| AC-6 | typecheck / lint / 対象 vitest 全緑 + `verify-pr-ready.sh` 緑 | §5 のコマンド |

完了条件: AC-1〜AC-6 を満たし、§1 の 12 ファイルのみを変更（Lane B / C には触れない）。staging smoke（AC-1 の runtime 実証部分）は user-gated として最終レポートに明記し、実 deploy / commit / PR / secret 投入は user 承認後に実施する。

---

## 7. 補足・注意（後続実装者向け）

1. **production にも binding がある**: `wrangler.toml:71-73` は `[[env.production.services]] binding = "API_SERVICE"`。staging（`:43-45`）と同様、production でも (b) 経路で binding 優先になる。AC-1 / AC-3 は「staging / production 共通」で考える。
2. **`getAuthEnv` の戻り値型を壊さない**: `AuthEnv`（env.ts:57-59）は既に `API_SERVICE?` を持つ。test runtime 判定は別ヘルパ（`getTransportRuntimeIsTest`）で足し、`getAuthEnv` の shape は変えない。
3. **admin route の `process.env` 直参照除去**: 現状 `route.ts:22` が `process.env["NODE_ENV"]` / `process.env["ENVIRONMENT"]` を直接読む。これを `getEnvironment()` / `getTransportRuntimeIsTest()` 経由へ置換すること（AC-5）。
4. **`localhost:8787` に統一**: local fallback は `127.0.0.1:8787` ではなく `http://localhost:8787`（`public.ts:21` の `DEFAULT_BASE_URL` と一致）。`127.0.0.1` を `transport.ts` に焼かないことで Lane C の grep gate と整合し、authed.spec の既存 source grep（`127.0.0.1` 不在）も通る。
5. **service-binding の host は無視される**: `SERVICE_BINDING_ORIGIN = "https://service-binding.local"` は URL parse 用のダミー。実際のルーティングは binding が担う。cookie は header で明示転送するため cross-origin policy の影響を受けない。
6. **1 サイクル 1 PR（CONST_007）**: Lane A 単独で typecheck / lint / 対象 vitest が緑になるよう自己完結させる（Lane B / C の grep gate / smoke script に依存しない）。
