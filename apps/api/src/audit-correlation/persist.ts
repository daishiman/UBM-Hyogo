import { PERMISSION_CHANGE_GITHUB_EVENTS, type CorrelatedFinding, type NormalizedAuditEvent } from './types';

export interface PersistOpts {
  readonly db: D1Database;
  readonly now?: () => Date;
}

export interface PersistResult {
  readonly attempted: number;
  readonly inserted: number;
}

function pickPrimaryEvent(events: ReadonlyArray<NormalizedAuditEvent>): NormalizedAuditEvent {
  // 優先順位: GitHub 権限変更 > Cloudflare token_rotate > Cloudflare login_fail > 先頭
  const githubPerm = events.find(
    (e) => e.source === 'github' && PERMISSION_CHANGE_GITHUB_EVENTS.has(e.eventType),
  );
  if (githubPerm) return githubPerm;
  const tokenRotate = events.find(
    (e) => e.source === 'cloudflare' && e.eventType === 'token_rotate',
  );
  if (tokenRotate) return tokenRotate;
  const loginFail = events.find(
    (e) => e.source === 'cloudflare' && e.eventType === 'login_fail',
  );
  if (loginFail) return loginFail;
  return events[0]!;
}

export async function persistFindings(
  findings: ReadonlyArray<CorrelatedFinding>,
  opts: PersistOpts,
): Promise<PersistResult> {
  if (findings.length === 0) return { attempted: 0, inserted: 0 };
  const now = (opts.now ?? (() => new Date()))().getTime();
  let inserted = 0;
  const stmt = opts.db.prepare(
    `INSERT OR IGNORE INTO audit_correlation_findings (
      fingerprint_hash_prefix, fingerprint_version, actor_domain, ip_prefix, ua_bucket,
      severity, event_type, reason, observed_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const finding of findings) {
    if (finding.events.length === 0) continue;
    const primary = pickPrimaryEvent(finding.events);
    const prefix = finding.correlationKey.fingerprintHash.slice(0, 8);
    const result = await stmt
      .bind(
        prefix,
        finding.correlationKey.fingerprintVersion,
        primary.actorDomain ?? null,
        primary.ipPrefix ?? null,
        primary.userAgentBucket ?? null,
        finding.severity,
        primary.eventType,
        finding.reason,
        primary.occurredAt,
        now,
      )
      .run();
    // D1 returns meta.changes for INSERT OR IGNORE; UNIQUE 競合は changes=0
    const changes = (result as { meta?: { changes?: number } }).meta?.changes ?? 0;
    if (changes > 0) inserted += 1;
  }
  return { attempted: findings.length, inserted };
}
