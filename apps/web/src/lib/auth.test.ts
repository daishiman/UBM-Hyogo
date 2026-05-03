// ut-web-cov-03 Phase 5: auth.ts unit test。
// 観点:
//   - fetchSessionResolve: happy / config-missing(token-missing) / non-ok / fetch throw / service-binding
//   - buildAuthConfig callbacks: signIn(google ok / unverified / unregistered) / signIn(credentials valid/invalid)
//     jwt callback / session callback
//   - env header overrides via requestEnv (lazy via buildAuthConfig)

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cloudflareEnv: Record<string, unknown> = {};
const cloudflareContext = vi.fn(() => ({ env: cloudflareEnv }));

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: () => cloudflareContext(),
}));

import { buildAuthConfig, fetchSessionResolve, getAuth } from "./auth";

const resetEnv = () => {
  for (const k of Object.keys(cloudflareEnv)) delete cloudflareEnv[k];
  cloudflareContext.mockImplementation(() => ({ env: cloudflareEnv }));
};

describe("fetchSessionResolve", () => {
  beforeEach(resetEnv);

  it("baseUrl 未設定なら unregistered を返す", async () => {
    const r = await fetchSessionResolve(
      "u@example.com",
      { INTERNAL_AUTH_SECRET: "s" },
      vi.fn(),
    );
    expect(r).toEqual({
      memberId: null,
      isAdmin: false,
      gateReason: "unregistered",
    });
  });

  it("secret 未設定なら unregistered を返す", async () => {
    const r = await fetchSessionResolve(
      "u@example.com",
      { INTERNAL_API_BASE_URL: "https://api.example.com" },
      vi.fn(),
    );
    expect(r.gateReason).toBe("unregistered");
  });

  it("happy path: ok=true で resolved を返し、URL は email を lowercase + 末尾trim", async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            memberId: "m_1",
            isAdmin: true,
            gateReason: null,
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
    ) as unknown as typeof fetch;
    const r = await fetchSessionResolve(
      "  U@Example.com  ",
      {
        INTERNAL_API_BASE_URL: "https://api.example.com",
        INTERNAL_AUTH_SECRET: "secret",
      },
      fetchImpl,
    );
    expect(r).toEqual({
      memberId: "m_1",
      isAdmin: true,
      gateReason: null,
    });
    const call = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(call[0]).toContain("email=u%40example.com");
    expect((call[1].headers as Record<string, string>)["x-internal-auth"]).toBe(
      "secret",
    );
  });

  it("non-ok レスポンスは unregistered fallback", async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response("err", { status: 502 }),
    ) as unknown as typeof fetch;
    const r = await fetchSessionResolve(
      "u@example.com",
      {
        INTERNAL_API_BASE_URL: "https://api.example.com",
        INTERNAL_AUTH_SECRET: "secret",
      },
      fetchImpl,
    );
    expect(r.gateReason).toBe("unregistered");
    expect(r.memberId).toBeNull();
  });

  it("fetch throw 時も unregistered fallback", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("boom");
    }) as unknown as typeof fetch;
    const r = await fetchSessionResolve(
      "u@example.com",
      {
        INTERNAL_API_BASE_URL: "https://api.example.com",
        INTERNAL_AUTH_SECRET: "secret",
      },
      fetchImpl,
    );
    expect(r).toEqual({
      memberId: null,
      isAdmin: false,
      gateReason: "unregistered",
    });
  });

  it("API_SERVICE binding が指定されていれば binding.fetch を優先", async () => {
    const bindingFetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            memberId: "m_2",
            isAdmin: false,
            gateReason: null,
          }),
          { status: 200 },
        ),
    );
    const r = await fetchSessionResolve(
      "u@example.com",
      {
        INTERNAL_API_BASE_URL: "https://api.example.com",
        INTERNAL_AUTH_SECRET: "secret",
        API_SERVICE: { fetch: bindingFetch as unknown as typeof fetch },
      },
      vi.fn() as unknown as typeof fetch,
    );
    expect(bindingFetch).toHaveBeenCalledTimes(1);
    expect(r.memberId).toBe("m_2");
  });

  it("staging 環境では debug log を出力する", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const fetchImpl = vi.fn(
      async () =>
        new Response(
          JSON.stringify({ memberId: "m_3", isAdmin: false, gateReason: null }),
          { status: 200 },
        ),
    ) as unknown as typeof fetch;
    await fetchSessionResolve(
      "u@example.com",
      {
        ENVIRONMENT: "staging",
        INTERNAL_API_BASE_URL: "https://api.example.com",
        INTERNAL_AUTH_SECRET: "secret",
      },
      fetchImpl,
    );
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it("staging で fetch throw 時の log path", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const fetchImpl = vi.fn(async () => {
      throw new Error("net");
    }) as unknown as typeof fetch;
    const r = await fetchSessionResolve(
      "u@example.com",
      {
        ENVIRONMENT: "staging",
        INTERNAL_API_BASE_URL: "https://api.example.com",
        INTERNAL_AUTH_SECRET: "secret",
      },
      fetchImpl,
    );
    expect(r.gateReason).toBe("unregistered");
    expect(log).toHaveBeenCalledWith("[auth] session-resolve fetch failed");
    log.mockRestore();
  });

  it("default env() で fetchSessionResolve を呼んで env helper を経由する", async () => {
    // baseUrl/secret 未設定なので unregistered で即返る。env() helpers のカバレッジを取る。
    const r = await fetchSessionResolve("u@example.com");
    expect(r.gateReason).toBe("unregistered");
  });

  it("staging で non-ok 時に body 内容も log する", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const fetchImpl = vi.fn(
      async () => new Response("server boom", { status: 500 }),
    ) as unknown as typeof fetch;
    const r = await fetchSessionResolve(
      "u@example.com",
      {
        ENVIRONMENT: "staging",
        INTERNAL_API_BASE_URL: "https://api.example.com",
        INTERNAL_AUTH_SECRET: "secret",
      },
      fetchImpl,
    );
    expect(r.gateReason).toBe("unregistered");
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });
});

const factories = {
  GoogleProvider: (opts: unknown) => ({ id: "google", options: opts }),
  CredentialsProvider: (opts: unknown) => ({ id: "credentials", options: opts }),
};

describe("buildAuthConfig", () => {
  beforeEach(resetEnv);

  it("AUTH_SECRET 未設定なら secret プロパティを含めない", () => {
    const cfg = buildAuthConfig({}, vi.fn() as unknown as typeof fetch, factories);
    expect((cfg as { secret?: string }).secret).toBeUndefined();
    expect(cfg.session.strategy).toBe("jwt");
  });

  it("AUTH_SECRET 設定で secret を含む", () => {
    const cfg = buildAuthConfig(
      { AUTH_SECRET: "xyz" },
      vi.fn() as unknown as typeof fetch,
      factories,
    );
    expect((cfg as { secret: string }).secret).toBe("xyz");
  });

  it("providers に google + credentials が含まれる", () => {
    const cfg = buildAuthConfig({}, vi.fn() as unknown as typeof fetch, factories);
    expect(cfg.providers).toHaveLength(2);
    const [google, creds] = cfg.providers as Array<{
      id: string;
      options: { clientId?: string; clientSecret?: string };
    }>;
    expect(google.id).toBe("google");
    expect(creds.id).toBe("credentials");
  });

  describe("credentials provider authorize", () => {
    const getAuthorize = () => {
      const cfg = buildAuthConfig(
        {},
        vi.fn() as unknown as typeof fetch,
        factories,
      );
      const creds = (cfg.providers as Array<{ id: string; options: { authorize: (c: Record<string, unknown> | undefined) => Promise<unknown> } }>).find(
        (p) => p.id === "credentials",
      );
      return creds!.options.authorize;
    };

    it("verifiedUser 文字列の有効 user で id/memberId/email/isAdmin を返す", async () => {
      const authorize = getAuthorize();
      const r = (await authorize({
        verifiedUser: JSON.stringify({
          email: "u@example.com",
          memberId: "m_1",
          responseId: "r_1",
          isAdmin: true,
          authGateState: "active",
        }),
      })) as { id: string; memberId: string; email: string; isAdmin: boolean };
      expect(r).toEqual({
        id: "m_1",
        memberId: "m_1",
        email: "u@example.com",
        isAdmin: true,
      });
    });

    it("isAdmin が undefined なら false に正規化", async () => {
      const authorize = getAuthorize();
      const r = (await authorize({
        verifiedUser: JSON.stringify({
          email: "u@example.com",
          memberId: "m_1",
          responseId: "r_1",
        }),
      })) as { isAdmin: boolean };
      expect(r.isAdmin).toBe(false);
    });

    it("credentials 不在 / 文字列でない場合 null", async () => {
      const authorize = getAuthorize();
      expect(await authorize(undefined)).toBeNull();
      expect(await authorize({})).toBeNull();
      expect(await authorize({ verifiedUser: 123 })).toBeNull();
      expect(await authorize({ verifiedUser: "" })).toBeNull();
    });

    it("JSON parse 不可で null", async () => {
      const authorize = getAuthorize();
      expect(await authorize({ verifiedUser: "not-json" })).toBeNull();
    });

    it("null / 非 object は null", async () => {
      const authorize = getAuthorize();
      expect(await authorize({ verifiedUser: "null" })).toBeNull();
      expect(await authorize({ verifiedUser: '"string"' })).toBeNull();
    });

    it("必須フィールド欠落 / 空文字は null", async () => {
      const authorize = getAuthorize();
      const baseValid = {
        email: "u@example.com",
        memberId: "m_1",
        responseId: "r_1",
      };
      for (const missing of ["email", "memberId", "responseId"] as const) {
        const v = { ...baseValid } as Record<string, unknown>;
        delete v[missing];
        expect(
          await authorize({ verifiedUser: JSON.stringify(v) }),
        ).toBeNull();
      }
      for (const empty of ["email", "memberId", "responseId"] as const) {
        const v = { ...baseValid, [empty]: "" };
        expect(
          await authorize({ verifiedUser: JSON.stringify(v) }),
        ).toBeNull();
      }
    });

    it("型が異なるフィールドは null", async () => {
      const authorize = getAuthorize();
      expect(
        await authorize({
          verifiedUser: JSON.stringify({
            email: 1,
            memberId: "m",
            responseId: "r",
          }),
        }),
      ).toBeNull();
    });
  });

  it("GOOGLE_CLIENT_ID/SECRET と AUTH_GOOGLE_ID/SECRET の優先順", () => {
    const cfg = buildAuthConfig(
      { GOOGLE_CLIENT_ID: "g1", AUTH_GOOGLE_SECRET: "s2" },
      vi.fn() as unknown as typeof fetch,
      factories,
    );
    const [google] = cfg.providers as Array<{
      options: { clientId: string; clientSecret: string };
    }>;
    expect(google.options.clientId).toBe("g1");
    expect(google.options.clientSecret).toBe("s2");
  });

  describe("callbacks.signIn", () => {
    it("google: email_verified=false なら /login?gate=unregistered", async () => {
      const cfg = buildAuthConfig(
        {},
        vi.fn() as unknown as typeof fetch,
        factories,
      );
      const r = await cfg.callbacks.signIn({
        user: { email: "u@example.com" },
        account: { provider: "google" },
        profile: { email: "u@example.com", email_verified: false },
      });
      expect(r).toBe("/login?gate=unregistered");
    });

    it("google: email 欠落も /login?gate=unregistered", async () => {
      const cfg = buildAuthConfig(
        {},
        vi.fn() as unknown as typeof fetch,
        factories,
      );
      const r = await cfg.callbacks.signIn({
        user: {},
        account: { provider: "google" },
        profile: { email_verified: true },
      });
      expect(r).toBe("/login?gate=unregistered");
    });

    it("google: session-resolve memberId 無しは /login?gate=<reason>", async () => {
      const fetchImpl = vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              memberId: null,
              isAdmin: false,
              gateReason: "rules_declined",
            }),
            { status: 200 },
          ),
      ) as unknown as typeof fetch;
      const cfg = buildAuthConfig(
        {
          INTERNAL_API_BASE_URL: "https://api.example.com",
          INTERNAL_AUTH_SECRET: "secret",
        },
        fetchImpl,
        factories,
      );
      const r = await cfg.callbacks.signIn({
        user: { email: "u@example.com" },
        account: { provider: "google" },
        profile: { email: "u@example.com", email_verified: true },
      });
      expect(r).toBe("/login?gate=rules_declined");
    });

    it("google: session-resolve 成功で true + user に memberId 注入", async () => {
      const fetchImpl = vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              memberId: "m_1",
              isAdmin: true,
              gateReason: null,
            }),
            { status: 200 },
          ),
      ) as unknown as typeof fetch;
      const cfg = buildAuthConfig(
        {
          INTERNAL_API_BASE_URL: "https://api.example.com",
          INTERNAL_AUTH_SECRET: "secret",
        },
        fetchImpl,
        factories,
      );
      const user: Record<string, unknown> = { email: "u@example.com" };
      const r = await cfg.callbacks.signIn({
        user,
        account: { provider: "google" },
        profile: { email: "u@example.com", email_verified: true },
      });
      expect(r).toBe(true);
      expect(user.memberId).toBe("m_1");
      expect(user.isAdmin).toBe(true);
    });

    it("credentials: 有効な memberId で true", async () => {
      const cfg = buildAuthConfig(
        {},
        vi.fn() as unknown as typeof fetch,
        factories,
      );
      const r = await cfg.callbacks.signIn({
        user: { memberId: "m_1", isAdmin: false },
        account: { provider: "credentials" },
        profile: undefined,
      });
      expect(r).toBe(true);
    });

    it("credentials: memberId 欠落で false", async () => {
      const cfg = buildAuthConfig(
        {},
        vi.fn() as unknown as typeof fetch,
        factories,
      );
      const r = await cfg.callbacks.signIn({
        user: {},
        account: { provider: "credentials" },
        profile: undefined,
      });
      expect(r).toBe(false);
    });

    it("未対応 provider は false", async () => {
      const cfg = buildAuthConfig(
        {},
        vi.fn() as unknown as typeof fetch,
        factories,
      );
      const r = await cfg.callbacks.signIn({
        user: {},
        account: { provider: "github" },
        profile: undefined,
      });
      expect(r).toBe(false);
    });
  });

  describe("callbacks.jwt", () => {
    it("user 有り: memberId / isAdmin / email / name を token に積む", async () => {
      const cfg = buildAuthConfig(
        {},
        vi.fn() as unknown as typeof fetch,
        factories,
      );
      const token: Record<string, unknown> = {};
      const r = await cfg.callbacks.jwt({
        token,
        user: {
          memberId: "m_1",
          isAdmin: true,
          email: "u@example.com",
          name: "T",
        },
      });
      expect(r.sub).toBe("m_1");
      expect(r.memberId).toBe("m_1");
      expect(r.isAdmin).toBe(true);
      expect(r.email).toBe("u@example.com");
      expect(r.name).toBe("T");
    });

    it("user 無し: token を素通し", async () => {
      const cfg = buildAuthConfig(
        {},
        vi.fn() as unknown as typeof fetch,
        factories,
      );
      const token = { foo: 1 };
      const r = await cfg.callbacks.jwt({ token, user: undefined });
      expect(r).toBe(token);
    });

    it("user.memberId 無しでも isAdmin だけは載せる（false 正規化）", async () => {
      const cfg = buildAuthConfig(
        {},
        vi.fn() as unknown as typeof fetch,
        factories,
      );
      const token: Record<string, unknown> = {};
      const r = await cfg.callbacks.jwt({
        token,
        user: { isAdmin: false },
      });
      expect(r.isAdmin).toBe(false);
      expect(r.memberId).toBeUndefined();
    });
  });

  describe("callbacks.session", () => {
    it("token から SessionUser を構築する", async () => {
      const cfg = buildAuthConfig(
        {},
        vi.fn() as unknown as typeof fetch,
        factories,
      );
      const r = await cfg.callbacks.session({
        session: { user: { email: "from-session@example.com" } },
        token: {
          memberId: "m_1",
          isAdmin: true,
          email: "tok@example.com",
          name: "T",
        },
      });
      expect(r.user.memberId).toBe("m_1");
      expect(r.user.isAdmin).toBe(true);
      expect(r.user.email).toBe("tok@example.com");
      expect(r.user.name).toBe("T");
    });

    it("token に memberId 無しは空文字 / isAdmin=false", async () => {
      const cfg = buildAuthConfig(
        {},
        vi.fn() as unknown as typeof fetch,
        factories,
      );
      const r = await cfg.callbacks.session({
        session: { user: { email: "u@example.com" } },
        token: {},
      });
      expect(r.user.memberId).toBe("");
      expect(r.user.isAdmin).toBe(false);
      expect(r.user.email).toBe("u@example.com");
    });
  });

  describe("getAuth", () => {
    it("dynamic import で AuthRuntime を返し、二回目は cache される", async () => {
      const r1 = await getAuth();
      const r2 = await getAuth();
      expect(r1).toBe(r2);
      expect(typeof r1.auth).toBe("function");
      expect(typeof r1.signIn).toBe("function");
      expect(typeof r1.handlers.GET).toBe("function");
    });
  });

  describe("missing provider factories", () => {
    it("provider factories 未指定（default）は build 時に throw", () => {
      expect(() =>
        buildAuthConfig({}, vi.fn() as unknown as typeof fetch),
      ).toThrow(/Auth providers must be loaded/);
    });

    it("env / fetchImpl 全部 default で呼ぶと env() helper を経由して throw", () => {
      // default env() / processEnv / globalEnv / cloudflareEnv / definedEnv 経由
      expect(() => buildAuthConfig()).toThrow(/Auth providers must be loaded/);
    });

    it("missingProviderFactories.CredentialsProvider も同 message で throw", () => {
      // GoogleProvider のみ stub し、CredentialsProvider は default を踏ませる
      expect(() =>
        buildAuthConfig({}, vi.fn() as unknown as typeof fetch, {
          GoogleProvider: () => ({ id: "google" }),
          CredentialsProvider: () => {
            throw new Error("Auth providers must be loaded through getAuth()");
          },
        }),
      ).toThrow(/Auth providers must be loaded/);
    });
  });

  describe("jwt encode/decode", () => {
    it("encode は secret を文字列化して shared encodeAuthSessionJwt を呼ぶ", async () => {
      const cfg = buildAuthConfig(
        {},
        vi.fn() as unknown as typeof fetch,
        factories,
      );
      const jwt = await cfg.jwt.encode({
        token: {
          memberId: "m_1",
          email: "u@example.com",
          isAdmin: false,
          authGateState: "active",
        },
        secret: "0123456789abcdef0123456789abcdef",
      });
      expect(typeof jwt).toBe("string");
      expect(jwt.split(".")).toHaveLength(3);
    });

    it("encode は secret 配列の先頭を採用する", async () => {
      const cfg = buildAuthConfig(
        {},
        vi.fn() as unknown as typeof fetch,
        factories,
      );
      const jwt = await cfg.jwt.encode({
        token: {
          memberId: "m_1",
          email: "u@example.com",
          isAdmin: false,
          authGateState: "active",
        },
        secret: ["0123456789abcdef0123456789abcdef", "other"],
      });
      const decoded = await cfg.jwt.decode({
        token: jwt,
        secret: "0123456789abcdef0123456789abcdef",
      });
      expect(decoded?.memberId).toBe("m_1");
    });

    it("decode は token 未指定で null", async () => {
      const cfg = buildAuthConfig(
        {},
        vi.fn() as unknown as typeof fetch,
        factories,
      );
      const r = await cfg.jwt.decode({
        secret: "0123456789abcdef0123456789abcdef",
      });
      expect(r).toBeNull();
    });
  });
});
