import { AuditFetchAuthError, AuditFetchRateLimitError } from './errors';
import type { GitHubFetchOpts, RawGitHubAuditEvent } from './types';

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_BASE_BACKOFF_MS = 1000;

function parseNextLink(link: string | null): string | null {
  if (!link) return null;
  const parts = link.split(',');
  for (const part of parts) {
    const m = part.match(/<([^>]+)>;\s*rel="next"/);
    if (m) return m[1];
  }
  return null;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  pat: string,
  fetchImpl: typeof fetch,
  maxRetries: number,
  baseBackoffMs: number,
): Promise<Response> {
  let attempt = 0;
  // PAT は error / log に絶対に含めない
  while (true) {
    const res = await fetchImpl(url, {
      headers: {
        Authorization: `token ${pat}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'ubm-hyogo-audit/1.0',
      },
    });
    if (res.status === 401 || res.status === 403) {
      throw new AuditFetchAuthError(res.status);
    }
    if (res.status === 429) {
      if (attempt >= maxRetries) {
        throw new AuditFetchRateLimitError(`GitHub audit fetch rate limited (max retries=${maxRetries})`);
      }
      const retryAfter = Number(res.headers.get('retry-after'));
      const backoff = Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : baseBackoffMs * 2 ** attempt;
      attempt += 1;
      await delay(backoff);
      continue;
    }
    if (!res.ok) {
      throw new Error(`GitHub audit fetch failed: status=${res.status}`);
    }
    return res;
  }
}

export async function fetchGitHubAuditEvents(
  opts: GitHubFetchOpts,
): Promise<ReadonlyArray<RawGitHubAuditEvent>> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const maxRetries = opts.maxRetries ?? DEFAULT_MAX_RETRIES;
  const baseBackoffMs = opts.baseBackoffMs ?? DEFAULT_BASE_BACKOFF_MS;

  const sinceIso = opts.since.toISOString();
  const untilIso = opts.until.toISOString();
  const phrase = encodeURIComponent(`created:${sinceIso}..${untilIso}`);
  let url: string | null =
    `https://api.github.com/orgs/${encodeURIComponent(opts.orgSlug)}/audit-log?per_page=100&phrase=${phrase}`;

  const all: RawGitHubAuditEvent[] = [];
  while (url) {
    const res = await fetchWithRetry(url, opts.pat, fetchImpl, maxRetries, baseBackoffMs);
    const body = (await res.json()) as ReadonlyArray<RawGitHubAuditEvent>;
    if (!Array.isArray(body)) {
      throw new Error('GitHub audit fetch: unexpected response shape');
    }
    all.push(...body);
    url = parseNextLink(res.headers.get('link'));
  }
  return all;
}
