import { describe, expect, it } from 'vitest';
import { auditCorrelationRunRoute } from '../../routes/audit-correlation/run';

const TOKEN = 't'.repeat(48);

function makeEnv(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    DB: {
      prepare: () => ({
        bind: () => ({
          all: async () => ({ results: [] }),
          run: async () => ({ meta: { changes: 0 } }),
        }),
      }),
    },
    GITHUB_AUDIT_PAT: 'ghp_dummy_test_value_xxxxxxxxxxxxxxxxxxxxxxxx',
    SLACK_AUDIT_INCIDENT_WEBHOOK_URL: 'https://hooks.slack.com/services/X/Y/Z',
    AUDIT_CORRELATION_SALT: 'a'.repeat(32),
    AUDIT_CORRELATION_INTERNAL_TOKEN: TOKEN,
    AUDIT_CORRELATION_RUNBOOK_BASE_URL: 'https://runbook.example/audit',
    AUDIT_CORRELATION_GITHUB_ORG: 'daishiman',
    ENVIRONMENT: 'staging',
    ...overrides,
  };
}

describe('POST /run — internal token authz', () => {
  it('401 when authorization header missing', async () => {
    const res = await auditCorrelationRunRoute.request('/run', { method: 'POST' }, makeEnv());
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toBe('unauthorized');
  });

  it('401 when token does not match', async () => {
    const res = await auditCorrelationRunRoute.request(
      '/run',
      { method: 'POST', headers: { authorization: `Bearer ${'x'.repeat(48)}` } },
      makeEnv(),
    );
    expect(res.status).toBe(401);
  });

  it('401 when AUDIT_CORRELATION_INTERNAL_TOKEN is unset', async () => {
    const res = await auditCorrelationRunRoute.request(
      '/run',
      { method: 'POST', headers: { authorization: `Bearer ${TOKEN}` } },
      makeEnv({ AUDIT_CORRELATION_INTERNAL_TOKEN: '' }),
    );
    expect(res.status).toBe(401);
  });

  it('does not echo token / authorization header in response body', async () => {
    const res = await auditCorrelationRunRoute.request(
      '/run',
      { method: 'POST', headers: { authorization: `Bearer wrong-token-${TOKEN.slice(0, 8)}` } },
      makeEnv(),
    );
    expect(res.status).toBe(401);
    const text = await res.text();
    expect(text).not.toContain(TOKEN);
    expect(text).not.toContain('wrong-token');
  });

  it('200 with counts when token matches and GitHub returns empty list', async () => {
    const fetchImpl: typeof fetch = (async () =>
      new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } })) as typeof fetch;
    // 環境内の global fetch を上書きする代わりに、route が runCorrelation を呼ぶ前に
    // GitHub API を直接 mock するため、global fetch を一時的に差し替える。
    const original = globalThis.fetch;
    globalThis.fetch = fetchImpl;
    try {
      const res = await auditCorrelationRunRoute.request(
        '/run',
        { method: 'POST', headers: { authorization: `Bearer ${TOKEN}` } },
        makeEnv(),
      );
      expect(res.status).toBe(200);
      const body = (await res.json()) as { fetched: number; persisted: number; notifiedHigh: number };
      expect(body.fetched).toBe(0);
      expect(body).toMatchObject({ cloudflareLoaded: 0, correlated: 0 });
    } finally {
      globalThis.fetch = original;
    }
  });
});
