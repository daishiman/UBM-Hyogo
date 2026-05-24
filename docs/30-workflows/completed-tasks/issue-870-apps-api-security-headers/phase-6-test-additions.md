# Phase 6: テスト拡充（fail path / 回帰 guard） — issue-870-apps-api-security-headers

> 実装区分: 実装仕様書 / NON_VISUAL / implementation_mode: new / 状態: implemented_local_evidence_captured
> 前 Phase: [phase-5-implementation.md](./phase-5-implementation.md) / 次 Phase: [phase-7-coverage.md](./phase-7-coverage.md)

---

## 目的

Phase 4 の TC-01〜TC-10（happy path / TDD RED）に加えて、以下を拡充する:

1. **fail path テスト**: 境界値・エラーケース・デフォルト挙動の網羅
2. **回帰 guard**: 既存の public route `Cache-Control` を上書きしないことの保証
3. **CORS deny-by-default の境界テスト**: allowlist に含まれない Origin・空 allowlist の徹底的な確認

---

## 最重要回帰: public route の Cache-Control 不変保証

### 背景

- `apps/api/src/routes/public/` 配下のルートは一部で `Cache-Control: public, max-age=60` を設定している
- `securityHeaders()` ミドルウェアを `app.use("*", ...)` で全パスに適用すると、
  これらの既存 Cache-Control を上書きするリスクがある
- **TC-05 が GREEN である**ことだけでなく、**D1 lane の contract テスト**も引き続き GREEN を維持することを回帰 guard として定義する

### D1 lane 回帰 guard

> **重要**: `*.contract.spec.ts` は unit config（`vitest.config.ts`）から exclude されており、
> `vitest.d1.config.ts`（D1 lane）でのみ実行される。
> 回帰確認は必ず D1 lane コマンドで行うこと。

```bash
# 回帰確認コマンド（D1 lane）
mise exec -- pnpm exec vitest run apps/api \
  --config vitest.d1.config.ts \
  src/routes/public/index.contract.spec.ts
```

**期待結果**: 既存の全テストが PASS（GREEN）を維持すること。
`Cache-Control` 関連のアサーションが失敗した場合は `securityHeaders` の上書き禁止ロジックを確認する。

### 回帰確認ポイント

既存 `apps/api/src/routes/public/index.contract.spec.ts` が以下を検証していることを確認する（Read で事実確認推奨）:

- `Cache-Control: public, max-age=60` が `no-store` に変わっていないこと
- `Cache-Control: no-store` を設定しているルート（`/me`, `/auth` 等）が引き続き `no-store` であること

---

## fail path テスト追加（`security-headers.spec.ts` への追記）

以下のテストケースを Phase 4 のファイルに追記する:

### TC-11: noStorePrefixes の境界値テスト（prefix 完全一致 vs prefix/ 始まり）

```ts
describe("TC-11: noStorePrefixes 境界値", () => {
  it("pathname === '/me' のとき no-store が付くこと（完全一致）", async () => {
    const app = new Hono<{ Bindings: Env }>();
    app.use("*", securityHeaders());
    app.get("/me", (c) => c.json({ ok: true }));
    const res = await app.request("/me", { method: "GET" }, makeEnv());
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("pathname が '/me/profile/details' のとき no-store が付くこと（prefix/ 始まり）", async () => {
    const app = new Hono<{ Bindings: Env }>();
    app.use("*", securityHeaders());
    app.get("/me/profile/details", (c) => c.json({ ok: true }));
    const res = await app.request("/me/profile/details", { method: "GET" }, makeEnv());
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  it("pathname '/members' は '/me' prefix に一致しないこと（前方一致ではなく prefix/ で判定）", async () => {
    const app = new Hono<{ Bindings: Env }>();
    app.use("*", securityHeaders());
    app.get("/members", (c) => c.json({ ok: true }));
    const res = await app.request("/members", { method: "GET" }, makeEnv());
    // '/members' は '/me' でも '/me/' でも始まらないので no-store にならない
    expect(res.headers.get("Cache-Control")).toBeNull();
  });

  it("pathname '/internal' は no-store になること", async () => {
    const app = new Hono<{ Bindings: Env }>();
    app.use("*", securityHeaders());
    app.get("/internal", (c) => c.json({ ok: true }));
    const res = await app.request("/internal", { method: "GET" }, makeEnv());
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });
});
```

> **設計意図**: `pathname.startsWith("/me")` ではなく `pathname === "/me" || pathname.startsWith("/me/")` で判定することで、
> `/members` が誤って `/me` prefix とマッチしないことを保証する。

---

### TC-12: 既存 Cache-Control が `no-store` の場合の冪等性

```ts
describe("TC-12: 既存 Cache-Control が no-store の場合（冪等性）", () => {
  it("ハンドラが既に no-store を設定している場合、middleware は二重 set しないこと", async () => {
    const app = new Hono<{ Bindings: Env }>();
    app.use("*", securityHeaders());
    app.get("/me/profile", (c) => {
      c.header("Cache-Control", "no-store");
      return c.json({ ok: true });
    });
    const res = await app.request("/me/profile", { method: "GET" }, makeEnv());
    // 値は no-store であり、重複や改変がないこと
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });
});
```

---

### TC-13: カスタム `noStorePrefixes` オプション

```ts
describe("TC-13: カスタム noStorePrefixes オプション", () => {
  it("カスタム prefix のみが no-store 補完されること", async () => {
    const app = new Hono<{ Bindings: Env }>();
    app.use("*", securityHeaders({ noStorePrefixes: ["/custom"] }));
    app.get("/custom/resource", (c) => c.json({ ok: true }));
    app.get("/me/profile", (c) => c.json({ ok: true }));

    const resCustom = await app.request("/custom/resource", { method: "GET" }, makeEnv());
    expect(resCustom.headers.get("Cache-Control")).toBe("no-store");

    // /me はデフォルト prefixes に含まれるが、カスタム指定したので対象外
    const resMe = await app.request("/me/profile", { method: "GET" }, makeEnv());
    expect(resMe.headers.get("Cache-Control")).toBeNull();
  });
});
```

---

### TC-14: CORS deny-by-default の境界テスト（詳細）

```ts
describe("TC-14: CORS deny-by-default 境界テスト", () => {
  it("ALLOWED_ORIGINS が空白のみの場合も拒否されること", async () => {
    const res = await buildApp().request(
      "/me/profile",
      { method: "GET", headers: { Origin: "https://web.example" } },
      makeEnv("   ")
    );
    expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("allowlist に 2 つ origin があり、2 つ目が一致する場合に ACAO が付くこと", async () => {
    const res = await buildApp().request(
      "/me/profile",
      { method: "GET", headers: { Origin: "https://admin.example" } },
      makeEnv("https://web.example,https://admin.example")
    );
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
      "https://admin.example"
    );
  });

  it("部分一致は許可されないこと（https://evil-web.example は https://web.example と別物）", async () => {
    const res = await buildApp().request(
      "/me/profile",
      { method: "GET", headers: { Origin: "https://evil-web.example" } },
      makeEnv("https://web.example")
    );
    expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("http:// と https:// は別 origin として扱われること", async () => {
    // allowlist に https:// のみ登録
    const res = await buildApp().request(
      "/me/profile",
      { method: "GET", headers: { Origin: "http://web.example" } },
      makeEnv("https://web.example")
    );
    expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("allowlist 外 Origin の OPTIONS preflight は ACAO なしで応答すること", async () => {
    const res = await buildApp().request(
      "/me/profile",
      {
        method: "OPTIONS",
        headers: {
          Origin: "https://evil.example",
          "Access-Control-Request-Method": "POST",
        },
      },
      makeEnv("https://web.example")
    );
    expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });
});
```

---

### TC-15: セキュリティヘッダが全 HTTP メソッドで付与されること

```ts
describe("TC-15: セキュリティヘッダの全メソッド網羅", () => {
  const methods = ["GET", "POST", "PATCH", "DELETE"] as const;

  for (const method of methods) {
    it(`${method} リクエストでも X-Content-Type-Options が付与されること`, async () => {
      const app = new Hono<{ Bindings: Env }>();
      app.use("*", securityHeaders());
      app.all("/api/resource", (c) => c.json({ ok: true }));
      const res = await app.request(
        "/api/resource",
        { method },
        makeEnv()
      );
      expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    });
  }
});
```

---

### TC-16: SECURITY_HEADERS / DEFAULT_HSTS_MAX_AGE 定数の型ガード

```ts
describe("TC-16: エクスポート定数の型チェック", () => {
  it("SECURITY_HEADERS が期待値を持つこと", () => {
    expect(SECURITY_HEADERS["X-Content-Type-Options"]).toBe("nosniff");
    expect(SECURITY_HEADERS["Referrer-Policy"]).toBe("no-referrer");
  });

  it("DEFAULT_HSTS_MAX_AGE が 31536000 であること", () => {
    expect(DEFAULT_HSTS_MAX_AGE).toBe(31_536_000);
  });

  it("DEFAULT_NO_STORE_PREFIXES に /me /auth /admin /internal が含まれること", () => {
    expect(DEFAULT_NO_STORE_PREFIXES).toContain("/me");
    expect(DEFAULT_NO_STORE_PREFIXES).toContain("/auth");
    expect(DEFAULT_NO_STORE_PREFIXES).toContain("/admin");
    expect(DEFAULT_NO_STORE_PREFIXES).toContain("/internal");
  });
});
```

---

## 回帰 guard サマリ

| 確認対象 | 確認方法 | 期待結果 |
|---|---|---|
| public route の `Cache-Control: public, max-age=60` が維持されること | D1 lane: `vitest.d1.config.ts src/routes/public/index.contract.spec.ts` | 全テスト PASS |
| `no-store` が意図しないパスに付かないこと | TC-05, TC-11（`/members` が対象外）| PASS |
| CORS deny-by-default | TC-08, TC-10, TC-14 | PASS |
| allowlist の per-request 動的読み取り | TC-07, TC-09 | PASS |

---

## 実行コマンド

```bash
# unit テスト拡充分（TC-11〜TC-16 含む）
mise exec -- pnpm exec vitest run apps/api src/middleware/__tests__/security-headers.spec.ts

# 回帰テスト（D1 lane） — public route の Cache-Control 不変確認
mise exec -- pnpm exec vitest run apps/api \
  --config vitest.d1.config.ts \
  src/routes/public/index.contract.spec.ts

# 全 unit テスト（回帰の全体確認）
mise exec -- pnpm exec vitest run apps/api
```

---

## CLAUDE.md 不変条件チェック

| 条件 | 確認 |
|---|---|
| #8: テストは `*.spec.ts` のみ | 追加テストも `security-headers.spec.ts` に追記 |
| `*.contract.spec.ts` は D1 lane のみ | 回帰コマンドは `vitest.d1.config.ts` を明示指定 |
| 既存 endpoint surface 不変 | テスト追加のみ。route 変更なし |
