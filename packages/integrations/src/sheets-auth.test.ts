import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  importPrivateKey,
  createSignedJWT,
  getAccessToken,
  SheetsAuthError,
  type SheetsTokenCache,
  _resetMemoryCache,
} from "./sheets-auth.js";

// RSA-2048 テスト用秘密鍵（テスト専用・本番使用禁止）
const TEST_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCrC86Kraes5TyB
yxLGk2wsJfduPAIvF+qjTqAg6tjs2DIqK7+7Pidl0RKqXk9Cx8zMGosEnWPdU3jV
44z/+3SfLLzb07fT7OqIWX3yRmd7gFKCAcdHbG/hxMYRTc3iYc/zXpTUM/FXhZUR
tAFsahJ1nnJShei4hjyIUhBDs4jsmnWB6P4cdE6sRd/8MzKkggUAG4+fj5YPa4qu
4AIgAzyxlscRxYh1xcIqSOxeZ3lhV86ELLbg/c6LaJACZKpqDhrIbW9KGa+Zi84r
Up2sqBNSjDA3Bsj8w7o9GTKOUlDd/MOWlptx5kMgJIxh3w26GHtH8bTVW1i3VKKs
y503UOw3AgMBAAECggEAG5mRH2F8D/MBe3QYOICrUMhjj58RPyYdz3ItdoJOtJEC
LznV+1HBK7W7zE/hfEYfLsQNsJXw+lKwydqo8tlRbSnb46DbJdAx3ASMxR5FLnF7
Xs0Iqea+evC0gTBLy366/mtBmqgzBktgzXV9UVAgYGhLzDMdZUEL3XdYdoQu0Par
tlereCKJQmNOVac1n5uWD3WNfmv1T6nbU4li87C5oNZ8JwH3C6B7SOO8G8v3VnfW
Se+UwWPsA1qbFgZXKaGMr8WTi8AVBuwN/TQZMUxAgvD7RPWxpyspv916fwbI/Opl
6DoxlYGh9dA+pS/tmUd/lqUaKw81VJSd66ZFDb4s+QKBgQDlGAkRHhu5LQz1+qBk
KeRoWaXiie34WEwhGba7oaItv2KDZ65MtnhMWyI8ZphZ+kTdk16ZjrECymYw34RR
Bc18loPFryeYCGxpb0BC7U29yoBtko+WbpVjcMJNr+ZXkgfmQuxWJSy5ASjmQkuF
aXP2VT+iDdhqrND1q9g259+AVQKBgQC/IoAK0pPoiElh3HMJ9mkWqFt1vtvXxn2h
X2byFBC0RfxFd9T/uKHyyUrUfC1DtETplj762ZUSQ+lOP3rdU3uzu3sMXbuIU+w4
SE6GrOt3RdM0iu1RYCRLcaaNzfQYYxcM8/4VYANpQoomiVn+wooDxT2KVsP3qCJY
7DleOXsWWwKBgQCMYMP9hzN5ro9IksCBX+IjxvsM63O0P3a2uajtJEfaPHHDD18Q
hqcEMruxwzQLvn1AQLMw6OyyRw+DVxMfCq01cI1iLsfWMyMrIA6CdCK070bu3WW6
yhwkCM4nCGfetQ6+G7fxuWnEG1/SaEEaiNmT0fzh8hXwl+CbCSe9zSt42QKBgD6r
ITBrOvPTO7xKe62YjXxQVyyUF6D4A9kVXruguJljGQPt9niiIPdp6I8i5/R69t1f
1eaJ0MbcXXK6fZ5z8OtNXVsAoKxiV+FcU+L0b3/79PQVWRqFW2EhMmrsTExysOwe
VADOKlAo8QMRpeBSCM6TrUneiQJ6rkhZq7WpQyJhAoGAZyTZakVzxB4MuLqUf8Ke
6h00yvYDpvcg/2uw/KFxL0wfhc6Rylt/jYXJW7YSptImKRDrVJZ3v/kD/2cEOq8/
QZvqOi1GQ3A9Pc+DkNDeFmZ9kowGfq0lqzq6t41ZeCtUPUOiYmyJp8gH5+e5w6BH
7LiIIWiTcMvQAEN5MvV89Pw=
-----END PRIVATE KEY-----`;

const TEST_SA_JSON = JSON.stringify({
  type: "service_account",
  project_id: "test-project",
  private_key_id: "key-id-001",
  private_key: TEST_PRIVATE_KEY,
  client_email: "test@test-project.iam.gserviceaccount.com",
  token_uri: "https://oauth2.googleapis.com/token",
});

const createMockKV = () => {
  const store = new Map<string, string>();
  return {
    get: vi.fn(async (key: string, type?: string) => {
      const val = store.get(key);
      if (!val) return null;
      if (type === "json") return JSON.parse(val);
      return val;
    }),
    put: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    delete: vi.fn(async (key: string) => {
      store.delete(key);
    }),
    list: vi.fn(async () => ({ keys: [], list_complete: true, cursor: "" })),
    getWithMetadata: vi.fn(),
  } satisfies SheetsTokenCache & {
    delete: ReturnType<typeof vi.fn>;
    list: ReturnType<typeof vi.fn>;
    getWithMetadata: ReturnType<typeof vi.fn>;
  };
};

beforeEach(() => {
  _resetMemoryCache();
  vi.restoreAllMocks();
});

describe("AUTH-01: PEM key import", () => {
  it("Service Account JSON の private_key を Web Crypto API にインポートできる", async () => {
    const sa = JSON.parse(TEST_SA_JSON);
    const key = await importPrivateKey(sa.private_key);
    expect(key).toBeDefined();
    expect(key.type).toBe("private");
    expect(key.algorithm).toMatchObject({ name: "RSASSA-PKCS1-v1_5" });
  });

  it("不正な PEM を渡すと SheetsAuthError をスローする", async () => {
    await expect(importPrivateKey("not-a-pem")).rejects.toThrow(SheetsAuthError);
    await expect(importPrivateKey("not-a-pem")).rejects.toThrow("Failed to import private key");
  });
});

describe("AUTH-02: base64url / JWT claim", () => {
  it("JWT header/payload が RS256・scope・aud・iat・exp を含む", async () => {
    const sa = JSON.parse(TEST_SA_JSON);
    const key = await importPrivateKey(sa.private_key);
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    };

    const jwt = await createSignedJWT(key, payload);
    const parts = jwt.split(".");
    expect(parts).toHaveLength(3);

    const header = JSON.parse(atob(parts[0].replace(/-/g, "+").replace(/_/g, "/")));
    expect(header.alg).toBe("RS256");
    expect(header.typ).toBe("JWT");

    const decodedPayload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    expect(decodedPayload.scope).toBe("https://www.googleapis.com/auth/spreadsheets.readonly");
    expect(decodedPayload.aud).toBe("https://oauth2.googleapis.com/token");
    expect(decodedPayload.iat).toBeGreaterThan(0);
    expect(decodedPayload.exp).toBe(decodedPayload.iat + 3600);
  });
});

describe("AUTH-03: token endpoint mock", () => {
  it("fetch mock で access_token / expires_in を受け取れる", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: "mock-token-123", expires_in: 3600 }),
      text: async () => "",
    });
    vi.stubGlobal("fetch", mockFetch);

    const env = { GOOGLE_SERVICE_ACCOUNT_JSON: TEST_SA_JSON };
    const result = await getAccessToken(env);

    expect(result.accessToken).toBe("mock-token-123");
    expect(result.expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000));
    expect(mockFetch).toHaveBeenCalledOnce();
    expect(mockFetch).toHaveBeenCalledWith(
      "https://oauth2.googleapis.com/token",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("token endpoint が 4xx を返すと SheetsAuthError をスローする", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
    }));

    const env = { GOOGLE_SERVICE_ACCOUNT_JSON: TEST_SA_JSON };
    await expect(getAccessToken(env)).rejects.toThrow(SheetsAuthError);
    await expect(getAccessToken(env)).rejects.toThrow("401");
  });
});

describe("AUTH-04: TTL cache", () => {
  it("有効期限内の再呼び出しで token endpoint を再実行しない", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: "cached-token", expires_in: 3600 }),
      text: async () => "",
    });
    vi.stubGlobal("fetch", mockFetch);

    const env = { GOOGLE_SERVICE_ACCOUNT_JSON: TEST_SA_JSON };
    const first = await getAccessToken(env);
    const second = await getAccessToken(env);

    expect(first.accessToken).toBe("cached-token");
    expect(second.accessToken).toBe("cached-token");
    expect(mockFetch).toHaveBeenCalledOnce();
  });
});

describe("AUTH-05: KV fallback", () => {
  it("KV 未設定時は in-memory cache で動作する", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: "mem-token", expires_in: 3600 }),
      text: async () => "",
    });
    vi.stubGlobal("fetch", mockFetch);

    const env = { GOOGLE_SERVICE_ACCOUNT_JSON: TEST_SA_JSON };
    const r1 = await getAccessToken(env);
    const r2 = await getAccessToken(env);

    expect(r1.accessToken).toBe("mem-token");
    expect(r2.accessToken).toBe("mem-token");
    expect(mockFetch).toHaveBeenCalledOnce();
  });

  it("KV binding がある場合は KV にキャッシュを保存する", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: "kv-token", expires_in: 3600 }),
      text: async () => "",
    });
    vi.stubGlobal("fetch", mockFetch);

    const kv = createMockKV();
    const env = { GOOGLE_SERVICE_ACCOUNT_JSON: TEST_SA_JSON, SHEETS_TOKEN_CACHE: kv };
    const result = await getAccessToken(env);

    expect(result.accessToken).toBe("kv-token");
    expect(kv.put).toHaveBeenCalledOnce();
    expect(vi.mocked(kv.put).mock.calls[0]?.[0]).toMatch(/^sheets_access_token_[a-f0-9]{16}$/);
  });

  it("Service Account ごとに KV cache key を分離する", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: "kv-token", expires_in: 3600 }),
      text: async () => "",
    });
    vi.stubGlobal("fetch", mockFetch);

    const kv = createMockKV();
    const firstEnv = { GOOGLE_SERVICE_ACCOUNT_JSON: TEST_SA_JSON, SHEETS_TOKEN_CACHE: kv };
    const secondEnv = {
      GOOGLE_SERVICE_ACCOUNT_JSON: JSON.stringify({
        ...JSON.parse(TEST_SA_JSON),
        client_email: "other@test-project.iam.gserviceaccount.com",
      }),
      SHEETS_TOKEN_CACHE: kv,
    };

    await getAccessToken(firstEnv);
    await getAccessToken(secondEnv);

    const firstKey = vi.mocked(kv.put).mock.calls[0]?.[0];
    const secondKey = vi.mocked(kv.put).mock.calls[1]?.[0];
    expect(firstKey).toMatch(/^sheets_access_token_[a-f0-9]{16}$/);
    expect(secondKey).toMatch(/^sheets_access_token_[a-f0-9]{16}$/);
    expect(firstKey).not.toBe(secondKey);
  });
});

describe("AUTH-06: secret redaction", () => {
  it("不正な JSON でエラーが発生しても秘密鍵が error message に含まれない", async () => {
    const env = { GOOGLE_SERVICE_ACCOUNT_JSON: '{"broken":true}' };
    let caught: Error | null = null;
    try {
      await getAccessToken(env);
    } catch (e) {
      caught = e as Error;
    }
    expect(caught).toBeInstanceOf(SheetsAuthError);
    expect(caught?.message).not.toContain("BEGIN PRIVATE KEY");
    expect(caught?.message).not.toContain("ya29.");
  });

  it("token endpoint エラーで access_token が error message に含まれない", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => "Forbidden",
    }));

    const env = { GOOGLE_SERVICE_ACCOUNT_JSON: TEST_SA_JSON };
    let caught: Error | null = null;
    try {
      await getAccessToken(env);
    } catch (e) {
      caught = e as Error;
    }
    expect(caught).toBeInstanceOf(SheetsAuthError);
    expect(caught?.message).not.toContain("ya29.");
    expect(caught?.message).not.toContain("BEGIN PRIVATE KEY");
    expect(caught?.message).not.toContain("Forbidden");
  });

  it("Service Account JSON の必須フィールド欠落を設定エラーとして扱う", async () => {
    const env = { GOOGLE_SERVICE_ACCOUNT_JSON: JSON.stringify({ type: "service_account" }) };
    await expect(getAccessToken(env)).rejects.toThrow(SheetsAuthError);
    await expect(getAccessToken(env)).rejects.toThrow("missing");
  });
});
