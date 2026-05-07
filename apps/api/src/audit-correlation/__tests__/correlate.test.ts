import { describe, expect, it } from 'vitest';
import { correlate } from '../correlate';
import { computeFingerprint } from '../redact';
import type { FingerprintHash, NormalizedAuditEvent } from '../types';

const SALT = 'test-salt';

async function fp(seed: string): Promise<FingerprintHash> {
  return computeFingerprint({ emailLocalPart: seed }, SALT);
}

function ev(over: Partial<NormalizedAuditEvent> & Pick<NormalizedAuditEvent, 'fingerprintHash' | 'source' | 'eventType' | 'occurredAt'>): NormalizedAuditEvent {
  return {
    fingerprintVersion: 1,
    actorDomain: over.actorDomain,
    ipPrefix: over.ipPrefix,
    userAgentBucket: over.userAgentBucket,
    ...over,
  };
}

describe('correlate (TC-RED-07,08,11)', () => {
  it('TC-RED-07: same fingerprint → 1 group', async () => {
    const h = await fp('shared');
    const gh: NormalizedAuditEvent[] = [
      ev({ fingerprintHash: h, source: 'github', eventType: 'workflows.completed_workflow_run', occurredAt: 1000 }),
    ];
    const cf: NormalizedAuditEvent[] = [
      ev({ fingerprintHash: h, source: 'cloudflare', eventType: 'login_fail', occurredAt: 2000 }),
    ];
    const result = correlate(gh, cf);
    expect(result.length).toBe(1);
    expect(result[0].events.length).toBe(2);
    expect(result[0].events[0].occurredAt).toBe(1000);
    expect(result[0].events[1].occurredAt).toBe(2000);
  });

  it('TC-RED-08: different fingerprints → separate groups', async () => {
    const h1 = await fp('a');
    const h2 = await fp('b');
    const result = correlate(
      [ev({ fingerprintHash: h1, source: 'github', eventType: 'org.update_member', occurredAt: 100 })],
      [ev({ fingerprintHash: h2, source: 'cloudflare', eventType: 'login_fail', occurredAt: 200 })],
    );
    expect(result.length).toBe(2);
  });

  it('TC-RED-11: cross-source permission change with IP shift within 5min → HIGH', async () => {
    const h = await fp('attacker');
    const t = 1_700_000_000_000;
    const gh: NormalizedAuditEvent[] = [
      ev({
        fingerprintHash: h,
        source: 'github',
        eventType: 'org.update_member',
        occurredAt: t,
        ipPrefix: '203.0.113.0/24',
      }),
    ];
    const cf: NormalizedAuditEvent[] = [
      ev({
        fingerprintHash: h,
        source: 'cloudflare',
        eventType: 'login_fail',
        occurredAt: t + 60_000,
        ipPrefix: '198.51.100.0/24',
      }),
    ];
    const result = correlate(gh, cf);
    expect(result[0].severity).toBe('HIGH');
    expect(result[0].reason).toContain('IP prefix change');
  });

  it('does not use an old different-IP event outside the 5min pair window for HIGH', async () => {
    const h = await fp('attacker');
    const t = 1_700_000_000_000;
    const result = correlate(
      [
        ev({
          fingerprintHash: h,
          source: 'github',
          eventType: 'org.update_member',
          occurredAt: t,
          ipPrefix: '203.0.113.0/24',
        }),
      ],
      [
        ev({
          fingerprintHash: h,
          source: 'cloudflare',
          eventType: 'login_fail',
          occurredAt: t + 60_000,
          ipPrefix: '203.0.113.0/24',
        }),
        ev({
          fingerprintHash: h,
          source: 'cloudflare',
          eventType: 'login_fail',
          occurredAt: t - 10 * 60_000,
          ipPrefix: '198.51.100.0/24',
        }),
      ],
    );
    expect(result[0].severity).toBe('MEDIUM');
    expect(result[0].reason).toContain('without paired IP prefix shift');
  });

  it('single-source permission change → MEDIUM', async () => {
    const h = await fp('solo');
    const result = correlate(
      [ev({ fingerprintHash: h, source: 'github', eventType: 'org.update_member', occurredAt: 1 })],
      [],
    );
    expect(result[0].severity).toBe('MEDIUM');
  });

  it('no permission change → LOW', async () => {
    const h = await fp('benign');
    const result = correlate(
      [ev({ fingerprintHash: h, source: 'github', eventType: 'workflows.completed_workflow_run', occurredAt: 1 })],
      [],
    );
    expect(result[0].severity).toBe('LOW');
  });

  it('empty inputs → empty result', () => {
    expect(correlate([], [])).toEqual([]);
  });
});
