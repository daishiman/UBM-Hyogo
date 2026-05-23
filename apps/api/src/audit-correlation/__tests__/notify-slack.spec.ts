import { describe, expect, it } from 'vitest';
import { buildSlackPayload, notifyHighFindingsToSlack } from '../notify-slack';
import type { CorrelatedFinding, FingerprintHash, NormalizedAuditEvent } from '../types';

const fp = ('deadbeef' + 'c'.repeat(56)) as FingerprintHash;
const event: NormalizedAuditEvent = {
  fingerprintHash: fp,
  fingerprintVersion: 1,
  source: 'github',
  eventType: 'org.update_member',
  occurredAt: 1_700_000_000_000,
  actorDomain: 'example.com',
  ipPrefix: '203.0.113.0/24',
  userAgentBucket: 'firefox',
};
const high: CorrelatedFinding = {
  correlationKey: { fingerprintHash: fp, fingerprintVersion: 1 },
  events: [event],
  severity: 'HIGH',
  reason: 'cross-source security signal with IP prefix change within 5 minutes',
};

describe('buildSlackPayload — redact-safe contract', () => {
  const payload = buildSlackPayload(high, {
    runbookBaseUrl: 'https://runbook.example.com/audit',
    environment: 'staging',
  });
  const serialized = JSON.stringify(payload);

  it('contains fingerprint prefix only (8 chars), not full hash', () => {
    expect(serialized).toContain('deadbeef');
    expect(serialized).not.toContain(fp);
  });
  it('contains redact-safe fields', () => {
    expect(serialized).toContain('example.com');
    expect(serialized).toContain('203.0.113.0/24');
    expect(serialized).toContain('firefox');
    expect(serialized).toContain('staging');
  });
  it('does not contain webhook URL or salt or PAT-like strings', () => {
    expect(serialized).not.toContain('hooks.slack.com');
    expect(serialized).not.toMatch(/ghp_[A-Za-z0-9]{20,}/);
    expect(serialized).not.toMatch(/Bearer\s+[A-Za-z0-9]/);
  });
});

describe('notifyHighFindingsToSlack', () => {
  it('skips non-HIGH findings', async () => {
    const result = await notifyHighFindingsToSlack(
      [{ ...high, severity: 'LOW' }],
      {
        webhookUrl: 'https://hooks.slack.com/services/X/Y/Z',
        runbookBaseUrl: 'https://r.example/r',
        environment: 'staging',
        fetchImpl: async () => new Response('ok', { status: 200 }),
      },
    );
    expect(result).toEqual({ attempted: 0, succeeded: 0 });
  });

  it('posts only to webhook URL via fetch and does not echo URL into payload body', async () => {
    let capturedUrl = '';
    let capturedBody = '';
    const fetchImpl: typeof fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      capturedUrl = String(input);
      capturedBody = String(init?.body ?? '');
      return new Response('ok', { status: 200 });
    }) as typeof fetch;
    const result = await notifyHighFindingsToSlack([high], {
      webhookUrl: 'https://hooks.slack.com/services/X/Y/Z',
      runbookBaseUrl: 'https://r.example/r',
      environment: 'staging',
      fetchImpl,
    });
    expect(result).toEqual({ attempted: 1, succeeded: 1 });
    expect(capturedUrl).toBe('https://hooks.slack.com/services/X/Y/Z');
    expect(capturedBody).not.toContain('hooks.slack.com');
  });

  it('counts non-ok response as not succeeded but does not throw', async () => {
    const fetchImpl: typeof fetch = (async () =>
      new Response('rate limited', { status: 429 })) as typeof fetch;
    const result = await notifyHighFindingsToSlack([high], {
      webhookUrl: 'https://hooks.slack.com/services/X/Y/Z',
      runbookBaseUrl: 'https://r.example/r',
      environment: 'staging',
      fetchImpl,
    });
    expect(result.attempted).toBe(1);
    expect(result.succeeded).toBe(0);
  });
});
