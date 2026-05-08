import { redactCloudflare } from './redact';
import type { NormalizedAuditEvent, RawCloudflareAuditEvent } from './types';

interface CfAuditLogRow {
  readonly occurred_at: string;
  readonly actor_email: string | null;
  readonly actor_ip: string | null;
  readonly actor_ua: string | null;
  readonly action_type: string;
  readonly resource_type: string | null;
  readonly resource_id: string | null;
}

export interface LoadCloudflareAuditEventsOpts {
  readonly db: D1Database;
  readonly since: Date;
  readonly until: Date;
  readonly salt: string;
}

export async function loadCloudflareAuditEvents(
  opts: LoadCloudflareAuditEventsOpts,
): Promise<ReadonlyArray<NormalizedAuditEvent>> {
  const sinceMs = opts.since.getTime();
  const untilMs = opts.until.getTime();
  const result = await opts.db
    .prepare(
      `SELECT occurred_at, actor_email, actor_ip, actor_ua, action_type, resource_type, resource_id
       FROM cf_audit_log
       WHERE occurred_at_ms >= ? AND occurred_at_ms <= ?
       ORDER BY occurred_at_ms ASC
       LIMIT 1000`,
    )
    .bind(sinceMs, untilMs)
    .all<CfAuditLogRow>();

  const rows = result.results ?? [];
  const normalized: NormalizedAuditEvent[] = [];
  for (const row of rows) {
    const raw: RawCloudflareAuditEvent = {
      action: { type: row.action_type },
      actor: {
        ...(row.actor_email ? { email: row.actor_email } : {}),
        ...(row.actor_ip ? { ip: row.actor_ip } : {}),
      },
      when: row.occurred_at,
      ...(row.actor_ua ? { user_agent: row.actor_ua } : {}),
      ...(row.resource_type || row.resource_id
        ? {
            resource: {
              type: row.resource_type ?? 'unknown',
              ...(row.resource_id ? { id: row.resource_id } : {}),
            },
          }
        : {}),
    };
    normalized.push(await redactCloudflare(raw, { salt: opts.salt }));
  }
  return normalized;
}
