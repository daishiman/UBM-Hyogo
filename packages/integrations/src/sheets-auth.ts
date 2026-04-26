/** Cloudflare Workers の env bindings から注入される型 */
export interface SheetsTokenCache {
  get<T = unknown>(key: string, type: "json"): Promise<T | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

export interface SheetsAuthEnv {
  GOOGLE_SERVICE_ACCOUNT_JSON: string;
  SHEETS_TOKEN_CACHE?: SheetsTokenCache;
}

/** Service Account JSON key のパース済み型 */
export interface ServiceAccountKey {
  type: "service_account";
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  token_uri: string;
}

/** getAccessToken の戻り値 */
export interface AccessTokenResult {
  accessToken: string;
  expiresAt: number;
}

/** sheets-auth モジュール固有のエラークラス */
export class SheetsAuthError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "SheetsAuthError";
  }
}

const SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const CACHE_KEY_PREFIX = "sheets_access_token";
const CACHE_MARGIN_SEC = 60;

/** module-scoped in-memory キャッシュ（KV binding がない場合の fallback） */
let memoryCache: AccessTokenResult | null = null;

/** PEM 形式の RSA 秘密鍵を Web Crypto API でインポートする */
export async function importPrivateKey(pemKey: string): Promise<CryptoKey> {
  const pem = pemKey
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");

  let binary: string;
  try {
    binary = atob(pem);
  } catch (err) {
    throw new SheetsAuthError("Failed to import private key", err);
  }

  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    buffer[i] = binary.charCodeAt(i);
  }

  try {
    return await crypto.subtle.importKey(
      "pkcs8",
      buffer.buffer,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"],
    );
  } catch (err) {
    throw new SheetsAuthError("Failed to import private key", err);
  }
}

/** base64url エンコード */
function base64url(data: string | ArrayBuffer): string {
  let str: string;
  if (typeof data === "string") {
    str = btoa(data);
  } else {
    const bytes = new Uint8Array(data);
    let binary = "";
    for (const b of bytes) {
      binary += String.fromCharCode(b);
    }
    str = btoa(binary);
  }
  return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function createCacheKey(sa: ServiceAccountKey): Promise<string> {
  const stableKeySource = sa.client_email || sa.private_key_id;
  const hash = await sha256Hex(stableKeySource);
  return `${CACHE_KEY_PREFIX}_${hash.slice(0, 16)}`;
}

/** JWT assertion を生成し RS256 で署名する */
export async function createSignedJWT(
  key: CryptoKey,
  payload: Record<string, unknown>,
): Promise<string> {
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const body = base64url(JSON.stringify(payload));
  const signingInput = `${header}.${body}`;

  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    encoder.encode(signingInput),
  );

  return `${signingInput}.${base64url(signature)}`;
}

/** Service Account JSON をパースする */
function parseServiceAccountKey(json: string): ServiceAccountKey {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new SheetsAuthError("Invalid GOOGLE_SERVICE_ACCOUNT_JSON: parse failed");
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new SheetsAuthError("Invalid GOOGLE_SERVICE_ACCOUNT_JSON: not a service_account key");
  }

  const candidate = parsed as Partial<ServiceAccountKey>;
  if (candidate.type !== "service_account") {
    throw new SheetsAuthError("Invalid GOOGLE_SERVICE_ACCOUNT_JSON: not a service_account key");
  }

  const requiredFields: Array<keyof ServiceAccountKey> = [
    "project_id",
    "private_key_id",
    "private_key",
    "client_email",
    "token_uri",
  ];
  const missing = requiredFields.filter((field) => typeof candidate[field] !== "string" || candidate[field] === "");
  if (missing.length > 0) {
    throw new SheetsAuthError(`Invalid GOOGLE_SERVICE_ACCOUNT_JSON: missing ${missing.join(", ")}`);
  }

  return candidate as ServiceAccountKey;
}

/** Google OAuth 2.0 Token Endpoint からアクセストークンを取得する */
async function fetchNewToken(env: SheetsAuthEnv): Promise<AccessTokenResult> {
  const sa = parseServiceAccountKey(env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const key = await importPrivateKey(sa.private_key);

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: sa.client_email,
    scope: SCOPE,
    aud: TOKEN_ENDPOINT,
    iat: now,
    exp: now + 3600,
  };

  const jwt = await createSignedJWT(key, payload);

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  if (!res.ok) {
    throw new SheetsAuthError(`Token endpoint returned ${res.status}`);
  }

  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) {
    throw new SheetsAuthError("Missing access_token in response");
  }

  return {
    accessToken: data.access_token,
    expiresAt: now + (data.expires_in ?? 3600),
  };
}

/**
 * Google Sheets API v4 用アクセストークンを取得する。
 * キャッシュが有効（残り TTL > 60s）の場合はキャッシュから返す。
 */
export async function getAccessToken(env: SheetsAuthEnv): Promise<AccessTokenResult> {
  const now = Math.floor(Date.now() / 1000);
  const serviceAccountKey = parseServiceAccountKey(env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const cacheKey = await createCacheKey(serviceAccountKey);

  // KV キャッシュを優先
  if (env.SHEETS_TOKEN_CACHE) {
    const cached = await env.SHEETS_TOKEN_CACHE.get(cacheKey, "json") as AccessTokenResult | null;
    if (cached && cached.expiresAt > now + CACHE_MARGIN_SEC) {
      return cached;
    }
  } else if (memoryCache && memoryCache.expiresAt > now + CACHE_MARGIN_SEC) {
    return memoryCache;
  }

  const result = await fetchNewToken(env);

  if (env.SHEETS_TOKEN_CACHE) {
    await env.SHEETS_TOKEN_CACHE.put(cacheKey, JSON.stringify(result), {
      expirationTtl: result.expiresAt - now,
    });
  } else {
    memoryCache = result;
  }

  return result;
}

/** テスト用: in-memory キャッシュをリセットする */
export function _resetMemoryCache(): void {
  memoryCache = null;
}
