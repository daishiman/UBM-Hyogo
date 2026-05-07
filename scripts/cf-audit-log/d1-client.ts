/**
 * D1 access layer for cf-audit-log scripts.
 *
 * Two backends are supported:
 *   - "wrangler" : 本番／staging で wrangler d1 execute --remote 経由で REST 実行
 *   - "memory"   : テスト・dry-run で使う in-memory D1 fake
 *
 * 共通 interface (D1Like) を export し、severity-classifier や issue-reporter
 * からは backend を意識せずに使えるようにする。
 */

import { execFileSync } from "node:child_process";
import type { AuditLogEvent, Baseline } from "./types.ts";

export interface D1RunResult {
  changes?: number;
}

export interface D1QueryResult<T> {
  results: T[];
}

export interface D1Like {
  exec(sql: string, params?: unknown[]): Promise<D1RunResult>;
  query<T>(sql: string, params?: unknown[]): Promise<D1QueryResult<T>>;
}

interface CfAuditLogRow {
  id: string;
  occurred_at: string;
  occurred_at_ms: number;
  actor_email: string | null;
  actor_ip: string | null;
  actor_ua: string | null;
  action_type: string;
  action_result: string;
  result_code: number | null;
  resource_type: string | null;
  resource_id: string | null;
  raw_json: string;
  ingested_at_ms: number;
  severity: string | null;
  issue_number: number | null;
}

export async function insertEvents(
  db: D1Like,
  events: AuditLogEvent[],
): Promise<{ inserted: number }> {
  let inserted = 0;
  const now = Date.now();
  for (const ev of events) {
    const occurredMs = Date.parse(ev.when);
    await db.exec(
      `INSERT OR IGNORE INTO cf_audit_log (
         id, occurred_at, occurred_at_ms, actor_email, actor_ip, actor_ua,
         action_type, action_result, result_code, resource_type, resource_id,
         raw_json, ingested_at_ms
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ev.id,
        ev.when,
        occurredMs,
        ev.actor.email ?? null,
        ev.actor.ip ?? null,
        ev.actor.user_agent ?? null,
        ev.action.type,
        ev.action.result,
        ev.action.result_code ?? null,
        ev.resource?.type ?? null,
        ev.resource?.id ?? null,
        JSON.stringify(ev),
        now,
      ],
    );
    inserted++;
  }
  return { inserted };
}

export async function recentEventsInWindow(
  db: D1Like,
  sinceMs: number,
  untilMs: number,
): Promise<AuditLogEvent[]> {
  const r = await db.query<CfAuditLogRow>(
    `SELECT * FROM cf_audit_log WHERE occurred_at_ms >= ? AND occurred_at_ms < ? ORDER BY occurred_at_ms ASC`,
    [sinceMs, untilMs],
  );
  return r.results.map(rowToEvent);
}

function rowToEvent(row: CfAuditLogRow): AuditLogEvent {
  return {
    id: row.id,
    when: row.occurred_at,
    actor: {
      ...(row.actor_email !== null && { email: row.actor_email }),
      ...(row.actor_ip !== null && { ip: row.actor_ip }),
      ...(row.actor_ua !== null && { user_agent: row.actor_ua }),
    },
    action: {
      type: row.action_type,
      result: row.action_result === "success" ? "success" : "failure",
      ...(row.result_code !== null && { result_code: row.result_code }),
    },
    ...(row.resource_type !== null || row.resource_id !== null
      ? {
          resource: {
            ...(row.resource_type !== null && { type: row.resource_type }),
            ...(row.resource_id !== null && { id: row.resource_id }),
          },
        }
      : {}),
  };
}

export async function purgeOlderThan(
  db: D1Like,
  cutoffMs: number,
): Promise<{ deleted: number }> {
  const r = await db.exec(
    `DELETE FROM cf_audit_log WHERE occurred_at_ms < ?`,
    [cutoffMs],
  );
  return { deleted: r.changes ?? 0 };
}

export async function loadBaseline(db: D1Like): Promise<Baseline | null> {
  const r = await db.query<{ key: string; value_num: number; computed_at: string; window_days: number }>(
    `SELECT key, value_num, computed_at, window_days FROM cf_audit_baseline`,
  );
  if (r.results.length === 0) return null;
  const map = new Map(r.results.map((x) => [x.key, x]));
  const succ = map.get("success_per_hour_p95");
  const fail = map.get("failure_per_hour_p95");
  const off = map.get("off_hours_ratio");
  if (!succ || !fail || !off) return null;
  return {
    successPerHourP95: succ.value_num,
    failurePerHourP95: fail.value_num,
    offHoursRatio: off.value_num,
    computedAt: succ.computed_at,
    windowDays: succ.window_days,
  };
}

export async function saveBaseline(db: D1Like, b: Baseline): Promise<void> {
  const rows: [string, number][] = [
    ["success_per_hour_p95", b.successPerHourP95],
    ["failure_per_hour_p95", b.failurePerHourP95],
    ["off_hours_ratio", b.offHoursRatio],
  ];
  for (const [k, v] of rows) {
    await db.exec(
      `INSERT INTO cf_audit_baseline (key, value_num, computed_at, window_days)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value_num = excluded.value_num,
         computed_at = excluded.computed_at, window_days = excluded.window_days`,
      [k, v, b.computedAt, b.windowDays],
    );
  }
}

export async function isAlreadyReported(
  db: D1Like,
  dedupeKey: string,
): Promise<number | null> {
  const r = await db.query<{ issue_number: number }>(
    `SELECT issue_number FROM cf_audit_finding_dedupe WHERE finding_hash = ?`,
    [dedupeKey],
  );
  return r.results.length > 0 ? r.results[0]!.issue_number : null;
}

export async function recordReported(
  db: D1Like,
  dedupeKey: string,
  issueNumber: number,
): Promise<void> {
  await db.exec(
    `INSERT OR IGNORE INTO cf_audit_finding_dedupe (finding_hash, issue_number, created_at_ms) VALUES (?, ?, ?)`,
    [dedupeKey, issueNumber, Date.now()],
  );
}

export async function recordClassification(
  db: D1Like,
  eventId: string,
  input: {
    severity: string;
    classifierUsed: string;
    classifierVersion: string;
    confidence: number;
  },
): Promise<void> {
  try {
    await db.exec(
      `UPDATE cf_audit_log
         SET severity = ?, classifier_used = ?, classifier_version = ?, confidence = ?
         WHERE id = ?`,
      [
        input.severity,
        input.classifierUsed,
        input.classifierVersion,
        input.confidence,
        eventId,
      ],
    );
  } catch (error) {
    if (!isMissingClassifierColumn(error)) throw error;
    await db.exec(
      `UPDATE cf_audit_log SET severity = ? WHERE id = ?`,
      [input.severity, eventId],
    );
  }
}

function isMissingClassifierColumn(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /classifier_used|classifier_version|confidence|no such column/i.test(message);
}

export async function count403FromActor(
  db: D1Like,
  actorEmail: string | undefined,
  sinceMs: number,
  untilMs: number,
): Promise<number> {
  if (!actorEmail) return 0;
  const r = await db.query<{ c: number }>(
    `SELECT COUNT(*) AS c FROM cf_audit_log
       WHERE actor_email = ?
         AND action_result = 'failure' AND result_code = 403
         AND occurred_at_ms >= ? AND occurred_at_ms < ?`,
    [actorEmail, sinceMs, untilMs],
  );
  return r.results[0]?.c ?? 0;
}

/** in-memory D1 fake for tests / dry-run / fixtures */
export class InMemoryD1 implements D1Like {
  private events: AuditLogEvent[] = [];
  private baseline: Map<string, { value_num: number; computed_at: string; window_days: number }> = new Map();
  private dedupe: Map<string, { issue_number: number; created_at_ms: number }> = new Map();

  static fromEvents(events: AuditLogEvent[]): InMemoryD1 {
    const db = new InMemoryD1();
    db.events = events.slice();
    return db;
  }

  async exec(sql: string, params: unknown[] = []): Promise<D1RunResult> {
    const s = sql.replace(/\s+/g, " ").trim();
    if (s.startsWith("INSERT OR IGNORE INTO cf_audit_log")) {
      const ev = this.eventFromInsertParams(params);
      if (!this.events.find((e) => e.id === ev.id)) this.events.push(ev);
      return { changes: 1 };
    }
    if (s.startsWith("DELETE FROM cf_audit_log")) {
      const cutoff = params[0] as number;
      const before = this.events.length;
      this.events = this.events.filter((e) => Date.parse(e.when) >= cutoff);
      return { changes: before - this.events.length };
    }
    if (s.startsWith("INSERT INTO cf_audit_baseline")) {
      const [k, v, computed, windowDays] = params as [string, number, string, number];
      this.baseline.set(k, { value_num: v, computed_at: computed, window_days: windowDays });
      return { changes: 1 };
    }
    if (s.startsWith("INSERT OR IGNORE INTO cf_audit_finding_dedupe")) {
      const [k, n, t] = params as [string, number, number];
      if (!this.dedupe.has(k)) this.dedupe.set(k, { issue_number: n, created_at_ms: t });
      return { changes: 1 };
    }
    if (s.startsWith("UPDATE cf_audit_log SET severity")) {
      return { changes: 1 };
    }
    throw new Error(`InMemoryD1.exec unsupported sql: ${s}`);
  }

  async query<T>(sql: string, params: unknown[] = []): Promise<D1QueryResult<T>> {
    const s = sql.replace(/\s+/g, " ").trim();
    if (s.startsWith("SELECT * FROM cf_audit_log WHERE occurred_at_ms")) {
      const [since, until] = params as [number, number];
      const rows = this.events
        .filter((e) => {
          const t = Date.parse(e.when);
          return t >= since && t < until;
        })
        .map((e) => this.eventToRow(e));
      return { results: rows as unknown as T[] };
    }
    if (s.startsWith("SELECT key, value_num, computed_at, window_days FROM cf_audit_baseline")) {
      const rows = Array.from(this.baseline.entries()).map(([key, v]) => ({
        key,
        value_num: v.value_num,
        computed_at: v.computed_at,
        window_days: v.window_days,
      }));
      return { results: rows as unknown as T[] };
    }
    if (s.startsWith("SELECT issue_number FROM cf_audit_finding_dedupe")) {
      const k = params[0] as string;
      const v = this.dedupe.get(k);
      return { results: (v ? [{ issue_number: v.issue_number }] : []) as unknown as T[] };
    }
    if (s.startsWith("SELECT COUNT(*) AS c FROM cf_audit_log")) {
      const [actor, since, until] = params as [string, number, number];
      const c = this.events.filter((e) =>
        e.actor.email === actor &&
        e.action.result === "failure" &&
        e.action.result_code === 403 &&
        Date.parse(e.when) >= since &&
        Date.parse(e.when) < until
      ).length;
      return { results: [{ c }] as unknown as T[] };
    }
    throw new Error(`InMemoryD1.query unsupported sql: ${s}`);
  }

  private eventFromInsertParams(p: unknown[]): AuditLogEvent {
    return {
      id: p[0] as string,
      when: p[1] as string,
      actor: {
        ...(p[3] !== null && { email: p[3] as string }),
        ...(p[4] !== null && { ip: p[4] as string }),
        ...(p[5] !== null && { user_agent: p[5] as string }),
      },
      action: {
        type: p[6] as string,
        result: (p[7] as string) === "success" ? "success" : "failure",
        ...(p[8] !== null && { result_code: p[8] as number }),
      },
      ...(p[9] !== null || p[10] !== null
        ? {
            resource: {
              ...(p[9] !== null && { type: p[9] as string }),
              ...(p[10] !== null && { id: p[10] as string }),
            },
          }
        : {}),
    };
  }

  private eventToRow(e: AuditLogEvent): CfAuditLogRow {
    return {
      id: e.id,
      occurred_at: e.when,
      occurred_at_ms: Date.parse(e.when),
      actor_email: e.actor.email ?? null,
      actor_ip: e.actor.ip ?? null,
      actor_ua: e.actor.user_agent ?? null,
      action_type: e.action.type,
      action_result: e.action.result,
      result_code: e.action.result_code ?? null,
      resource_type: e.resource?.type ?? null,
      resource_id: e.resource?.id ?? null,
      raw_json: JSON.stringify(e),
      ingested_at_ms: 0,
      severity: null,
      issue_number: null,
    };
  }
}

/**
 * wrangler d1 execute backend.
 * scripts/cf.sh d1 execute ... 経由で 1Password / mise / esbuild guard を通す。
 */
export class WranglerD1 implements D1Like {
  constructor(
    private readonly database: string,
    private readonly env: "production" | "staging",
  ) {}

  async exec(sql: string, params: unknown[] = []): Promise<D1RunResult> {
    const stdout = this.run(sql, params);
    const meta = this.firstResultMeta(stdout);
    return { changes: meta?.changes ?? 0 };
  }

  async query<T>(sql: string, params: unknown[] = []): Promise<D1QueryResult<T>> {
    const stdout = this.run(sql, params);
    const results = this.firstResultRows<T>(stdout);
    return { results };
  }

  private run(sql: string, params: unknown[]): string {
    const cfWrapper = `${process.cwd()}/scripts/cf.sh`;
    const args = [
      cfWrapper,
      "d1",
      "execute",
      this.database,
      `--env=${this.env}`,
      "--remote",
      "--json",
      `--command=${this.bindParams(sql, params)}`,
    ];
    return execFileSync("bash", args, { encoding: "utf8" });
  }

  private bindParams(sql: string, params: unknown[]): string {
    let i = 0;
    return sql.replace(/\?/g, () => {
      const v = params[i++];
      if (v === null || v === undefined) return "NULL";
      if (typeof v === "number") return String(v);
      const s = String(v).replace(/'/g, "''");
      return `'${s}'`;
    });
  }

  private firstResultRows<T>(stdout: string): T[] {
    const parsed = JSON.parse(stdout) as Array<{ results?: T[] }>;
    return parsed[0]?.results ?? [];
  }

  private firstResultMeta(stdout: string): { changes?: number } | null {
    const parsed = JSON.parse(stdout) as Array<{ meta?: { changes?: number } }>;
    return parsed[0]?.meta ?? null;
  }
}
