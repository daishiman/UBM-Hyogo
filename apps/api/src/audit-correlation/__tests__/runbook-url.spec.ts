import { describe, expect, it } from 'vitest';
import { buildRunbookUrl, pickRunbookAnchor } from '../runbook-url';
import type { CorrelatedFinding, FingerprintHash, NormalizedAuditEvent } from '../types';

const fp = 'a'.repeat(64) as FingerprintHash;
const baseEvent = {
  fingerprintHash: fp,
  fingerprintVersion: 1 as const,
  occurredAt: 1_700_000_000_000,
};

function finding(events: ReadonlyArray<NormalizedAuditEvent>, severity: 'LOW' | 'MEDIUM' | 'HIGH'): CorrelatedFinding {
  return {
    correlationKey: { fingerprintHash: fp, fingerprintVersion: 1 },
    events,
    severity,
    reason: 'test',
  };
}

describe('runbook-url', () => {
  it('HIGH + perm change => permission-change-with-ip-shift', () => {
    const f = finding(
      [{ ...baseEvent, source: 'github', eventType: 'org.update_member' }],
      'HIGH',
    );
    expect(pickRunbookAnchor(f)).toBe('permission-change-with-ip-shift');
  });

  it('token_rotate without perm change => token-rotate-without-permission-change', () => {
    const f = finding(
      [{ ...baseEvent, source: 'cloudflare', eventType: 'token_rotate' }],
      'MEDIUM',
    );
    expect(pickRunbookAnchor(f)).toBe('token-rotate-without-permission-change');
  });

  it('login_fail => login-fail-burst', () => {
    const f = finding(
      [{ ...baseEvent, source: 'cloudflare', eventType: 'login_fail' }],
      'LOW',
    );
    expect(pickRunbookAnchor(f)).toBe('login-fail-burst');
  });

  it('buildRunbookUrl strips trailing slashes / fragments and appends anchor', () => {
    expect(buildRunbookUrl('https://example.com/runbook/', 'login-fail-burst')).toBe(
      'https://example.com/runbook#login-fail-burst',
    );
    expect(buildRunbookUrl('https://example.com/runbook#old', 'unknown')).toBe(
      'https://example.com/runbook#unknown',
    );
  });
});
