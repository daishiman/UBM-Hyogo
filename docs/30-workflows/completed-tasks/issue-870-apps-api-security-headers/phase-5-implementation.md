# Phase 5: 実装手順 — issue-870-apps-api-security-headers

> 実装区分: 実装仕様書 / NON_VISUAL / implementation_mode: new / 状態: implemented_local_evidence_captured
> 前 Phase: [phase-4-test-plan.md](./phase-4-test-plan.md) / 次 Phase: [phase-6-test-additions.md](./phase-6-test-additions.md)

---

## 目的

Phase 4 で RED になったテストを GREEN にするための実装手順を定義する。
コード実装は本 Phase の作業者が行う（仕様書 Phase では本ファイルに実装方針・擬似コード・差分を記載するのみ）。

---

## 変更対象ファイル一覧

| パス | 種別 | 概要 |
|---|---|---|
| `apps/api/src/middleware/security-headers.ts` | **新規作成** | セキュリティヘッダミドルウェア本体 |
| `apps/api/src/middleware/__tests__/security-headers.spec.ts` | **新規作成** | Phase 4 で定義したテストファイル |
| `apps/api/src/index.ts` | **修正** | 184 行目 `const app = new Hono<...>()` 直後に 2 行挿入 |
| `apps/api/src/env.ts` | **修正** | `Env` interface に `readonly ALLOWED_ORIGINS?: string;` を追加 |
| `apps/api/wrangler.toml` | **修正** | `[env.staging.vars]` / `[env.production.vars]` に `ALLOWED_ORIGINS` を追加 |

---

## CONST_005 必須項目（入出力・副作用・エラーハンドリング）

### `securityHeaders(options?)`

| 項目 | 詳細 |
|---|---|
| **入力** | `options.hstsMaxAge?: number`（デフォルト `31_536_000`）、`options.noStorePrefixes?: readonly string[]`（デフォルト `DEFAULT_NO_STORE_PREFIXES`） |
| **出力** | Hono `MiddlewareHandler`。`next()` 呼出し後に以下ヘッダを `c.res.headers.set()` で付与 |
| **副作用** | レスポンスヘッダの変更のみ。D1 / KV / R2 等の binding には一切触れない |
| **エラーハンドリング** | `await next()` が throw した場合はそのまま上位に伝播（catch しない）。ヘッダ付与失敗は通常発生しないが、発生した場合も同様に上位に伝播 |

### `parseAllowedOrigins(raw?)`

| 項目 | 詳細 |
|---|---|
| **入力** | `raw?: string`（カンマ区切り origin リスト、または `undefined`） |
| **出力** | `string[]`。`undefined` / 空文字 → `[]` |
| **副作用** | なし（純粋関数） |
| **エラーハンドリング** | throw しない。不正な origin 文字列もそのまま配列要素として返す（validation は CORS ランタイムに委ねる） |

### `corsFromEnv()`

| 項目 | 詳細 |
|---|---|
| **入力** | なし（`c.env.ALLOWED_ORIGINS` をリクエスト時に動的参照） |
| **出力** | Hono `MiddlewareHandler`。deny-by-default の手書き CORS middleware |
| **副作用** | レスポンスヘッダの変更のみ |
| **エラーハンドリング** | `c.env` が `undefined` の場合（テスト外 edge）は `parseAllowedOrigins(undefined)` → `[]` で deny-by-default になる |

---

## `security-headers.ts` 実装方針（完全実装コード）

```ts
// apps/api/src/middleware/security-headers.ts
import type { MiddlewareHandler } from "hono";
import type { Env } from "../env";

// ---- 定数 ----------------------------------------------------------------

/** 常時付与するセキュリティヘッダ（値固定） */
export const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
} as const;

/** HSTS デフォルト max-age（1 年 = 31,536,000 秒） */
export const DEFAULT_HSTS_MAX_AGE = 31_536_000;

/**
 * Cache-Control を no-store に補完する pathname prefix 一覧。
 * pathname が prefix と完全一致 or `<prefix>/` で始まる場合のみ補完する。
 */
export const DEFAULT_NO_STORE_PREFIXES = [
  "/me",
  "/auth",
  "/admin",
  "/internal",
] as const;

// ---- 型定義 ---------------------------------------------------------------

export interface SecurityHeadersOptions {
  /** HSTS max-age（秒）。デフォルト: DEFAULT_HSTS_MAX_AGE */
  hstsMaxAge?: number;
  /** no-store を補完する pathname prefix。デフォルト: DEFAULT_NO_STORE_PREFIXES */
  noStorePrefixes?: readonly string[];
}

// ---- ユーティリティ -------------------------------------------------------

/**
 * カンマ区切りの ALLOWED_ORIGINS 文字列を origin 配列にパースする。
 * - trim・空除去を行う
 * - undefined → []
 */
export const parseAllowedOrigins = (raw?: string): string[] => {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
};

// ---- ミドルウェア ---------------------------------------------------------

/**
 * セキュリティヘッダを付与する Hono ミドルウェア。
 *
 * 動作:
 * 1. `await next()` を呼び出してハンドラを実行する
 * 2. ハンドラ実行後に `c.res.headers.set()` で以下を付与:
 *    - X-Content-Type-Options: nosniff（常時）
 *    - Referrer-Policy: no-referrer（常時）
 *    - Strict-Transport-Security: max-age=<hstsMaxAge>; includeSubDomains（常時）
 *    - Cache-Control: no-store（pathname が noStorePrefixes に該当 かつ 既存 CC が無い場合のみ）
 *
 * 重要: `c.res.headers.set()` は `await next()` 後に呼ぶこと。
 * next() 前に set しても、ハンドラが c.header() で同名ヘッダを上書きできてしまう。
 * next() 後に set することで「ハンドラが設定した値を middleware が読める」状態になり、
 * 既存 Cache-Control の有無チェックが正確に行える。
 */
export const securityHeaders = (
  options?: SecurityHeadersOptions
): MiddlewareHandler<{ Bindings: Env }> => {
  const hstsMaxAge = options?.hstsMaxAge ?? DEFAULT_HSTS_MAX_AGE;
  const noStorePrefixes = options?.noStorePrefixes ?? DEFAULT_NO_STORE_PREFIXES;

  return async (c, next) => {
    // 1. ハンドラを先に実行する（ハンドラが Cache-Control を設定する場合があるため）
    await next();

    // 2. 常時付与ヘッダ
    c.res.headers.set("X-Content-Type-Options", SECURITY_HEADERS["X-Content-Type-Options"]);
    c.res.headers.set("Referrer-Policy", SECURITY_HEADERS["Referrer-Policy"]);
    c.res.headers.set(
      "Strict-Transport-Security",
      `max-age=${hstsMaxAge}; includeSubDomains`
    );

    // 3. Cache-Control no-store 補完（条件付き）
    const pathname = new URL(c.req.url).pathname;
    const isProtectedPath = noStorePrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );
    const existingCacheControl = c.res.headers.get("Cache-Control");

    if (isProtectedPath && !existingCacheControl) {
      c.res.headers.set("Cache-Control", "no-store");
    }
    // 既存 Cache-Control がある場合は上書き禁止（TC-05 のガード）
  };
};

/**
 * `c.env.ALLOWED_ORIGINS` から動的に CORS 設定を構築する Hono ミドルウェア。
 *
 * 重要:
 * - per-request に `c.env.ALLOWED_ORIGINS` を読む
 * - deny-by-default: ALLOWED_ORIGINS が未定義または空の場合、CORS allow headers を返さない
 * - credentials true のため `Access-Control-Allow-Origin: *` は使用不可
 * - request の Access-Control-Request-Headers は echo せず、固定 allowlist のみ返す
 */
export const corsFromEnv = (): MiddlewareHandler<{ Bindings: Env }> => {
  return async (c, next) => {
    // 実装は apps/api/src/middleware/security-headers.ts を正とする。
    // allowed origin の通常レスポンスには ACAO + credentials、
    // allowed preflight には ACAO + credentials + fixed methods/headers を返す。
    await next();
  };
};
```

---

## `apps/api/src/index.ts` 差分

### 追加箇所

**184 行目の `const app = new Hono<{ Bindings: Env }>();` 直後**に以下 2 行を挿入する:

```ts
// 184 行目（変更なし）
const app = new Hono<{ Bindings: Env }>();

// ↓ 挿入（185〜186 行目）
app.use("*", securityHeaders());
app.use("*", corsFromEnv());

// 187 行目以降（変更なし）
app.notFound(notFoundHandler);
app.onError(errorHandler);
```

### 追加 import

ファイル冒頭の import 群に以下を追加する（既存 middleware import の近くに配置する）:

```ts
import { securityHeaders, corsFromEnv } from "./middleware/security-headers";
```

既存の `errorHandler`, `notFoundHandler` の import 行（60 行目付近）の近くに追記することを推奨:

```ts
// 変更前（60 行目付近）
import { errorHandler, notFoundHandler } from "./middleware/error-handler";

// 変更後
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { securityHeaders, corsFromEnv } from "./middleware/security-headers";
```

---

## `apps/api/src/env.ts` 差分

`Env` interface の末尾（112 行目の `readonly INTERNAL_ALERT_TOKEN?: string;` の後）に以下を追加:

```ts
  // Issue #870: CORS allowlist。カンマ区切り origin リスト。
  // 未設定時は全 Origin を拒否（deny-by-default）。
  // 例: "https://web.example,https://admin.example"
  readonly ALLOWED_ORIGINS?: string;
```

**差分イメージ**:

```ts
// 変更前（112 行目）
  readonly INTERNAL_ALERT_TOKEN?: string;
}

// 変更後（112〜116 行目）
  readonly INTERNAL_ALERT_TOKEN?: string;

  // Issue #870: CORS allowlist。カンマ区切り origin リスト。
  // 未設定時は全 Origin を拒否（deny-by-default）。
  readonly ALLOWED_ORIGINS?: string;
}
```

---

## `apps/api/wrangler.toml` 差分

`[env.staging.vars]` セクションと `[env.production.vars]` セクションのそれぞれに
`ALLOWED_ORIGINS` を追加する。

> **注意**: 実際の値（origin URL）は Cloudflare Dashboard または `wrangler.toml` の vars に記載する。
> secrets ではなく vars として管理することで `wrangler.toml` の `[vars]` / `[env.*.vars]` で設定可能。
> ただし、値は公開情報（フロントエンドの origin URL）のため secrets 扱い不要。

```toml
# [env.staging.vars] セクションに追加
[env.staging.vars]
# ... 既存 vars ...
ALLOWED_ORIGINS = "https://staging.web.example,https://staging.admin.example"

# [env.production.vars] セクションに追加
[env.production.vars]
# ... 既存 vars ...
ALLOWED_ORIGINS = "https://web.example,https://admin.example"
```

> **ローカル開発**: `.dev.vars`（または `.dev.vars.example`）に
> `ALLOWED_ORIGINS=http://localhost:3000` を追記する。
> `.dev.vars` は `.gitignore` で除外済みのため実値を記載して OK。

---

## ミドルウェア配線の設計根拠

### `securityHeaders()` → `corsFromEnv()` の順序

```
Request → [securityHeaders] → [corsFromEnv] → handler
Response ← [securityHeaders] ← [corsFromEnv] ← handler
```

- `securityHeaders()` を先に配置することで OPTIONS preflight にも静的セキュリティヘッダを付与できる
- `securityHeaders` は `await next()` 後にヘッダを付与するため、実行順序はレスポンス側で逆転:
  1. handler が `Cache-Control` を set（例: `public, max-age=60`）
  2. `corsFromEnv` の post-next が実行 → allowed origin に ACAO / credentials を付与
  3. `securityHeaders` の post-next が実行 → 既存 CC があれば上書きせず静的ヘッダを付与

### `c.res.headers.set()` を `await next()` 後に呼ぶ理由

- Hono のミドルウェアは `await next()` 前後で「before フック」「after フック」として動作する
- `await next()` 前に `set()` すると、ハンドラが `c.header()` で同名ヘッダを上書きできてしまう
- `await next()` 後に `set()` することで、ハンドラが設定した値を **読んでから** 条件判定できる
- `Cache-Control` の上書き禁止（TC-05）はこの実行順序に依存する

### `corsFromEnv()` が per-request に `c.env` を読む設計

```ts
origin: (origin, c) => {
  const allowed = parseAllowedOrigins(c.env?.ALLOWED_ORIGINS);
  return allowed.includes(origin) ? origin : null;
},
```

- `c.env` は各リクエストの Cloudflare Workers env binding を参照する
- `wrangler.toml` の `[vars]` / Cloudflare Secrets の値が動的に反映される
- allowlist をアプリ起動時に静的にキャッシュしない → デプロイなしでの allowlist 変更が可能
- deny-by-default: `c.env?.ALLOWED_ORIGINS` が `undefined` のとき `parseAllowedOrigins` が `[]` を返し、`includes(origin)` が `false` → `null` を返す

---

## 実行コマンド

```bash
# 型チェック
mise exec -- pnpm --filter @ubm-hyogo/api typecheck

# リント
mise exec -- pnpm --filter @ubm-hyogo/api lint

# unit テスト（GREEN 確認）
mise exec -- pnpm exec vitest run apps/api src/middleware/__tests__/security-headers.spec.ts

# 回帰テスト（D1 lane — public route の Cache-Control 不変確認）
mise exec -- pnpm exec vitest run --config vitest.d1.config.ts apps/api/src/routes/public/index.contract.spec.ts
```

---

## CLAUDE.md 不変条件チェック

| 条件 | 確認 |
|---|---|
| #5: D1 直接アクセスは apps/api に閉じる | `security-headers.ts` は D1 binding を使用しない |
| #8: テストは `*.spec.ts` のみ | `security-headers.spec.ts` → 準拠 |
| 既存 endpoint surface のみ | 新規 route 追加なし。middleware 追加のみ |
| `apps/web` から D1 binding 禁止 | 本変更は `apps/api` のみ |

---

## DoD（Definition of Done）— Phase 5 完了条件

実装サイクル（03.実装.md）で本 Phase を完遂したと判定する条件:

- [ ] `apps/api/src/middleware/security-headers.ts` が新規作成され、`securityHeaders` / `parseAllowedOrigins` / `corsFromEnv` と定数 3 種を export している
- [ ] `apps/api/src/index.ts` の `const app = new Hono...`（184 行目）直後に `app.use("*", securityHeaders())` → `app.use("*", corsFromEnv())` が挿入され、import が追加されている
- [ ] `apps/api/src/env.ts` の `Env` に `readonly ALLOWED_ORIGINS?: string;` が追加されている
- [ ] `apps/api/wrangler.toml` の `[env.staging.vars]` / `[env.production.vars]` に `ALLOWED_ORIGINS` が env 別の値で追加されている
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api typecheck` が成功する
- [ ] `mise exec -- pnpm --filter @ubm-hyogo/api lint` が成功する
- [ ] 既存 `apps/api/src/routes/public/index.contract.spec.ts`（D1 lane）が green を維持し、`form-preview` / `stats` の `Cache-Control: public, max-age=60` と public `/members` の `no-store` が**上書きされていない**

> テスト本体（TC-01〜TC-10）の GREEN 化は Phase 6、カバレッジ確認は Phase 7、総合 QA は Phase 9 で判定する。本 Phase の DoD はコード差分の投入と型/リント/回帰の健全性に限定する。
