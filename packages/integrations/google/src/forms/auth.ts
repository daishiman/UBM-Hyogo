export interface ServiceAccountEnv {
  FORMS_SA_EMAIL: string;
  FORMS_SA_KEY: string;
}

export interface TokenSource {
  getAccessToken(): Promise<string>;
}

export const FORMS_SCOPE =
  "https://www.googleapis.com/auth/forms.body.readonly https://www.googleapis.com/auth/forms.responses.readonly";

export const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

export interface JwtSigner {
  sign(
    header: Record<string, unknown>,
    payload: Record<string, unknown>,
    privateKey: string,
  ): Promise<string>;
}

export interface AuthDeps {
  fetchImpl?: typeof fetch;
  signer: JwtSigner;
  now?: () => number;
  tokenEndpoint?: string;
  scope?: string;
}

interface CachedToken {
  token: string;
  expiresAt: number;
}

const CLOCK_SKEW_SEC = 30;

export function createTokenSource(
  env: ServiceAccountEnv,
  deps: AuthDeps,
): TokenSource {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const now = deps.now ?? (() => Math.floor(Date.now() / 1000));
  const tokenEndpoint = deps.tokenEndpoint ?? TOKEN_ENDPOINT;
  const scope = deps.scope ?? FORMS_SCOPE;
  let cache: CachedToken | null = null;

  return {
    async getAccessToken() {
      const current = now();
      if (cache && current < cache.expiresAt - CLOCK_SKEW_SEC) {
        return cache.token;
      }
      const issuedAt = current;
      const expiresAt = issuedAt + 3_600;
      const jwt = await deps.signer.sign(
        { alg: "RS256", typ: "JWT" },
        {
          iss: env.FORMS_SA_EMAIL,
          scope,
          aud: tokenEndpoint,
          iat: issuedAt,
          exp: expiresAt,
        },
        env.FORMS_SA_KEY,
      );
      const body = new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      });
      const res = await fetchImpl(tokenEndpoint, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body,
      });
      if (!res.ok) {
        throw new Error(
          `forms-auth: token endpoint returned ${res.status} ${res.statusText}`,
        );
      }
      const json = (await res.json()) as {
        access_token?: string;
        expires_in?: number;
      };
      if (!json.access_token) {
        throw new Error("forms-auth: response missing access_token");
      }
      cache = {
        token: json.access_token,
        expiresAt: now() + (json.expires_in ?? 3_600),
      };
      return cache.token;
    },
  };
}
