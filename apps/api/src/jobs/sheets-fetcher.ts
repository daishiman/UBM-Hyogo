// UT-09: Google Sheets API v4 (spreadsheets.values.get) を Service Account JWT で呼び出す。
// Workers ランタイム前提のため fetch + WebCrypto を使用。googleapis SDK は導入しない。

export interface SheetsValueRange {
  readonly range: string;
  readonly majorDimension?: string;
  readonly values?: string[][];
}

export interface ServiceAccountCredentials {
  readonly client_email: string;
  readonly private_key: string;
  readonly token_uri?: string;
}

export interface SheetsFetcher {
  fetchRange(range: string): Promise<SheetsValueRange>;
}

export interface SheetsFetcherOptions {
  readonly spreadsheetId: string;
  readonly serviceAccountJson: string;
  readonly fetchImpl?: typeof fetch;
}

export class GoogleSheetsFetcher implements SheetsFetcher {
  private readonly credentials: ServiceAccountCredentials;
  private readonly fetchImpl: typeof fetch;
  private cachedToken: { token: string; expiresAt: number } | null = null;

  constructor(private readonly options: SheetsFetcherOptions) {
    this.credentials = JSON.parse(
      options.serviceAccountJson,
    ) as ServiceAccountCredentials;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async fetchRange(range: string): Promise<SheetsValueRange> {
    const token = await this.getAccessToken();
    const url = new URL(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
        this.options.spreadsheetId,
      )}/values/${encodeURIComponent(range)}`,
    );
    const res = await this.fetchImpl(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const body = await safeReadBody(res);
      throw new SheetsFetchError(
        `Sheets API ${res.status}: ${body}`,
        res.status,
      );
    }
    return (await res.json()) as SheetsValueRange;
  }

  private async getAccessToken(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    if (this.cachedToken && this.cachedToken.expiresAt - 60 > now) {
      return this.cachedToken.token;
    }
    const tokenUri =
      this.credentials.token_uri ?? "https://oauth2.googleapis.com/token";
    const assertion = await signServiceAccountJwt(this.credentials, now);
    const body = new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    });
    const res = await this.fetchImpl(tokenUri, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) {
      const body = await safeReadBody(res);
      throw new SheetsFetchError(
        `OAuth token ${res.status}: ${body}`,
        res.status,
      );
    }
    const json = (await res.json()) as { access_token: string; expires_in: number };
    this.cachedToken = {
      token: json.access_token,
      expiresAt: now + json.expires_in,
    };
    return json.access_token;
  }
}

export class SheetsFetchError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "SheetsFetchError";
  }
}

async function safeReadBody(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "<unreadable>";
  }
}

async function signServiceAccountJwt(
  credentials: ServiceAccountCredentials,
  now: number,
): Promise<string> {
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: credentials.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
    aud:
      credentials.token_uri ?? "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const enc = (obj: unknown): string => base64UrlEncode(JSON.stringify(obj));
  const signingInput = `${enc(header)}.${enc(claims)}`;
  const key = await importPkcs8(credentials.private_key);
  const sig = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    key,
    new TextEncoder().encode(signingInput),
  );
  return `${signingInput}.${base64UrlEncodeBytes(new Uint8Array(sig))}`;
}

async function importPkcs8(pem: string): Promise<CryptoKey> {
  const normalized = pem.replace(/\\n/g, "\n");
  const body = normalized
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const der = base64ToBytes(body);
  return crypto.subtle.importKey(
    "pkcs8",
    der.buffer.slice(der.byteOffset, der.byteOffset + der.byteLength) as ArrayBuffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

function base64UrlEncode(text: string): string {
  return base64UrlEncodeBytes(new TextEncoder().encode(text));
}

function base64UrlEncodeBytes(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// 1000行超対応: A1 range を行範囲で分割する単純な builder
export function buildA1Ranges(
  sheetName: string,
  totalRows: number,
  chunkRows: number,
  startRow = 2,
): string[] {
  const ranges: string[] = [];
  for (let r = startRow; r <= totalRows; r += chunkRows) {
    const end = Math.min(totalRows, r + chunkRows - 1);
    ranges.push(`${sheetName}!A${r}:ZZ${end}`);
  }
  return ranges;
}
