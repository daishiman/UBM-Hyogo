import {
  PERMISSION_CHANGE_GITHUB_EVENTS,
  SECURITY_SIGNAL_CLOUDFLARE_EVENTS,
  type CorrelatedFinding,
  type FingerprintHash,
  type NormalizedAuditEvent,
  type Severity,
} from './types';

const HIGH_WINDOW_MS = 5 * 60 * 1000;

function isPermissionChange(ev: NormalizedAuditEvent): boolean {
  if (ev.source === 'github') return PERMISSION_CHANGE_GITHUB_EVENTS.has(ev.eventType);
  return ev.source === 'cloudflare' && ev.eventType === 'member_role_change';
}

function isSecuritySignal(ev: NormalizedAuditEvent): boolean {
  if (ev.source === 'github') return PERMISSION_CHANGE_GITHUB_EVENTS.has(ev.eventType);
  return SECURITY_SIGNAL_CLOUDFLARE_EVENTS.has(ev.eventType);
}

function hasCrossSourcePairWithIpShift(events: ReadonlyArray<NormalizedAuditEvent>): boolean {
  for (const left of events) {
    for (const right of events) {
      if (left.source === right.source) continue;
      if (!isSecuritySignal(left) || !isSecuritySignal(right)) continue;
      if (Math.abs(right.occurredAt - left.occurredAt) > HIGH_WINDOW_MS) continue;
      if (!left.ipPrefix || !right.ipPrefix || left.ipPrefix === right.ipPrefix) continue;
      return true;
    }
  }
  return false;
}

function evaluateSeverity(events: ReadonlyArray<NormalizedAuditEvent>): { severity: Severity; reason: string } {
  if (events.length === 0) return { severity: 'LOW', reason: 'no events' };
  const signalEvents = events.filter(isSecuritySignal);
  if (signalEvents.length === 0) {
    return { severity: 'LOW', reason: 'no security signal events' };
  }
  const sources = new Set(signalEvents.map((e) => e.source));
  if (sources.size >= 2) {
    if (hasCrossSourcePairWithIpShift(signalEvents)) {
      return {
        severity: 'HIGH',
        reason: 'cross-source security signal with IP prefix change within 5 minutes',
      };
    }
    return { severity: 'MEDIUM', reason: 'cross-source security signal without paired IP prefix shift' };
  }
  const permEvents = events.filter(isPermissionChange);
  if (permEvents.length === 0) return { severity: 'LOW', reason: 'single-source non-permission security signal' };
  return { severity: 'MEDIUM', reason: 'single-source permission change' };
}

export function correlate(
  github: ReadonlyArray<NormalizedAuditEvent>,
  cloudflare: ReadonlyArray<NormalizedAuditEvent>,
): ReadonlyArray<CorrelatedFinding> {
  if (github.length === 0 && cloudflare.length === 0) return [];
  const groups = new Map<FingerprintHash, NormalizedAuditEvent[]>();
  for (const ev of [...github, ...cloudflare]) {
    const key = ev.fingerprintHash;
    const list = groups.get(key);
    if (list) list.push(ev);
    else groups.set(key, [ev]);
  }
  const findings: CorrelatedFinding[] = [];
  for (const [hash, list] of groups) {
    const sorted = [...list].sort((a, b) => a.occurredAt - b.occurredAt);
    const { severity, reason } = evaluateSeverity(sorted);
    findings.push({
      correlationKey: { fingerprintHash: hash, fingerprintVersion: 1 },
      events: sorted,
      severity,
      reason,
    });
  }
  findings.sort((a, b) => {
    const order: Record<Severity, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    if (order[a.severity] !== order[b.severity]) return order[a.severity] - order[b.severity];
    return a.correlationKey.fingerprintHash.localeCompare(b.correlationKey.fingerprintHash);
  });
  return findings;
}
