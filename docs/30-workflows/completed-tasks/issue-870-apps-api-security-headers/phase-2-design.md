# Phase 2: 設計 — issue-870-apps-api-security-headers
> 実装区分: 実装仕様書 / NON_VISUAL / implementation_mode: new / 状態: implemented_local_evidence_captured
> 前 Phase: [phase-1-requirements.md](./phase-1-requirements.md) / 次 Phase: [phase-3-design-review.md](./phase-3-design-review.md)

---

## 1. 全体トポロジー

```
apps/api/src/index.ts
  └─ const app = new Hono<{ Bindings: Env }>()   // 184行目
       ├─ app.use("*", securityHeaders())          // 挿入位置A（全レスポンス＋preflight にヘッダ付与）
       ├─ app.use("*", corsFromEnv())              // 挿入位置B（CORS allowlist / preflight 応答を確定）
       ├─ app.notFound(notFoundHandler)            // 186行目（既存・変更なし）
       ├─ app.onError(errorHandler)                // 187行目（既存・変更なし）
       └─ ... routes ...

apps/api/src/middleware/security-headers.ts        // 新規
  ├─ export const SECURITY_HEADERS                 // 静的ヘッダ定数
  ├─ export const DEFAULT_HSTS_MAX_AGE             // HSTS max-age 定数
  ├─ export const DEFAULT_NO_STORE_PREFIXES        // Cache-Control 補完対象プレフィックス
  ├─ export interface SecurityHeadersOptions       // middleware オプション型
  ├─ export const securityHeaders()               // 静的ヘッダ middleware
  ├─ export const parseAllowedOrigins()           // ALLOWED_ORIGINS パース helper
  └─ export const corsFromEnv()                   // CORS middleware（env 参照）

apps/api/src/middleware/__tests__/security-headers.spec.ts  // 新規（TC-01〜TC-10）
```

---

## 2. 公開 API（固定シグネチャ）

### 2-1. ヘッダ定数

```ts
/** 全レスポンスに常時付与する静的ヘッダ（不変）。 */
export const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
} as const;

/** HSTS の max-age デフォルト値（秒）。1 年 = 31,536,000 秒。 */
export const DEFAULT_HSTS_MAX_AGE = 31_536_000;

/**
 * Cache-Control: no-store を補完するプレフィックス一覧。
 * pathname がいずれかと完全一致するか、"<prefix>/" で始まる場合のみ適用。
 */
export const DEFAULT_NO_STORE_PREFIXES = [
  "/me",
  "/auth",
  "/admin",
  "/internal",
] as const;
```

### 2-2. オプション型

```ts
export interface SecurityHeadersOptions {
  /**
   * Strict-Transport-Security の max-age（秒）。
   * デフォルト: DEFAULT_HSTS_MAX_AGE (31,536,000)
   */
  hstsMaxAge?: number;
  /**
   * Cache-Control: no-store を補完するパスプレフィックス一覧。
   * デフォルト: DEFAULT_NO_STORE_PREFIXES
   */
  noStorePrefixes?: readonly string[];
}
```

### 2-3. securityHeaders

```ts
import type { MiddlewareHandler } from "hono";
import type { Env } from "../env";

/**
 * 全レスポンスにセキュリティヘッダを付与する middleware。
 *
 * 常時付与:
 *   - X-Content-Type-Options: nosniff
 *   - Referrer-Policy: no-referrer
 *   - Strict-Transport-Security: max-age=<hstsMaxAge>; includeSubDomains
 *
 * 条件付き補完（既存 Cache-Control が存在しない場合のみ）:
 *   - pathname が noStorePrefixes のいずれかと完全一致、
 *     または "<prefix>/" で始まる場合 → Cache-Control: no-store
 *
 * 実装ポイント:
 *   - await next() を呼んだ後（レスポンス確定後）に c.res.headers.set を実行する。
 *   - Cache-Control は c.res.headers.get("Cache-Control") が null/空 の場合のみ補完する。
 *   - 既存値がある場合は一切上書きしない。
 */
export const securityHeaders = (
  options?: SecurityHeadersOptions,
): MiddlewareHandler<{ Bindings: Env }>;
```

### 2-4. parseAllowedOrigins

```ts
/**
 * ALLOWED_ORIGINS 環境変数（カンマ区切り文字列）を
 * trim + 空要素除去した文字列配列に変換する純粋関数。
 *
 * @param raw - env.ALLOWED_ORIGINS の生値（undefined 可）
 * @returns 有効なオリジン文字列の配列。undefined または空文字列 → []
 *
 * @example
 * parseAllowedOrigins("https://example.com, https://staging.example.com")
 * // => ["https://example.com", "https://staging.example.com"]
 *
 * parseAllowedOrigins(undefined) // => []
 * parseAllowedOrigins("")        // => []
 * parseAllowedOrigins(" , ")     // => []
 */
export const parseAllowedOrigins = (raw?: string): string[];
```

### 2-5. corsFromEnv

```ts
/**
 * env.ALLOWED_ORIGINS を allowlist とする CORS middleware。
 * deny-by-default: allowlist に含まれないオリジンには CORS allow headers を付与しない。
 *
 * 実装は `hono/cors` を使わず、小さな手書き middleware にする。
 * 理由:
 * - denied preflight で `Access-Control-Allow-Methods` / `Access-Control-Allow-Headers`
 *   だけが出る状態を避ける
 * - allowed headers を固定 allowlist にし、request header echo をしない
 * - preflight にも `securityHeaders()` の静的ヘッダを付与する
 */
export const corsFromEnv = (): MiddlewareHandler<{ Bindings: Env }>;
```

---

## 3. 内部関数 → 公開 export 変換表

| 内部ロジック | 公開 export | 理由 |
|---|---|---|
| `setStaticHeaders(c, maxAge)` | `securityHeaders()` の内部 helper（非 export） | 外部から呼び出す必要がないため |
| `shouldAddNoStore(pathname, prefixes)` | `securityHeaders()` の内部 helper（非 export） | テストは middleware 経由で間接検証 |
| カンマ分割ロジック | `parseAllowedOrigins()` として公開 export | 単体テスト・reuse のため公開 |
| 手書き CORS middleware | `corsFromEnv()` として公開 export | deny-by-default / 固定 allow headers / credentials true を最小実装で保証 |

---

## 4. ファイル実装仕様

### 4-1. security-headers.ts 全体構成

```ts
// apps/api/src/middleware/security-headers.ts
import type { MiddlewareHandler } from "hono";
import type { Env } from "../env";

// ── 定数 ──────────────────────────────────────────────
export const SECURITY_HEADERS = { ... } as const;
export const DEFAULT_HSTS_MAX_AGE = 31_536_000;
export const DEFAULT_NO_STORE_PREFIXES = [...] as const;
export const DEFAULT_CORS_ALLOW_METHODS = [...] as const;
export const DEFAULT_CORS_ALLOW_HEADERS = [...] as const;

// ── 型 ────────────────────────────────────────────────
export interface SecurityHeadersOptions { ... }

// ── securityHeaders ───────────────────────────────────
export const securityHeaders = (options?: SecurityHeadersOptions): MiddlewareHandler<{ Bindings: Env }> => {
  const maxAge = options?.hstsMaxAge ?? DEFAULT_HSTS_MAX_AGE;
  const noStorePrefixes = options?.noStorePrefixes ?? DEFAULT_NO_STORE_PREFIXES;

  return async (c, next) => {
    await next();

    // 常時付与: 静的ヘッダ
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
      c.res.headers.set(key, value);
    }
    // 常時付与: HSTS
    c.res.headers.set(
      "Strict-Transport-Security",
      `max-age=${maxAge}; includeSubDomains`,
    );

    // 条件付き補完: Cache-Control no-store
    const pathname = new URL(c.req.url).pathname;
    const needsNoStore = noStorePrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
    if (needsNoStore && !c.res.headers.get("Cache-Control")) {
      c.res.headers.set("Cache-Control", "no-store");
    }
  };
};

// ── parseAllowedOrigins ───────────────────────────────
export const parseAllowedOrigins = (raw?: string): string[] => {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

// ── corsFromEnv ───────────────────────────────────────
export const corsFromEnv = (): MiddlewareHandler<{ Bindings: Env }> => {
  return async (c, next) => {
    const origin = c.req.header("Origin");
    const isAllowed =
      origin !== undefined &&
      parseAllowedOrigins(c.env.ALLOWED_ORIGINS).includes(origin);

    if (c.req.method === "OPTIONS") {
      if (!isAllowed) return new Response(null, { status: 204 });
      const headers = new Headers();
      headers.set("Access-Control-Allow-Origin", origin);
      headers.set("Access-Control-Allow-Credentials", "true");
      headers.set("Access-Control-Allow-Methods", DEFAULT_CORS_ALLOW_METHODS.join(","));
      headers.set("Access-Control-Allow-Headers", DEFAULT_CORS_ALLOW_HEADERS.join(","));
      headers.set("Vary", "Access-Control-Request-Headers, Origin");
      return new Response(null, { headers, status: 204 });
    }

    await next();
    if (isAllowed) {
      c.res.headers.set("Access-Control-Allow-Origin", origin);
      c.res.headers.set("Access-Control-Allow-Credentials", "true");
      c.res.headers.set("Vary", "Origin");
    }
  };
};
```

> **注記**: 実装では `hono/cors` の callback 型推論に依存しない。
> middleware 本体で `c.env.ALLOWED_ORIGINS` を読むため、`Env` の型は Hono app の
> `Bindings` ジェネリクスからそのまま伝搬する。

### 4-2. index.ts 修正仕様

```ts
// 追加する import（既存 import 群の末尾に追加）
import { securityHeaders, corsFromEnv } from "./middleware/security-headers";

// 184行目 const app = new Hono<{ Bindings: Env }>(); の直後に挿入
app.use("*", securityHeaders());
app.use("*", corsFromEnv());   // CORS allowlist（preflight 含む）
// ↑ この 2 行の後に既存の app.notFound / app.onError が続く
```

### 4-3. env.ts 修正仕様

```ts
// Env interface の末尾に追加
// wrangler.toml [env.*.vars] ALLOWED_ORIGINS
// CORS allowlist: カンマ区切りオリジン文字列（例: "https://web.example.com"）
// 未設定時は deny-by-default（全オリジン拒否）
readonly ALLOWED_ORIGINS?: string;
```

### 4-4. wrangler.toml 修正仕様

```toml
# [env.staging.vars] セクションに追加
[env.staging.vars]
ALLOWED_ORIGINS = "<staging web origin>"  # 実装サイクルで既存 web origin 設定に合わせる

# [env.production.vars] セクションに追加
[env.production.vars]
ALLOWED_ORIGINS = "<production web origin>"  # 実装サイクルで既存 web origin 設定に合わせる
```

> **wrangler.toml 制約**: トップレベル `[vars]` は named env（staging / production）に継承されない仕様のため、
> 各 `[env.*.vars]` に個別定義する。

---

## 5. CORS allowlist 読み込み元

| 環境 | 読み込み元 | 値の管理 |
|---|---|---|
| staging | `wrangler.toml` の `[env.staging.vars]` | 非機密・公開 web origin のみ |
| production | `wrangler.toml` の `[env.production.vars]` | 非機密・公開 web origin のみ |
| local dev | `.dev.vars`（`ALLOWED_ORIGINS=http://localhost:3000`） | ローカル限定 |

機密情報ではないため `wrangler secret put` は不要。`[vars]` に平文で記述する。

---

## 6. 既存 Cache-Control 非上書き戦略

```
middleware 実行順序:
  1. corsFromEnv()    — CORS ヘッダのみ付与。Cache-Control 不関与。
  2. securityHeaders() — await next() でルートハンドラを先に実行させる。
       ↓
  3. ルートハンドラ実行（例: form-preview.ts が "public, max-age=60" を set）
       ↓
  4. await next() 復帰後、c.res.headers.get("Cache-Control") を確認:
       - 既存値あり → setせずスキップ
       - 既存値なし かつ noStorePrefix に合致 → "no-store" を補完
```

この戦略により、既存の `"public, max-age=60"` や `"no-store"` は一切上書きされない。

---

## 7. ライブラリ選定

| ライブラリ | 採用理由 | バージョン |
|---|---|---|
| Hono middleware | monorepo で既に `hono@4.12.18` を利用。追加依存不要。 | 4.12.18（固定済み） |

### 手書き CORS middleware semantics 実測確認（必須チェック）

実装サイクルで以下を確認すること:

1. `origin` callback が `null` を返した場合、`Access-Control-Allow-Origin` ヘッダが付与されないことを Vitest で検証する（TC-06）。
2. `origin` callback が origin 文字列を返した場合、`Access-Control-Allow-Origin: <origin>` が付与されることを Vitest で検証する（TC-07）。
3. allowed preflight では固定 allow headers と credentials true を返し、denied preflight では CORS allow headers を返さないことをテストする。

---

## 8. 適用位置の設計根拠

```
app.use("*", securityHeaders()); // securityHeaders を最初に適用する理由:
                                 //   await next() の復帰後にヘッダを書き込むため、
                                 //   後続の corsFromEnv が短絡返却する preflight 応答にも
                                 //   nosniff / HSTS / Referrer-Policy が必ず付与される。
app.use("*", corsFromEnv());     // CORS を次に適用する理由:
                                 //   OPTIONS preflight は corsFromEnv が直接 Response を返し
                                 //   route handler に到達させない。allowed origin の応答
                                 //   ヘッダは securityHeaders 側で上書きされない。
```

> 注: 上記順序は実装 (`apps/api/src/index.ts`) と
> `apps/api/src/middleware/__tests__/security-headers.spec.ts` の `buildApp()` と
> 完全に一致する。preflight に静的セキュリティヘッダが付くことを
> `corsFromEnv` allowed/denied preflight テストで検証している。

---

## 9. 非機能要件

| 項目 | 要件 |
|---|---|
| 状態保持 | middleware は状態を持たない（ファクトリ関数が毎 request 新しい closure を生成しない設計） |
| レスポンス境界 | `c.res.headers` のみを操作する。リクエスト body / D1 / R2 には触れない |
| エラー伝搬 | middleware 自体が throw しない。await next() の例外はそのまま上位に伝搬 |
| パフォーマンス | ヘッダ操作は O(1)。CORS allowlist の includes は配列長が小さいため問題なし |

---

## 10. CONST_005 必須項目チェック

| 必須項目 | 参照先 |
|---|---|
| 変更対象ファイル一覧 | Phase 1 §6 + 本 Phase §4 |
| 関数シグネチャ | 本 Phase §2（2-3〜2-5） |
| 入出力 | 本 Phase §2（JSDoc @param / @returns） |
| テスト方針 | Phase 1 §8 / Phase 4（別途） |
| 実行コマンド | Phase 1 §9 / Phase 5（別途） |
| DoD | Phase 1 §10 / Phase 10（別途） |
