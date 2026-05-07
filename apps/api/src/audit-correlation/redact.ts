import { FingerprintInputEmptyError } from './errors';
import type {
  FingerprintHash,
  FingerprintInput,
  NormalizedAuditEvent,
  RawCloudflareAuditEvent,
  RawGitHubAuditEvent,
  RedactOpts,
} from './types';

const FINGERPRINT_VERSION = 1 as const;

export function normalizeEmail(raw: string | undefined): { localPart?: string; domain?: string } {
  if (!raw) return {};
  const at = raw.indexOf('@');
  if (at < 0) {
    const lp = raw.trim().toLowerCase();
    return lp ? { localPart: lp } : {};
  }
  const localPart = raw.slice(0, at).trim().toLowerCase();
  const domain = raw.slice(at + 1).trim().toLowerCase();
  const result: { localPart?: string; domain?: string } = {};
  if (localPart) result.localPart = localPart;
  if (domain) result.domain = domain;
  return result;
}

export function truncateIp(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const value = raw.trim();
  if (!value) return undefined;
  if (value.includes(':')) {
    const hextets = value.split(':');
    const head = hextets.slice(0, 3).filter((h) => h.length > 0);
    if (head.length === 0) return undefined;
    return head.join(':') + '::/48';
  }
  const octets = value.split('.');
  if (octets.length !== 4) return undefined;
  if (!octets.every((o) => /^\d{1,3}$/.test(o))) return undefined;
  return `${octets[0]}.${octets[1]}.${octets[2]}.0/24`;
}

export function bucketUserAgent(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const ua = raw.toLowerCase();
  if (ua.includes('gha-runner') || ua.includes('github-actions')) return 'gha-runner';
  if (ua.includes('curl/')) return 'curl';
  if (ua.includes('firefox/')) return 'firefox';
  if (ua.includes('edg/')) return 'edge';
  if (ua.includes('chrome/')) return 'chrome';
  if (ua.includes('safari/')) return 'safari';
  return 'other';
}

function toHex(buf: ArrayBuffer): string {
  const arr = new Uint8Array(buf);
  let out = '';
  for (let i = 0; i < arr.length; i++) {
    out += arr[i].toString(16).padStart(2, '0');
  }
  return out;
}

export async function computeFingerprint(input: FingerprintInput, salt: string): Promise<FingerprintHash> {
  const { emailLocalPart, emailDomain, ipPrefix, uaBucket } = input;
  if (!emailLocalPart && !emailDomain && !ipPrefix && !uaBucket) {
    throw new FingerprintInputEmptyError();
  }
  // join key は actor identity (email local-part + domain) を主軸とする。
  // ipPrefix / uaBucket は同一 actor の IP / UA 変化を group 内で観測したいため、email がある場合 fingerprint に含めない（Phase 1 SSOT 改訂）。
  // email が無いイベントは ipPrefix + uaBucket で代替 fingerprint を構成する。
  const hasEmail = Boolean(emailLocalPart || emailDomain);
  const canonical = hasEmail
    ? `email|${emailLocalPart ?? ''}|${emailDomain ?? ''}`
    : `network|${ipPrefix ?? ''}|${uaBucket ?? ''}`;
  const payload = `${salt}|${canonical}`;
  const data = new TextEncoder().encode(payload);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return toHex(digest) as FingerprintHash;
}

export async function redactGitHub(
  ev: RawGitHubAuditEvent,
  opts: RedactOpts,
): Promise<NormalizedAuditEvent> {
  const email = normalizeEmail(ev.external_identity_nameid);
  const ipPrefix = truncateIp(ev.actor_ip);
  const uaBucket = bucketUserAgent(ev.user_agent);
  // join key は actor identity（email local-part + domain）のみ。
  // ipPrefix / uaBucket は副情報として保持し、HIGH severity 判定で使う（IP 急変検知のため group 内で参照する）。
  const fingerprintHash = await computeFingerprint(
    { emailLocalPart: email.localPart, emailDomain: email.domain, ipPrefix, uaBucket },
    opts.salt,
  );
  return {
    fingerprintHash,
    fingerprintVersion: FINGERPRINT_VERSION,
    source: 'github',
    eventType: ev.action,
    occurredAt: ev.created_at,
    actorDomain: email.domain,
    ipPrefix,
    userAgentBucket: uaBucket,
  };
}

export async function redactCloudflare(
  ev: RawCloudflareAuditEvent,
  opts: RedactOpts,
): Promise<NormalizedAuditEvent> {
  const email = normalizeEmail(ev.actor.email);
  const ipPrefix = truncateIp(ev.actor.ip);
  const uaBucket = bucketUserAgent(ev.user_agent);
  const fingerprintHash = await computeFingerprint(
    { emailLocalPart: email.localPart, emailDomain: email.domain, ipPrefix, uaBucket },
    opts.salt,
  );
  const occurredAt = Date.parse(ev.when);
  return {
    fingerprintHash,
    fingerprintVersion: FINGERPRINT_VERSION,
    source: 'cloudflare',
    eventType: ev.action.type,
    occurredAt: Number.isFinite(occurredAt) ? occurredAt : 0,
    actorDomain: email.domain,
    ipPrefix,
    userAgentBucket: uaBucket,
  };
}
