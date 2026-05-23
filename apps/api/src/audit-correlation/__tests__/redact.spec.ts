import { describe, expect, it } from 'vitest';
import { FingerprintInputEmptyError } from '../errors';
import {
  bucketUserAgent,
  computeFingerprint,
  normalizeEmail,
  redactCloudflare,
  redactGitHub,
  truncateIp,
} from '../redact';
import type { RawCloudflareAuditEvent, RawGitHubAuditEvent } from '../types';

const SALT_A = 'salt-a';
const SALT_B = 'salt-b';

describe('normalizeEmail', () => {
  it('splits local-part and domain, lowercases', () => {
    expect(normalizeEmail('Foo.Bar@Example.COM')).toEqual({
      localPart: 'foo.bar',
      domain: 'example.com',
    });
  });
  it('returns empty when undefined', () => {
    expect(normalizeEmail(undefined)).toEqual({});
  });
});

describe('truncateIp', () => {
  it('truncates IPv4 to /24', () => {
    expect(truncateIp('192.0.2.45')).toBe('192.0.2.0/24');
  });
  it('truncates IPv6 to /48', () => {
    expect(truncateIp('2001:db8:abcd:1234:5678::1')).toBe('2001:db8:abcd::/48');
  });
  it('rejects malformed IPv4', () => {
    expect(truncateIp('not-an-ip')).toBeUndefined();
  });
});

describe('bucketUserAgent', () => {
  it('labels chrome / firefox / safari', () => {
    expect(bucketUserAgent('Mozilla/5.0 Chrome/120.0')).toBe('chrome');
    expect(bucketUserAgent('Mozilla/5.0 Firefox/115.0')).toBe('firefox');
    expect(bucketUserAgent('Mozilla/5.0 Safari/600')).toBe('safari');
  });
  it('labels gha-runner', () => {
    expect(bucketUserAgent('GHA-Runner/2.300.0')).toBe('gha-runner');
  });
  it('labels other for unknown', () => {
    expect(bucketUserAgent('totally-unknown-ua')).toBe('other');
  });
});

describe('computeFingerprint (TC-RED-01..03)', () => {
  it('TC-RED-01: deterministic with same input + salt', async () => {
    const a = await computeFingerprint({ emailLocalPart: 'foo', ipPrefix: '10.0.0.0/24' }, SALT_A);
    const b = await computeFingerprint({ emailLocalPart: 'foo', ipPrefix: '10.0.0.0/24' }, SALT_A);
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });
  it('TC-RED-02: different salt → different hash', async () => {
    const a = await computeFingerprint({ emailLocalPart: 'foo' }, SALT_A);
    const b = await computeFingerprint({ emailLocalPart: 'foo' }, SALT_B);
    expect(a).not.toBe(b);
  });
  it('TC-RED-03: all undefined → throws', async () => {
    await expect(computeFingerprint({}, SALT_A)).rejects.toBeInstanceOf(FingerprintInputEmptyError);
  });
});

describe('redactGitHub (TC-RED-04, TC-RED-05)', () => {
  const ev: RawGitHubAuditEvent = {
    action: 'org.update_member',
    actor: 'attacker-login',
    actor_ip: '203.0.113.45',
    user_agent: 'Mozilla/5.0 Chrome/120.0',
    created_at: 1_700_000_000_000,
    org: 'daishiman',
    external_identity_nameid: 'Bob.Smith@example.com',
  };
  it('TC-RED-04: actor_ip full string is not in output', async () => {
    const out = await redactGitHub(ev, { salt: SALT_A });
    const json = JSON.stringify(out);
    expect(json).not.toContain('203.0.113.45');
    expect(out.ipPrefix).toBe('203.0.113.0/24');
  });
  it('TC-RED-05: user_agent full string is not in output', async () => {
    const out = await redactGitHub(ev, { salt: SALT_A });
    const json = JSON.stringify(out);
    expect(json).not.toContain('Mozilla/5.0 Chrome/120.0');
    expect(out.userAgentBucket).toBe('chrome');
  });
  it('keeps actorDomain only, hashes local-part', async () => {
    const out = await redactGitHub(ev, { salt: SALT_A });
    expect(out.actorDomain).toBe('example.com');
    const json = JSON.stringify(out);
    expect(json).not.toContain('Bob.Smith');
    expect(json).not.toContain('bob.smith');
  });
});

describe('redactCloudflare (TC-RED-06)', () => {
  const ev: RawCloudflareAuditEvent = {
    action: { type: 'login_fail' },
    actor: { email: 'Alice@example.com', ip: '198.51.100.7' },
    when: '2026-05-07T10:00:00Z',
    user_agent: 'curl/8.5',
  };
  it('TC-RED-06: full email not in output, domain preserved', async () => {
    const out = await redactCloudflare(ev, { salt: SALT_A });
    const json = JSON.stringify(out);
    expect(json).not.toContain('Alice@example.com');
    expect(json).not.toContain('alice');
    expect(out.actorDomain).toBe('example.com');
    expect(out.userAgentBucket).toBe('curl');
    expect(out.ipPrefix).toBe('198.51.100.0/24');
    expect(out.occurredAt).toBe(Date.parse('2026-05-07T10:00:00Z'));
  });
});
