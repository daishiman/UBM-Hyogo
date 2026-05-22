export type FingerprintHash = string & { readonly __brand: 'FingerprintHash' };
export type FingerprintVersion = 1 | 2;

export interface FingerprintHashPair {
  readonly v1?: FingerprintHash;
  readonly v2?: FingerprintHash;
}

export interface CorrelationKey {
  readonly fingerprintHash: FingerprintHash;
  readonly fingerprintVersion: FingerprintVersion;
  readonly fingerprintHashes?: FingerprintHashPair;
}

export interface RawGitHubAuditEvent {
  readonly action: string;
  readonly actor: string;
  readonly actor_ip?: string;
  readonly user_agent?: string;
  readonly created_at: number;
  readonly org: string;
  readonly repo?: string;
  readonly external_identity_nameid?: string;
}

export interface RawCloudflareAuditEvent {
  readonly action: { type: string };
  readonly actor: { email?: string; ip?: string };
  readonly when: string;
  readonly resource?: { type: string; id?: string };
  readonly user_agent?: string;
}

export type AuditSource = 'github' | 'cloudflare';

export interface NormalizedAuditEvent extends CorrelationKey {
  readonly source: AuditSource;
  readonly eventType: string;
  readonly occurredAt: number;
  readonly actorDomain?: string | undefined;
  readonly ipPrefix?: string | undefined;
  readonly userAgentBucket?: string | undefined;
}

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface CorrelatedFinding {
  readonly correlationKey: CorrelationKey;
  readonly events: ReadonlyArray<NormalizedAuditEvent>;
  readonly severity: Severity;
  readonly reason: string;
}

export interface FingerprintInput {
  readonly emailLocalPart?: string | undefined;
  readonly emailDomain?: string | undefined;
  readonly ipPrefix?: string | undefined;
  readonly uaBucket?: string | undefined;
}

export interface RedactOpts {
  readonly salt: string;
  readonly previousSalt?: string | undefined;
}

export interface GitHubFetchOpts {
  readonly since: Date;
  readonly until: Date;
  readonly orgSlug: string;
  readonly pat: string;
  readonly fetchImpl?: typeof fetch | undefined;
  readonly maxRetries?: number | undefined;
  readonly baseBackoffMs?: number | undefined;
}

export const PERMISSION_CHANGE_GITHUB_EVENTS = new Set<string>([
  'org.update_member',
  'account.member_role_change',
  'org.update_member_repository_permission',
  'org.add_member',
  'org.remove_member',
]);

export const SECURITY_SIGNAL_CLOUDFLARE_EVENTS = new Set<string>([
  'member_role_change',
  'login_fail',
  'token_rotate',
]);
