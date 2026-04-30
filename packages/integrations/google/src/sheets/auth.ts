import { z } from "zod";

export const DEFAULT_SHEETS_SCOPE =
  "https://www.googleapis.com/auth/spreadsheets.readonly";

export const DEFAULT_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

const CACHE_REFRESH_LEAD_SEC = 5 * 60;
const TOKEN_DEFAULT_TTL_SEC = 3600;

export interface SheetsAuthEnv {
  GOOGLE_SERVICE_ACCOUNT_JSON: string;
  SHEETS_SCOPES?: string;
}

export const ServiceAccountKeySchema = z.object({
  type: z.literal("service_account").optional(),
  client_email: z.string().min(1),
  private_key: z.string().min(1),
  token_uri: z.string().url().default(DEFAULT_TOKEN_ENDPOINT),
});

export type ServiceAccountKey = z.infer<typeof ServiceAccountKeySchema>;

export interface SheetsAccessToken {
  accessToken: string;
  expiresAt: number;
}

export interface JwtSigner {
  sign(
    header: Record<string, unknown>,
    payload: Record<string, unknown>,
    privateKeyPem: string,
  ): Promise<string>;
}

export interface SheetsAuthDeps {
  fetchImpl?: typeof fetch;
  signer?: JwtSigner;
  now?: () => number;
  scope?: string;
  tokenEndpoint?: string;
}

export interface SheetsTokenSource {
  getAccessToken(): Promise<SheetsAccessToken>;
}

export class SheetsAuthError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(redact(message));
    this.name = "SheetsAuthError";
  }
}

export function redact(s: string): string {
  return s
    .replace(
      /-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----/g,
      "[REDACTED]",
    )
    .replace(/"private_key":\s*"[^"]*"/g, '"private_key":"[REDACTED]"')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [REDACTED]");
}

export function redactToken(token: string): string {
  if (token.length <= 8) return "[REDACTED]";
  return `${token.slice(0, 4)}…[REDACTED]`;
}

export function parseServiceAccountJson(env: SheetsAuthEnv): ServiceAccountKey {
  let raw: unknown;
  try {
    raw = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON);
  } catch (cause) {
    throw new SheetsAuthError(
      "GOOGLE_SERVICE_ACCOUNT_JSON: invalid JSON",
      cause,
    );
  }
  const result = ServiceAccountKeySchema.safeParse(raw);
  if (!result.success) {
    throw new SheetsAuthError(
      `GOOGLE_SERVICE_ACCOUNT_JSON: missing/invalid fields (${result.error.issues.map((i) => i.path.join(".")).join(",")})`,
    );
  }
  return result.data;
}

function base64UrlEncode(bytes: Uint8Array | ArrayBuffer): string {
  const buf = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = "";
  for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
  return btoa(bin).replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function pemToPkcs8(pem: string): ArrayBuffer {
  const normalized = pem.replace(/\\n/g, "\n");
  const body = normalized
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  if (!body) {
    throw new SheetsAuthError("private_key: empty PEM body");
  }
  const bin = atob(body);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

export const webCryptoJwtSigner: JwtSigner = {
  async sign(header, payload, privateKeyPem) {
    let key: CryptoKey;
    try {
      key = await crypto.subtle.importKey(
        "pkcs8",
        pemToPkcs8(privateKeyPem),
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        false,
        ["sign"],
      );
    } catch (cause) {
      throw new SheetsAuthError("private_key: importKey failed", cause);
    }
    const headerB64 = base64UrlEncode(
      new TextEncoder().encode(JSON.stringify(header)),
    );
    const payloadB64 = base64UrlEncode(
      new TextEncoder().encode(JSON.stringify(payload)),
    );
    const signingInput = `${headerB64}.${payloadB64}`;
    const sig = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      key,
      new TextEncoder().encode(signingInput),
    );
    return `${signingInput}.${base64UrlEncode(sig)}`;
  },
};

export async function exchangeJwtForAccessToken(
  jwt: string,
  opts: {
    fetchImpl?: typeof fetch;
    tokenEndpoint?: string;
  } = {},
): Promise<{ access_token: string; expires_in: number }> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const endpoint = opts.tokenEndpoint ?? DEFAULT_TOKEN_ENDPOINT;
  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: jwt,
  });
  const res = await fetchImpl(endpoint, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new SheetsAuthError(
      `token endpoint returned ${res.status} ${res.statusText}`,
    );
  }
  const json = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
  };
  if (!json.access_token) {
    throw new SheetsAuthError("token endpoint response missing access_token");
  }
  return {
    access_token: json.access_token,
    expires_in: json.expires_in ?? TOKEN_DEFAULT_TTL_SEC,
  };
}

export function createSheetsTokenSource(
  env: SheetsAuthEnv,
  deps: SheetsAuthDeps = {},
): SheetsTokenSource {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const signer = deps.signer ?? webCryptoJwtSigner;
  const now = deps.now ?? (() => Math.floor(Date.now() / 1000));
  const scope = deps.scope ?? env.SHEETS_SCOPES ?? DEFAULT_SHEETS_SCOPE;
  const tokenEndpoint = deps.tokenEndpoint ?? DEFAULT_TOKEN_ENDPOINT;

  let cache: SheetsAccessToken | null = null;
  let inflight: Promise<SheetsAccessToken> | null = null;

  async function refresh(): Promise<SheetsAccessToken> {
    const sa = parseServiceAccountJson(env);
    const issuedAt = now();
    const expClaim = issuedAt + TOKEN_DEFAULT_TTL_SEC;
    const jwt = await signer.sign(
      { alg: "RS256", typ: "JWT" },
      {
        iss: sa.client_email,
        scope,
        aud: sa.token_uri ?? tokenEndpoint,
        iat: issuedAt,
        exp: expClaim,
      },
      sa.private_key,
    );
    const exchanged = await exchangeJwtForAccessToken(jwt, {
      fetchImpl,
      tokenEndpoint: sa.token_uri ?? tokenEndpoint,
    });
    const expiresAt = (now() + exchanged.expires_in) * 1000;
    cache = { accessToken: exchanged.access_token, expiresAt };
    return cache;
  }

  return {
    async getAccessToken() {
      const currentMs = now() * 1000;
      if (cache && currentMs < cache.expiresAt - CACHE_REFRESH_LEAD_SEC * 1000) {
        return cache;
      }
      if (inflight) return inflight;
      inflight = refresh().finally(() => {
        inflight = null;
      });
      return inflight;
    },
  };
}

const moduleSourceByJson = new Map<string, SheetsTokenSource>();

function moduleCacheKey(env: SheetsAuthEnv): string {
  return JSON.stringify({
    serviceAccountJson: env.GOOGLE_SERVICE_ACCOUNT_JSON,
    scopes: env.SHEETS_SCOPES ?? DEFAULT_SHEETS_SCOPE,
  });
}

export function getSheetsAccessToken(
  env: SheetsAuthEnv,
  deps?: SheetsAuthDeps,
): Promise<SheetsAccessToken> {
  if (deps) {
    return createSheetsTokenSource(env, deps).getAccessToken();
  }
  const keyed = moduleSourceByJson.get(moduleCacheKey(env));
  if (keyed) return keyed.getAccessToken();
  const created = createSheetsTokenSource(env);
  moduleSourceByJson.set(moduleCacheKey(env), created);
  return created.getAccessToken();
}
