import { describe, expect, it, vi } from "vitest";

import {
  DEFAULT_TOKEN_ENDPOINT,
  type JwtSigner,
  type SheetsAuthEnv,
  SheetsAuthError,
  createSheetsTokenSource,
  exchangeJwtForAccessToken,
  getSheetsAccessToken,
  parseServiceAccountJson,
  redact,
  redactToken,
} from "./auth";

const SAMPLE_PRIVATE_KEY =
  "-----BEGIN PRIVATE KEY-----\nFAKEKEYDATA==\n-----END PRIVATE KEY-----\n";

function makeEnv(overrides: Partial<Record<string, unknown>> = {}): SheetsAuthEnv {
  const sa = {
    type: "service_account",
    client_email: "ubm-sheets-sync@ubm-hyogo.iam.gserviceaccount.com",
    private_key: SAMPLE_PRIVATE_KEY,
    token_uri: DEFAULT_TOKEN_ENDPOINT,
    ...overrides,
  };
  return { GOOGLE_SERVICE_ACCOUNT_JSON: JSON.stringify(sa) };
}

const stubSigner: JwtSigner = {
  async sign() {
    return "header.payload.signature";
  },
};

function tokenResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("parseServiceAccountJson (AC-8)", () => {
  it("parses valid Service Account JSON", () => {
    const env = makeEnv();
    const sa = parseServiceAccountJson(env);
    expect(sa.client_email).toContain("@");
    expect(sa.private_key).toContain("PRIVATE KEY");
    expect(sa.token_uri).toBe(DEFAULT_TOKEN_ENDPOINT);
  });

  it("throws SheetsAuthError on malformed JSON (F-1)", () => {
    const env: SheetsAuthEnv = { GOOGLE_SERVICE_ACCOUNT_JSON: "{not json" };
    expect(() => parseServiceAccountJson(env)).toThrow(SheetsAuthError);
  });

  it("throws when client_email is missing (F-2)", () => {
    const env = makeEnv({ client_email: undefined });
    expect(() => parseServiceAccountJson(env)).toThrow(/client_email/);
  });

  it("throws when private_key is missing (F-2)", () => {
    const env = makeEnv({ private_key: undefined });
    expect(() => parseServiceAccountJson(env)).toThrow(/private_key/);
  });
});

describe("signJwt via stub signer (AC-2 contract)", () => {
  it("invokes signer with RS256 header and JWT claim set", async () => {
    const sign = vi.fn(stubSigner.sign);
    const fetchImpl = vi.fn(async () =>
      tokenResponse({ access_token: "ya29.x", expires_in: 3600 }),
    ) as unknown as typeof fetch;
    const source = createSheetsTokenSource(makeEnv(), {
      fetchImpl,
      signer: { sign },
      now: () => 1_700_000_000,
    });
    await source.getAccessToken();
    expect(sign).toHaveBeenCalledOnce();
    const [header, payload] = sign.mock.calls[0]!;
    expect(header).toEqual({ alg: "RS256", typ: "JWT" });
    expect(payload).toMatchObject({
      iss: "ubm-sheets-sync@ubm-hyogo.iam.gserviceaccount.com",
      scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
      aud: DEFAULT_TOKEN_ENDPOINT,
      iat: 1_700_000_000,
      exp: 1_700_003_600,
    });
  });

  it("propagates signer rejection (F-3)", async () => {
    const fetchImpl = vi.fn() as unknown as typeof fetch;
    const source = createSheetsTokenSource(makeEnv(), {
      fetchImpl,
      signer: {
        async sign() {
          throw new SheetsAuthError("private_key: importKey failed");
        },
      },
      now: () => 0,
    });
    await expect(source.getAccessToken()).rejects.toThrow(/importKey/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("uses custom scope when SHEETS_SCOPES provided", async () => {
    const sign = vi.fn(stubSigner.sign);
    const env: SheetsAuthEnv = {
      ...makeEnv(),
      SHEETS_SCOPES: "https://www.googleapis.com/auth/spreadsheets",
    };
    const fetchImpl = vi.fn(async () =>
      tokenResponse({ access_token: "tk", expires_in: 60 }),
    ) as unknown as typeof fetch;
    const source = createSheetsTokenSource(env, {
      fetchImpl,
      signer: { sign },
      now: () => 0,
    });
    await source.getAccessToken();
    expect(sign.mock.calls[0]![1]).toMatchObject({
      scope: "https://www.googleapis.com/auth/spreadsheets",
    });
  });
});

describe("exchangeJwtForAccessToken (AC-2)", () => {
  it("returns access_token + expires_in on 200", async () => {
    const fetchImpl = vi.fn(async () =>
      tokenResponse({ access_token: "ya29.OK", expires_in: 1800 }),
    ) as unknown as typeof fetch;
    const result = await exchangeJwtForAccessToken("jwt", { fetchImpl });
    expect(result).toEqual({ access_token: "ya29.OK", expires_in: 1800 });
    expect(fetchImpl).toHaveBeenCalledWith(
      DEFAULT_TOKEN_ENDPOINT,
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("throws when status is 4xx (F-4)", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response("invalid_grant", { status: 401 }),
    ) as unknown as typeof fetch;
    await expect(
      exchangeJwtForAccessToken("jwt", { fetchImpl }),
    ).rejects.toThrow(/401/);
  });

  it("throws when status is 5xx (F-7)", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response("err", { status: 503 }),
    ) as unknown as typeof fetch;
    await expect(
      exchangeJwtForAccessToken("jwt", { fetchImpl }),
    ).rejects.toThrow(/503/);
  });

  it("throws when access_token is missing", async () => {
    const fetchImpl = vi.fn(async () =>
      tokenResponse({ expires_in: 3600 }),
    ) as unknown as typeof fetch;
    await expect(
      exchangeJwtForAccessToken("jwt", { fetchImpl }),
    ).rejects.toThrow(/access_token/);
  });
});

describe("createSheetsTokenSource cache behavior (AC-2 / F-9 / F-10)", () => {
  it("caches token within TTL (no refetch)", async () => {
    const fetchImpl = vi.fn(async () =>
      tokenResponse({ access_token: "cached", expires_in: 3600 }),
    ) as unknown as typeof fetch;
    let nowSec = 1_000_000;
    const source = createSheetsTokenSource(makeEnv(), {
      fetchImpl,
      signer: stubSigner,
      now: () => nowSec,
    });
    const a = await source.getAccessToken();
    nowSec += 60;
    const b = await source.getAccessToken();
    expect(a.accessToken).toBe("cached");
    expect(b.accessToken).toBe("cached");
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("refreshes when TTL within 5 minutes (F-9 lead)", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        tokenResponse({ access_token: "first", expires_in: 600 }),
      )
      .mockResolvedValueOnce(
        tokenResponse({ access_token: "second", expires_in: 3600 }),
      ) as unknown as typeof fetch;
    let nowSec = 1_000;
    const source = createSheetsTokenSource(makeEnv(), {
      fetchImpl,
      signer: stubSigner,
      now: () => nowSec,
    });
    expect((await source.getAccessToken()).accessToken).toBe("first");
    nowSec += 600 - 60; // within 5 min lead
    expect((await source.getAccessToken()).accessToken).toBe("second");
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("shares in-flight Promise on parallel calls (F-10)", async () => {
    let resolveFn!: (res: Response) => void;
    const deferred = new Promise<Response>((resolve) => {
      resolveFn = resolve;
    });
    const fetchImpl = vi.fn(() => deferred) as unknown as typeof fetch;
    const source = createSheetsTokenSource(makeEnv(), {
      fetchImpl,
      signer: stubSigner,
      now: () => 0,
    });
    const p1 = source.getAccessToken();
    const p2 = source.getAccessToken();
    resolveFn(tokenResponse({ access_token: "shared", expires_in: 3600 }));
    const [a, b] = await Promise.all([p1, p2]);
    expect(a.accessToken).toBe("shared");
    expect(b.accessToken).toBe("shared");
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("returns expiresAt in epoch milliseconds", async () => {
    const fetchImpl = vi.fn(async () =>
      tokenResponse({ access_token: "t", expires_in: 1800 }),
    ) as unknown as typeof fetch;
    const source = createSheetsTokenSource(makeEnv(), {
      fetchImpl,
      signer: stubSigner,
      now: () => 1_000,
    });
    const tok = await source.getAccessToken();
    expect(tok.expiresAt).toBe((1_000 + 1800) * 1000);
  });

  it("keeps module cache entries separate per SHEETS_SCOPES", async () => {
    const sign = vi.fn(stubSigner.sign);
    let tokenCount = 0;
    const fetchImpl = vi.fn(async () =>
      tokenResponse({ access_token: `token-${tokenCount++}`, expires_in: 3600 }),
    ) as unknown as typeof fetch;
    const baseEnv = makeEnv();

    await getSheetsAccessToken(baseEnv, { fetchImpl, signer: { sign }, now: () => 1 });
    await getSheetsAccessToken(
      {
        ...baseEnv,
        SHEETS_SCOPES: "https://www.googleapis.com/auth/spreadsheets",
      },
      { fetchImpl, signer: { sign }, now: () => 2 },
    );

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(sign.mock.calls[0]![1]).toMatchObject({
      scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
    });
    expect(sign.mock.calls[1]![1]).toMatchObject({
      scope: "https://www.googleapis.com/auth/spreadsheets",
    });
  });
});

describe("redact (Phase 6 §4)", () => {
  it("redacts BEGIN/END PRIVATE KEY blocks", () => {
    const log = `oops ${SAMPLE_PRIVATE_KEY} leaked`;
    const out = redact(log);
    expect(out).not.toContain("FAKEKEYDATA");
    expect(out).toContain("[REDACTED]");
  });

  it("redacts JSON private_key field", () => {
    const out = redact('{"private_key":"abc","other":"x"}');
    expect(out).toContain('"private_key":"[REDACTED]"');
  });

  it("redacts Bearer tokens", () => {
    const out = redact("Authorization: Bearer ya29.SECRET");
    expect(out).toContain("Bearer [REDACTED]");
  });

  it("redactToken keeps short prefix only", () => {
    expect(redactToken("ya29.thisIsLong")).toMatch(/^ya29…/);
    expect(redactToken("short")).toBe("[REDACTED]");
  });
});
