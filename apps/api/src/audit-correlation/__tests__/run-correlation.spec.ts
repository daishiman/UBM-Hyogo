import { describe, expect, it } from 'vitest';
import { runCorrelation, AuditCorrelationEnvError, type AuditCorrelationRuntimeEnv } from '../run-correlation';

const baseEnv = (): AuditCorrelationRuntimeEnv => ({
  DB: {} as D1Database,
  GITHUB_AUDIT_PAT: 'ghp_dummy_test_value_xxxxxxxxxxxxxxxxxxxxxxxx',
  SLACK_AUDIT_INCIDENT_WEBHOOK_URL: 'https://hooks.slack.com/services/X/Y/Z',
  AUDIT_CORRELATION_SALT: 'a'.repeat(32),
  AUDIT_CORRELATION_INTERNAL_TOKEN: 't'.repeat(48),
  AUDIT_CORRELATION_RUNBOOK_BASE_URL: 'https://runbook.example/audit',
  AUDIT_CORRELATION_GITHUB_ORG: 'daishiman',
  ENVIRONMENT: 'staging',
});

describe('runCorrelation env validation', () => {
  it('throws AuditCorrelationEnvError when secret is missing', async () => {
    const env = { ...baseEnv(), GITHUB_AUDIT_PAT: '' } as AuditCorrelationRuntimeEnv;
    await expect(runCorrelation({ env })).rejects.toBeInstanceOf(AuditCorrelationEnvError);
  });

  it('throws when SALT shorter than 16 chars', async () => {
    const env = { ...baseEnv(), AUDIT_CORRELATION_SALT: 'short' } as AuditCorrelationRuntimeEnv;
    await expect(runCorrelation({ env })).rejects.toBeInstanceOf(AuditCorrelationEnvError);
  });

  it('throws when INTERNAL_TOKEN shorter than 32 chars', async () => {
    const env = { ...baseEnv(), AUDIT_CORRELATION_INTERNAL_TOKEN: 'short-token' } as AuditCorrelationRuntimeEnv;
    await expect(runCorrelation({ env })).rejects.toBeInstanceOf(AuditCorrelationEnvError);
  });
});

describe('runCorrelation orchestration (mocked GitHub fetch + D1 + Slack)', () => {
  it('returns counts when GitHub returns empty event list', async () => {
    const env = baseEnv();
    const fetchImpl: typeof fetch = (async () =>
      new Response('[]', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })) as typeof fetch;
    // D1 stub: prepare/bind/run no-op
    const db = {
      prepare: () => ({
        bind: () => ({
          all: async () => ({ results: [] }),
          run: async () => ({ meta: { changes: 0 } }),
        }),
      }),
    } as unknown as D1Database;
    const result = await runCorrelation({
      env: { ...env, DB: db },
      fetchImpl,
      now: () => new Date(1_700_000_000_000),
    });
    expect(result.fetched).toBe(0);
    expect(result.cloudflareLoaded).toBe(0);
    expect(result.correlated).toBe(0);
    expect(result.persisted).toBe(0);
    expect(result.notifiedHigh).toBe(0);
  });

  it('loads Cloudflare D1 rows and can produce cross-source HIGH findings', async () => {
    const t = 1_700_000_000_000;
    const fetchImpl: typeof fetch = (async () =>
      new Response(
        JSON.stringify([
          {
            action: 'org.update_member',
            actor: 'admin',
            actor_ip: '203.0.113.45',
            user_agent: 'Mozilla/5.0 Chrome/120',
            created_at: t,
            org: 'daishiman',
            external_identity_nameid: 'admin@example.com',
          },
        ]),
        { status: 200, headers: { 'content-type': 'application/json' } },
      )) as typeof fetch;
    const db = {
      prepare: (sql: string) => ({
        bind: (..._args: unknown[]) => ({
          all: async () => ({
            results: sql.includes('FROM cf_audit_log')
              ? [
                  {
                    occurred_at: new Date(t + 60_000).toISOString(),
                    actor_email: 'admin@example.com',
                    actor_ip: '198.51.100.10',
                    actor_ua: 'Mozilla/5.0 Firefox/120',
                    action_type: 'login_fail',
                    resource_type: null,
                    resource_id: null,
                  },
                ]
              : [],
          }),
          run: async () => ({ meta: { changes: 1 } }),
        }),
      }),
    } as unknown as D1Database;
    const slackCalls: string[] = [];
    const result = await runCorrelation({
      env: { ...baseEnv(), DB: db },
      fetchImpl: (async (input, init) => {
        if (String(input).startsWith('https://hooks.slack.com/')) {
          slackCalls.push(String(init?.body ?? ''));
          return new Response('ok', { status: 200 });
        }
        return fetchImpl(input, init);
      }) as typeof fetch,
      now: () => new Date(t + 2 * 60_000),
    });
    expect(result.fetched).toBe(1);
    expect(result.cloudflareLoaded).toBe(1);
    expect(result.correlated).toBe(1);
    expect(result.persisted).toBe(1);
    expect(result.notifiedHigh).toBe(1);
    expect(slackCalls[0]).toContain('HIGH');
  });
});
