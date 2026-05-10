import { describe, expect, it, vi } from 'vitest';
import { AuditFetchAuthError, AuditFetchRateLimitError } from '../errors';
import { fetchGitHubAuditEvents } from '../github-fetch';

function jsonResponse(body: unknown, init?: { status?: number; link?: string; retryAfter?: string }): Response {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (init?.link) headers.link = init.link;
  if (init?.retryAfter) headers['retry-after'] = init.retryAfter;
  return new Response(JSON.stringify(body), { status: init?.status ?? 200, headers });
}

describe('fetchGitHubAuditEvents (TC-RED-09, TC-RED-10)', () => {
  it('TC-RED-09: 401 → AuditFetchAuthError', async () => {
    const fetchImpl = vi.fn(async () => new Response('{}', { status: 401 }));
    await expect(
      fetchGitHubAuditEvents({
        since: new Date(0),
        until: new Date(1000),
        orgSlug: 'daishiman',
        pat: 'ghp_DUMMY',
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toBeInstanceOf(AuditFetchAuthError);
    // PAT は error message に絶対に含まれない
    try {
      await fetchGitHubAuditEvents({
        since: new Date(0),
        until: new Date(1000),
        orgSlug: 'daishiman',
        pat: 'ghp_DUMMY',
        fetchImpl: fetchImpl as unknown as typeof fetch,
      });
    } catch (e) {
      expect(String(e)).not.toContain('ghp_DUMMY');
    }
  });

  it('TC-RED-10: 429 → backoff → success', async () => {
    let call = 0;
    const fetchImpl = vi.fn(async () => {
      call += 1;
      if (call === 1) return jsonResponse({}, { status: 429, retryAfter: '0' });
      return jsonResponse([{ action: 'a', actor: 'x', created_at: 1, org: 'o' }]);
    });
    const result = await fetchGitHubAuditEvents({
      since: new Date(0),
      until: new Date(1000),
      orgSlug: 'daishiman',
      pat: 'ghp_DUMMY',
      fetchImpl: fetchImpl as unknown as typeof fetch,
      baseBackoffMs: 1,
      maxRetries: 3,
    });
    expect(result.length).toBe(1);
    expect(call).toBe(2);
  });

  it('429 over max retries → AuditFetchRateLimitError', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({}, { status: 429, retryAfter: '0' }));
    await expect(
      fetchGitHubAuditEvents({
        since: new Date(0),
        until: new Date(1000),
        orgSlug: 'daishiman',
        pat: 'ghp_DUMMY',
        fetchImpl: fetchImpl as unknown as typeof fetch,
        baseBackoffMs: 1,
        maxRetries: 1,
      }),
    ).rejects.toBeInstanceOf(AuditFetchRateLimitError);
  });

  it('follows pagination via Link rel=next', async () => {
    let call = 0;
    const fetchImpl = vi.fn(async () => {
      call += 1;
      if (call === 1) {
        return jsonResponse([{ action: 'a', actor: 'x', created_at: 1, org: 'o' }], {
          link: '<https://api.github.com/orgs/daishiman/audit-log?page=2>; rel="next"',
        });
      }
      return jsonResponse([{ action: 'b', actor: 'y', created_at: 2, org: 'o' }]);
    });
    const result = await fetchGitHubAuditEvents({
      since: new Date(0),
      until: new Date(1000),
      orgSlug: 'daishiman',
      pat: 'ghp_DUMMY',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(result.length).toBe(2);
    expect(call).toBe(2);
  });
});
