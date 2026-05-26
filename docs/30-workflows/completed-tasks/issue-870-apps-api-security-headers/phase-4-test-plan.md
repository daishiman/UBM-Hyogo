# Phase 4: テスト作成（TDD RED フェーズ） — issue-870-apps-api-security-headers

> 実装区分: 実装仕様書 / NON_VISUAL / implementation_mode: new / 状態: implemented_local_evidence_captured
> 前 Phase: [phase-3（設計）](./outputs/) / 次 Phase: [phase-5-implementation.md](./phase-5-implementation.md)

---

## 目的

`apps/api/src/middleware/security-headers.ts` が存在しない状態でテストを先に書き、
**import エラーによって RED になることを明示的に確認する**（TDD RED フェーズ）。
テスト対象は純粋なロジック（ヘッダ付与・パース・CORS 判定）のみで、D1 binding は不要。
unit config（`vitest.config.ts`）で実行可能。

---

## 前提条件

- `apps/api/src/middleware/security-headers.ts` は **未作成**（Phase 5 で作成する）
- テストファイルを先に配置すると import エラーで vitest が fail → **RED 確認完了**
- Phase 5 実装後に同じテストが GREEN になることを確認する

---

## テスト外部入力の明確化

各 TC における外部入力は以下の 2 種類のみ:

| 入力種別 | 渡し方 | 説明 |
|---|---|---|
| `c.env.ALLOWED_ORIGINS` | `app.request(path, init, env)` の第 3 引数 `env` | Cloudflare Workers Bindings env。`{ ALLOWED_ORIGINS: "..." } as unknown as Env` で型キャスト |
| `Origin` リクエストヘッダ | `init.headers["Origin"]` | CORS 判定の入力 |

> **重要**: Hono test harness の `app.request(path, requestInit, env)` において、
> 第 3 引数 `env` は `Bindings`（= `Env` interface）に対応する。
> `c.env.ALLOWED_ORIGINS` はこの env から読み取られる。
> `env` 引数を省略すると `c.env` は `undefined` になるため、CORS テストでは必ず渡すこと。

---

## テスト harness 共通雛形

```ts
// apps/api/src/middleware/__tests__/security-headers.spec.ts
import { Hono } from "hono";
import { describe, it, expect } from "vitest";
import {
  securityHeaders,
  corsFromEnv,
  parseAllowedOrigins,
} from "../security-headers";
import type { Env } from "../../env";

/**
 * テスト用アプリを組み立てるファクトリ関数。
 * 実際の index.ts と同じ順序（securityHeaders → corsFromEnv）でミドルウェアを配置する。
 * securityHeaders を先に登録することで、corsFromEnv が短絡返却する preflight 応答にも
 * 静的セキュリティヘッダが付くことを保証する。
 */
const buildApp = () => {
  const app = new Hono<{ Bindings: Env }>();
  app.use("*", securityHeaders());
  app.use("*", corsFromEnv());
  // /me/profile: Cache-Control をハンドラ側で設定しない → middleware が no-store を補完
  app.get("/me/profile", (c) => c.json({ ok: true }));
  // /public/form-preview: ハンドラ側が public, max-age=60 を pre-set → middleware は上書き禁止
  app.get("/public/form-preview", (c) => {
    c.header("Cache-Control", "public, max-age=60");
    return c.json({ ok: true });
  });
  return app;
};

/**
 * CORS テスト用 env ヘルパー。
 * 第 3 引数 env として渡すことで c.env.ALLOWED_ORIGINS を注入する。
 */
const makeEnv = (allowedOrigins?: string): Env =>
  ({ ALLOWED_ORIGINS: allowedOrigins } as unknown as Env);
```

---

## テストケース一覧（TC-01〜TC-10）

### TC-01: 任意 GET レスポンスに `X-Content-Type-Options: nosniff`

```ts
describe("TC-01: X-Content-Type-Options ヘッダ", () => {
  it("任意の GET レスポンスに nosniff が付与されること", async () => {
    const res = await buildApp().request(
      "/me/profile",
      { method: "GET" },
      makeEnv()
    );
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });
});
```

**期待値**: `X-Content-Type-Options: nosniff`
**RED 前提**: `../security-headers` が存在しないため import エラーで fail

---

### TC-02: `Strict-Transport-Security` デフォルト値

```ts
describe("TC-02: Strict-Transport-Security ヘッダ", () => {
  it("max-age=31536000; includeSubDomains が付与されること", async () => {
    const res = await buildApp().request(
      "/me/profile",
      { method: "GET" },
      makeEnv()
    );
    expect(res.headers.get("Strict-Transport-Security")).toBe(
      "max-age=31536000; includeSubDomains"
    );
  });

  it("hstsMaxAge オプションで max-age をカスタマイズできること", async () => {
    const app = new Hono<{ Bindings: Env }>();
    app.use("*", securityHeaders({ hstsMaxAge: 86400 }));
    app.get("/", (c) => c.json({ ok: true }));
    const res = await app.request("/", { method: "GET" }, makeEnv());
    expect(res.headers.get("Strict-Transport-Security")).toBe(
      "max-age=86400; includeSubDomains"
    );
  });
});
```

**期待値**: `Strict-Transport-Security: max-age=31536000; includeSubDomains`（デフォルト）

---

### TC-03: `Referrer-Policy: no-referrer`

```ts
describe("TC-03: Referrer-Policy ヘッダ", () => {
  it("no-referrer が常時付与されること", async () => {
    const res = await buildApp().request(
      "/me/profile",
      { method: "GET" },
      makeEnv()
    );
    expect(res.headers.get("Referrer-Policy")).toBe("no-referrer");
  });
});
```

**期待値**: `Referrer-Policy: no-referrer`

---

### TC-04: `/me/profile` に `Cache-Control: no-store` 補完

```ts
describe("TC-04: Cache-Control no-store 補完（既存 CC 無し）", () => {
  it("/me/profile はハンドラが CC を設定しない → middleware が no-store を補完すること", async () => {
    const res = await buildApp().request(
      "/me/profile",
      { method: "GET" },
      makeEnv()
    );
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("/auth/session も no-store 補完されること", async () => {
    const app = new Hono<{ Bindings: Env }>();
    app.use("*", securityHeaders());
    app.get("/auth/session", (c) => c.json({ ok: true }));
    const res = await app.request("/auth/session", { method: "GET" }, makeEnv());
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });
});
```

**期待値**: `Cache-Control: no-store`（pathname が `/me` または `/auth` prefix で始まり、既存 CC が無い場合）

---

### TC-05: `/public/form-preview` — 既存 `Cache-Control` の上書き禁止

```ts
describe("TC-05: Cache-Control 上書き禁止（既存 CC 有り）", () => {
  it("ハンドラが 'public, max-age=60' を pre-set した場合、middleware は上書きしないこと", async () => {
    const res = await buildApp().request(
      "/public/form-preview",
      { method: "GET" },
      makeEnv()
    );
    // middleware が no-store で上書きしていないことを確認
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=60");
  });

  it("/public パスは noStorePrefixes に含まれないため CC 補完されないこと", async () => {
    const app = new Hono<{ Bindings: Env }>();
    app.use("*", securityHeaders());
    app.get("/public/members", (c) => c.json({ ok: true }));
    const res = await app.request("/public/members", { method: "GET" }, makeEnv());
    // no-store は付かない（既存 CC も無いが /public は対象 prefix 外）
    expect(res.headers.get("Cache-Control")).toBeNull();
  });
});
```

**期待値**: `Cache-Control: public, max-age=60`（上書きされないこと）

---

### TC-06: `parseAllowedOrigins` のパース挙動

```ts
describe("TC-06: parseAllowedOrigins", () => {
  it("カンマ区切り文字列を trim・空除去してパースすること", () => {
    expect(parseAllowedOrigins("a, b ,,c")).toEqual(["a", "b", "c"]);
  });

  it("undefined を渡すと空配列を返すこと", () => {
    expect(parseAllowedOrigins(undefined)).toEqual([]);
  });

  it("空文字列を渡すと空配列を返すこと", () => {
    expect(parseAllowedOrigins("")).toEqual([]);
  });

  it("単一 origin でも配列として返すこと", () => {
    expect(parseAllowedOrigins("https://web.example")).toEqual([
      "https://web.example",
    ]);
  });
});
```

**期待値**:
- `parseAllowedOrigins("a, b ,,c")` → `["a", "b", "c"]`
- `parseAllowedOrigins(undefined)` → `[]`

---

### TC-07: allowlist 内 Origin に ACAO を echo

```ts
describe("TC-07: corsFromEnv — allowlist 内 Origin に ACAO を付与", () => {
  it("ALLOWED_ORIGINS に含まれる Origin には ACAO が echo されること", async () => {
    const res = await buildApp().request(
      "/me/profile",
      {
        method: "GET",
        headers: { Origin: "https://web.example" },
      },
      makeEnv("https://web.example,https://admin.example")
    );
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
      "https://web.example"
    );
  });
});
```

**期待値**: `Access-Control-Allow-Origin: https://web.example`

---

### TC-08: allowlist 外 Origin には ACAO を付けない

```ts
describe("TC-08: corsFromEnv — allowlist 外 Origin は拒否", () => {
  it("ALLOWED_ORIGINS に含まれない Origin には ACAO を付けないこと", async () => {
    const res = await buildApp().request(
      "/me/profile",
      {
        method: "GET",
        headers: { Origin: "https://evil.example" },
      },
      makeEnv("https://web.example")
    );
    // null または "null" 以外の値が来ないことを確認
    const acao = res.headers.get("Access-Control-Allow-Origin");
    expect(acao).toBeNull();
  });
});
```

**期待値**: `Access-Control-Allow-Origin` ヘッダが存在しない（null）

---

### TC-09: allowlist 内 Origin からの OPTIONS preflight → 204 + ACAO

```ts
describe("TC-09: corsFromEnv — allowlist 内 OPTIONS preflight", () => {
  it("allowlist 内 Origin からの OPTIONS が 204 + ACAO を返すこと", async () => {
    const res = await buildApp().request(
      "/me/profile",
      {
        method: "OPTIONS",
        headers: {
          Origin: "https://web.example",
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers": "Content-Type,Authorization",
        },
      },
      makeEnv("https://web.example")
    );
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
      "https://web.example"
    );
    expect(res.headers.get("Access-Control-Allow-Credentials")).toBe("true");
  });
});
```

**期待値**: HTTP 204 + `Access-Control-Allow-Origin: https://web.example` + `Access-Control-Allow-Credentials: true`

---

### TC-10: `ALLOWED_ORIGINS` が undefined/空の場合は deny-by-default

```ts
describe("TC-10: corsFromEnv — deny-by-default（ALLOWED_ORIGINS 未設定）", () => {
  it("ALLOWED_ORIGINS が undefined のとき、どの Origin も拒否されること", async () => {
    const res = await buildApp().request(
      "/me/profile",
      {
        method: "GET",
        headers: { Origin: "https://web.example" },
      },
      makeEnv(undefined) // ALLOWED_ORIGINS = undefined
    );
    expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("ALLOWED_ORIGINS が空文字のとき、どの Origin も拒否されること", async () => {
    const res = await buildApp().request(
      "/me/profile",
      {
        method: "GET",
        headers: { Origin: "https://web.example" },
      },
      makeEnv("") // ALLOWED_ORIGINS = ""
    );
    expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });
});
```

**期待値**: `ALLOWED_ORIGINS` が未定義または空文字の場合、`Access-Control-Allow-Origin` が付かない

---

## 完全なテストファイル雛形（コピー用）

```ts
// apps/api/src/middleware/__tests__/security-headers.spec.ts
import { Hono } from "hono";
import { describe, it, expect } from "vitest";
import {
  securityHeaders,
  corsFromEnv,
  parseAllowedOrigins,
} from "../security-headers";
import type { Env } from "../../env";

const buildApp = () => {
  const app = new Hono<{ Bindings: Env }>();
  app.use("*", securityHeaders());
  app.use("*", corsFromEnv());
  app.get("/me/profile", (c) => c.json({ ok: true }));
  app.get("/public/form-preview", (c) => {
    c.header("Cache-Control", "public, max-age=60");
    return c.json({ ok: true });
  });
  return app;
};

const makeEnv = (allowedOrigins?: string): Env =>
  ({ ALLOWED_ORIGINS: allowedOrigins } as unknown as Env);

describe("TC-01: X-Content-Type-Options", () => {
  it("nosniff が付与されること", async () => {
    const res = await buildApp().request("/me/profile", { method: "GET" }, makeEnv());
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });
});

describe("TC-02: Strict-Transport-Security", () => {
  it("デフォルト max-age=31536000; includeSubDomains", async () => {
    const res = await buildApp().request("/me/profile", { method: "GET" }, makeEnv());
    expect(res.headers.get("Strict-Transport-Security")).toBe(
      "max-age=31536000; includeSubDomains"
    );
  });

  it("hstsMaxAge オプションでカスタマイズできること", async () => {
    const app = new Hono<{ Bindings: Env }>();
    app.use("*", securityHeaders({ hstsMaxAge: 86400 }));
    app.get("/", (c) => c.json({ ok: true }));
    const res = await app.request("/", { method: "GET" }, makeEnv());
    expect(res.headers.get("Strict-Transport-Security")).toBe(
      "max-age=86400; includeSubDomains"
    );
  });
});

describe("TC-03: Referrer-Policy", () => {
  it("no-referrer が付与されること", async () => {
    const res = await buildApp().request("/me/profile", { method: "GET" }, makeEnv());
    expect(res.headers.get("Referrer-Policy")).toBe("no-referrer");
  });
});

describe("TC-04: Cache-Control no-store 補完（既存 CC 無し）", () => {
  it("/me/profile に no-store が付くこと", async () => {
    const res = await buildApp().request("/me/profile", { method: "GET" }, makeEnv());
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("/auth/session も no-store になること", async () => {
    const app = new Hono<{ Bindings: Env }>();
    app.use("*", securityHeaders());
    app.get("/auth/session", (c) => c.json({ ok: true }));
    const res = await app.request("/auth/session", { method: "GET" }, makeEnv());
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });
});

describe("TC-05: Cache-Control 上書き禁止（既存 CC 有り）", () => {
  it("ハンドラが pre-set した 'public, max-age=60' が維持されること", async () => {
    const res = await buildApp().request(
      "/public/form-preview",
      { method: "GET" },
      makeEnv()
    );
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=60");
  });

  it("/public は noStorePrefixes 外なので CC 補完なし", async () => {
    const app = new Hono<{ Bindings: Env }>();
    app.use("*", securityHeaders());
    app.get("/public/members", (c) => c.json({ ok: true }));
    const res = await app.request("/public/members", { method: "GET" }, makeEnv());
    expect(res.headers.get("Cache-Control")).toBeNull();
  });
});

describe("TC-06: parseAllowedOrigins", () => {
  it("カンマ区切り・trim・空除去", () => {
    expect(parseAllowedOrigins("a, b ,,c")).toEqual(["a", "b", "c"]);
  });
  it("undefined → []", () => {
    expect(parseAllowedOrigins(undefined)).toEqual([]);
  });
  it("空文字 → []", () => {
    expect(parseAllowedOrigins("")).toEqual([]);
  });
  it("単一 origin", () => {
    expect(parseAllowedOrigins("https://web.example")).toEqual([
      "https://web.example",
    ]);
  });
});

describe("TC-07: corsFromEnv — allowlist 内 Origin", () => {
  it("ACAO が echo されること", async () => {
    const res = await buildApp().request(
      "/me/profile",
      { method: "GET", headers: { Origin: "https://web.example" } },
      makeEnv("https://web.example,https://admin.example")
    );
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
      "https://web.example"
    );
  });
});

describe("TC-08: corsFromEnv — allowlist 外 Origin", () => {
  it("ACAO が付かないこと", async () => {
    const res = await buildApp().request(
      "/me/profile",
      { method: "GET", headers: { Origin: "https://evil.example" } },
      makeEnv("https://web.example")
    );
    expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });
});

describe("TC-09: corsFromEnv — allowlist 内 OPTIONS preflight", () => {
  it("204 + ACAO + credentials", async () => {
    const res = await buildApp().request(
      "/me/profile",
      {
        method: "OPTIONS",
        headers: {
          Origin: "https://web.example",
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers": "Content-Type,Authorization",
        },
      },
      makeEnv("https://web.example")
    );
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
      "https://web.example"
    );
    expect(res.headers.get("Access-Control-Allow-Credentials")).toBe("true");
  });
});

describe("TC-10: corsFromEnv — deny-by-default", () => {
  it("ALLOWED_ORIGINS = undefined のとき全 Origin 拒否", async () => {
    const res = await buildApp().request(
      "/me/profile",
      { method: "GET", headers: { Origin: "https://web.example" } },
      makeEnv(undefined)
    );
    expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("ALLOWED_ORIGINS = 空文字のとき全 Origin 拒否", async () => {
    const res = await buildApp().request(
      "/me/profile",
      { method: "GET", headers: { Origin: "https://web.example" } },
      makeEnv("")
    );
    expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });
});
```

---

## 実行コマンド

```bash
# RED 確認（security-headers.ts 未作成状態で実行 → import エラーで fail）
mise exec -- pnpm exec vitest run apps/api/src/middleware/__tests__/security-headers.spec.ts

# Phase 5 実装後の GREEN 確認（同コマンド）
mise exec -- pnpm exec vitest run apps/api/src/middleware/__tests__/security-headers.spec.ts
```

> パスは単一引数（リポジトリ root からのフルパス）として渡すこと。
> `apps/api src/middleware/...` のように空白で 2 引数に分けると、
> 第 1 引数が test name filter として解釈され `No test files found` で失敗する。

---

## CLAUDE.md 不変条件チェック

| 条件 | 確認 |
|---|---|
| #8: テストファイルは `*.spec.ts` のみ（`*.test.ts` 禁止） | `security-headers.spec.ts` → 準拠 |
| D1 lane（`*.contract.spec.ts`）は unit config から exclude | 本テストは unit config で実行可（D1 binding 不使用） |
| `apps/api` 配下への直接コード実装禁止（仕様書作成 Phase） | Phase 4 はテストファイルのコードブロック記載のみ |
