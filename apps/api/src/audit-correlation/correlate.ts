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

function eventHashes(ev: NormalizedAuditEvent): FingerprintHash[] {
  // dual-hash 期間中は fingerprintHashes.{v1,v2} 両方をキー候補として扱う。
  // legacy v1 record は fingerprintHashes 未設定のため fingerprintHash を v1 候補として扱う。
  const out = new Set<FingerprintHash>();
  out.add(ev.fingerprintHash);
  if (ev.fingerprintHashes?.v1) out.add(ev.fingerprintHashes.v1);
  if (ev.fingerprintHashes?.v2) out.add(ev.fingerprintHashes.v2);
  return Array.from(out);
}

function buildActorGroups(events: ReadonlyArray<NormalizedAuditEvent>): Map<FingerprintHash, NormalizedAuditEvent[]> {
  // Union-Find: hash → root hash で v1↔v2 を同一 actor に統合する。
  const parent = new Map<FingerprintHash, FingerprintHash>();
  const find = (h: FingerprintHash): FingerprintHash => {
    let cur = h;
    while (parent.get(cur) && parent.get(cur) !== cur) cur = parent.get(cur)!;
    parent.set(h, cur);
    return cur;
  };
  const union = (a: FingerprintHash, b: FingerprintHash): void => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(rb, ra);
  };
  for (const ev of events) {
    const hashes = eventHashes(ev);
    for (const h of hashes) if (!parent.has(h)) parent.set(h, h);
    for (let i = 1; i < hashes.length; i++) union(hashes[0], hashes[i]);
  }
  const groups = new Map<FingerprintHash, NormalizedAuditEvent[]>();
  for (const ev of events) {
    const root = find(eventHashes(ev)[0]);
    const list = groups.get(root);
    if (list) list.push(ev);
    else groups.set(root, [ev]);
  }
  return groups;
}

function canonicalCorrelationKey(events: ReadonlyArray<NormalizedAuditEvent>): {
  fingerprintHash: FingerprintHash;
  fingerprintVersion: 1 | 2;
} {
  const v2 = events.find((e) => e.fingerprintHashes?.v2)?.fingerprintHashes?.v2;
  if (v2) return { fingerprintHash: v2, fingerprintVersion: 2 };

  const v2Alias = events.find((e) => e.fingerprintVersion === 2)?.fingerprintHash;
  if (v2Alias) return { fingerprintHash: v2Alias, fingerprintVersion: 2 };

  return { fingerprintHash: eventHashes(events[0])[0], fingerprintVersion: 1 };
}

export function correlate(
  github: ReadonlyArray<NormalizedAuditEvent>,
  cloudflare: ReadonlyArray<NormalizedAuditEvent>,
): ReadonlyArray<CorrelatedFinding> {
  if (github.length === 0 && cloudflare.length === 0) return [];
  const all = [...github, ...cloudflare];
  const groups = buildActorGroups(all);
  const findings: CorrelatedFinding[] = [];
  for (const list of groups.values()) {
    const sorted = [...list].sort((a, b) => a.occurredAt - b.occurredAt);
    const { severity, reason } = evaluateSeverity(sorted);
    findings.push({
      correlationKey: canonicalCorrelationKey(sorted),
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
