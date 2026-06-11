export interface ApiTransportEnv {
  API_SERVICE?: { fetch: typeof fetch } | undefined;
  baseUrl?: string | undefined;
  environment?: "local" | "staging" | "production" | undefined;
  environmentExplicit?: boolean | undefined;
  isTest?: boolean | undefined;
}

export type ApiTransport =
  | { kind: "service-binding"; fetch: typeof fetch }
  | { kind: "http"; baseUrl: string };

export interface ApiTransportDescriptor {
  readonly transportKind: ApiTransport["kind"];
  readonly baseHost: string;
}

export const SERVICE_BINDING_ORIGIN = "https://service-binding.local";
// localhost-allow:local-fallback
export const LOCAL_API_FALLBACK_BASE_URL = "http://localhost:8787";

const trimTrailingSlash = (value: string): string => value.replace(/\/$/, "");

export function describeTransport(transport: ApiTransport): ApiTransportDescriptor {
  if (transport.kind === "service-binding") {
    return {
      transportKind: "service-binding",
      baseHost: new URL(SERVICE_BINDING_ORIGIN).host,
    };
  }

  return {
    transportKind: "http",
    baseHost: new URL(transport.baseUrl).host,
  };
}

export class ApiTransportError extends Error {
  readonly transport: ApiTransportDescriptor;
  constructor(message: string, transport: ApiTransportDescriptor, cause?: unknown) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "ApiTransportError";
    this.transport = transport;
  }
}

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
  if ((env.environment ?? "local") === "local" && env.environmentExplicit === true) {
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
  const descriptor = describeTransport(transport);
  try {
    if (transport.kind === "service-binding") {
      return await transport.fetch(`${SERVICE_BINDING_ORIGIN}${normalizedPath}`, init);
    }
    return await fetch(`${transport.baseUrl}${normalizedPath}`, init);
  } catch (error) {
    throw new ApiTransportError("API transport fetch failed", descriptor, error);
  }
}
