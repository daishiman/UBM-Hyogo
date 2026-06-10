export interface ServiceBinding {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

export interface OgEnv {
  API_SERVICE?: ServiceBinding;
  NEXT_PUBLIC_API_BASE_URL?: string;
}

export interface MemberSummary {
  id: string;
  fullName: string;
  occupation?: string;
  ubmZone?: string | null;
  ubmMembershipType?: string | null;
}

interface PublicMemberProfileLike {
  memberId?: unknown;
  summary?: {
    fullName?: unknown;
    occupation?: unknown;
    ubmZone?: unknown;
    ubmMembershipType?: unknown;
  };
}

const REQUEST_TIMEOUT_MS = 2500;

function asOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function toMemberSummary(memberId: string, raw: unknown): MemberSummary | null {
  const profile = raw as PublicMemberProfileLike;
  const fullName = asOptionalString(profile.summary?.fullName);
  if (!fullName) return null;
  const occupation = asOptionalString(profile.summary?.occupation);

  return {
    id: asOptionalString(profile.memberId) ?? memberId,
    fullName,
    ...(occupation === undefined ? {} : { occupation }),
    ubmZone: asOptionalString(profile.summary?.ubmZone) ?? null,
    ubmMembershipType: asOptionalString(profile.summary?.ubmMembershipType) ?? null,
  };
}

function buildApiUrl(memberId: string, baseUrl: string): string {
  const base = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  return `${base}/public/members/${encodeURIComponent(memberId)}`;
}

async function fetchViaBinding(memberId: string, env: OgEnv): Promise<Response | null> {
  if (!env.API_SERVICE) return null;
  return env.API_SERVICE.fetch(
    new Request(`https://api.service.local/public/members/${encodeURIComponent(memberId)}`),
  );
}

async function fetchViaBaseUrl(
  memberId: string,
  env: OgEnv,
  fetchImpl: typeof fetch,
): Promise<Response | null> {
  const baseUrl = env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!baseUrl) return null;
  return fetchImpl(buildApiUrl(memberId, baseUrl), {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
}

export async function fetchMemberSummary(
  memberId: string,
  env: OgEnv,
  fetchImpl: typeof fetch = fetch,
): Promise<MemberSummary | null> {
  const normalizedId = memberId.trim();
  if (!normalizedId) return null;

  try {
    const response =
      (await fetchViaBinding(normalizedId, env)) ??
      (await fetchViaBaseUrl(normalizedId, env, fetchImpl));
    if (!response?.ok) return null;
    return toMemberSummary(normalizedId, await response.json());
  } catch {
    return null;
  }
}
