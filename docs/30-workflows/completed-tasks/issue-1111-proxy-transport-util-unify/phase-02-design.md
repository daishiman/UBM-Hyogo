# Phase 02 — 設計

## 1. 既存コンポーネント再利用可否（FB-SDK-07-1）

新規 UI 実装ゼロ。既存の transport 選択ロジック（3 ファイル）の制御構造を抽出するのみ。新規 primitive・新規 endpoint は生やさない。`env.ts` 公開アクセサ・既存 fixture spec をそのまま再利用する。

## 2. util surface 設計（`apps/web/src/lib/fetch/transport-select.ts`・新規）

```ts
// apps/web/src/lib/fetch/transport-select.ts
// issue-1111: route.ts / server-fetch.ts / public.ts に複製された
// 「binding 優先 → HTTP fallback」transport 選択の制御構造を共通化する。
// 判定述語・fallback 戦略・ログ shape は呼び出し側固有として残す（pure refactor）。

export type TransportKind = "service-binding" | "http-fallback";

/** 末尾スラッシュ除去（route.ts apiBase / server-fetch resolveApiBase 共通の正規化） */
export function stripTrailingSlash(base: string): string {
  return base.replace(/\/$/, "");
}

/** binding を無効化するか否かを呼び出し側が計算して渡す（症状1/2 を吸収） */
export interface ResolveBindingInput {
  readonly binding: { fetch: typeof fetch } | undefined; // env.API_SERVICE
  readonly disableBinding: boolean; // isTestOrPlaywright && <baseVar 明示>
}
export function resolveServiceBinding(
  input: ResolveBindingInput,
): { fetch: typeof fetch } | undefined {
  return input.disableBinding ? undefined : input.binding;
}

const DEFAULT_BINDING_URL_PREFIX = "https://service-binding.local";

export interface SelectTransportConfig {
  /** resolveServiceBinding の戻り。undefined なら HTTP fallback へ */
  readonly binding: { fetch: typeof fetch } | undefined;
  /** 呼び出し側固有の fallback 戦略。null は base 不在を表す（route.ts のみ到達しうる） */
  readonly resolveBase: () => string | null;
  /** default "https://service-binding.local" */
  readonly bindingUrlPrefix?: string;
  /** opt-in。route.ts は渡さない（ログ無しを維持） */
  readonly log?: (kind: TransportKind, path: string, status: number) => void;
}

export type SelectTransportResult =
  | { readonly kind: TransportKind; readonly response: Response }
  | { readonly kind: "base-unavailable" };

/** binding があれば binding.fetch、無ければ resolveBase()+fetch。base が null なら base-unavailable を返す */
export async function selectAndFetch(
  cfg: SelectTransportConfig,
  path: string,
  init: RequestInit,
): Promise<SelectTransportResult> {
  const prefix = cfg.bindingUrlPrefix ?? DEFAULT_BINDING_URL_PREFIX;
  if (cfg.binding) {
    const response = await cfg.binding.fetch(`${prefix}${path}`, init);
    cfg.log?.("service-binding", path, response.status);
    return { kind: "service-binding", response };
  }
  const base = cfg.resolveBase();
  if (base === null) return { kind: "base-unavailable" };
  const response = await fetch(`${base}${path}`, init);
  cfg.log?.("http-fallback", path, response.status);
  return { kind: "http-fallback", response };
}
```

> **設計上の不変点**: `selectAndFetch` は request 構築・cache 制御・auth header・PLAYWRIGHT cache bypass・response 後処理（text 読み取り / AdminFetchError throw / 404 warn）には一切関与しない。これらは呼び出し側に残す。util は「どの transport で fetch するか」の分岐 + 任意ログのみ。

## 3. 呼び出し側差替設計（挙動不変マッピング）

### 3.1 `route.ts`（admin mutation・分岐 96-113）

```ts
import { resolveServiceBinding, selectAndFetch } from "../../../../src/lib/fetch/transport-select";

// 既存 isTestOrPlaywright / apiBase / LOCAL_DEV_FALLBACK は route.ts に保持
const binding = resolveServiceBinding({
  binding: env.API_SERVICE,
  disableBinding: isTestOrPlaywright(env) && Boolean(env.INTERNAL_API_BASE_URL),
});
const result = await selectAndFetch(
  { binding, resolveBase: () => apiBase(env) }, // log 無し（現状維持）
  upstreamPath,
  init,
);
if (result.kind === "base-unavailable") {
  return new Response(
    JSON.stringify({ ok: false, error: "internal_api_base_url_missing", message: "INTERNAL_API_BASE_URL is not configured for this environment" }),
    { status: 500, headers: { "content-type": "application/json" } },
  );
}
const upstream = result.response;
const text = await upstream.text();
return new Response(text, { status: upstream.status, headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" } });
```

旧 `adminServiceBinding(env)` ヘルパーは `resolveServiceBinding` 呼び出しへ置換（削除可）。`apiBase` / `isTestOrPlaywright` / `LOCAL_DEV_FALLBACK` は据え置き。

### 3.2 `server-fetch.ts`（admin read・分岐 554-562）

```ts
import { resolveServiceBinding, selectAndFetch } from "../fetch/transport-select";

const binding = resolveServiceBinding({
  binding: getAdminFetchEnv().API_SERVICE,
  disableBinding: isTestOrPlaywright() && Boolean(getAdminFetchEnv().INTERNAL_API_BASE_URL),
});
const result = await selectAndFetch(
  { binding, resolveBase: () => resolveApiBase(), log: logAdminTransport },
  path,
  init,
);
// resolveApiBase は常に string を返すため base-unavailable には到達しない
const res = result.kind === "base-unavailable"
  ? (() => { throw new AdminFetchError({ path, status: 500, responseBody: null }); })()
  : result.response;
// 以降の !res.ok / 404 warn / AdminFetchError throw は据え置き
```

旧 `getAdminServiceBinding()` は `resolveServiceBinding` へ置換。`logAdminTransport`（scope:admin）は log fn として注入。`resolveApiBase` / `isTestOrPlaywright` 据え置き。

> base-unavailable 非到達は型上の網羅性のための防御分岐。`resolveApiBase()` の戻り型は string のため実行時は常に response 経路。

### 3.3 `public.ts`（public read・分岐 66-77）

```ts
import { resolveServiceBinding, selectAndFetch } from "./transport-select";

// PLAYWRIGHT cache bypass（effectiveInit）は doFetch に残す
const binding = resolveServiceBinding({
  binding: getPublicFetchEnv().API_SERVICE,
  disableBinding: isTestOrPlaywright() && Boolean(getPublicFetchEnv().PUBLIC_API_BASE_URL),
});
const result = await selectAndFetch(
  { binding, resolveBase: () => getBaseUrl(), log: logTransport },
  path,
  effectiveInit,
);
return result.kind === "base-unavailable" ? /* 非到達 */ await fetch(`${getBaseUrl()}${path}`, effectiveInit) : result.response;
```

旧 `getServiceBinding()` は `resolveServiceBinding` へ置換。`logTransport`（scope 無し）を log fn として注入。`getBaseUrl` / `isTestOrPlaywright` / PLAYWRIGHT cache bypass 据え置き。

## 4. 状態所有権・責務境界

| 責務 | 所有者 |
| --- | --- |
| transport 選択（binding vs HTTP）+ 実行 + 任意ログ | `transport-select.ts`（共通） |
| test/playwright 判定述語（差異あり） | 各呼び出し側 |
| fallback base 戦略（差異あり） | 各呼び出し側 |
| ログ shape（scope 有無の差異） | 各呼び出し側（log fn を注入） |
| request 構築 / cache 制御 / auth header / response 後処理 | 各呼び出し側 |
| base-unavailable 時の応答（500 / throw / 非到達） | 各呼び出し側 |

## 5. validation path（SubAgent lane）

| lane | 対象 | 実行形態 |
| --- | --- | --- |
| 実装 lane | transport-select.ts 新規 + 3 呼び出し側切替 | 直列（依存あり: util → 呼び出し側） |
| 回帰 lane | route.spec / server-fetch.*.spec / public.spec | util 完成後に直列実行 |
| 静的 lane | typecheck / lint / 焼き込み grep | 最後に締める |

## 6. ライブラリ選定

外部ライブラリ追加なし。標準 `fetch` / `RequestInit` / `Response` のみ使用。
