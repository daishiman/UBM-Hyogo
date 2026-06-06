export interface ApiTransportEnv {
  API_SERVICE?: { fetch: typeof fetch } | undefined;
  baseUrl?: string | undefined;
  environment?: "local" | "staging" | "production" | undefined;
  isTest?: boolean | undefined;
}

export type ApiTransport =
  | { kind: "service-binding"; fetch: typeof fetch }
  | { kind: "http"; baseUrl: string };

export const SERVICE_BINDING_ORIGIN = "https://service-binding.local";
// localhost-allow:local-fallback
export const LOCAL_API_FALLBACK_BASE_URL = "http://localhost:8787";

const trimTrailingSlash = (value: string): string => value.replace(/\/$/, "");

export function resolveApiFetch(env: ApiTransportEnv): ApiTransport {
  const baseUrl =
    typeof env.baseUrl === "string" && env.baseUrl.length > 0
      ? trimTrailingSlash(env.baseUrl)
      : undefined;

  if (env.isTest === true && baseUrl !== undefined) {
    return { kind: "http", baseUrl };
  }
  if (env.API_SERVICE !== undefined) {
    return { kind: "service-binding", fetch: env.API_SERVICE.fetch };
  }
  if (baseUrl !== undefined) {
    return { kind: "http", baseUrl };
  }
  if ((env.environment ?? "local") === "local") {
    return {
      kind: "http",
      // localhost-allow:local-fallback
      baseUrl: LOCAL_API_FALLBACK_BASE_URL,
    };
  }
  throw new Error(
    "resolveApiFetch: API transport unresolved (no API_SERVICE binding and no base URL) in non-local runtime",
  );
}

export async function fetchViaApiTransport(
  transport: ApiTransport,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (transport.kind === "service-binding") {
    return transport.fetch(`${SERVICE_BINDING_ORIGIN}${normalizedPath}`, init);
  }
  return fetch(`${transport.baseUrl}${normalizedPath}`, init);
}
