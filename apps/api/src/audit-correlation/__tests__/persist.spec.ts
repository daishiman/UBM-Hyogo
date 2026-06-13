import { describe, expect, it } from 'vitest';
import { persistFindings } from '../persist';
import type { CorrelatedFinding, FingerprintHash, NormalizedAuditEvent } from '../types';

interface Row {
  values: ReadonlyArray<unknown>;
}

class FakeStmt {
  constructor(
    private readonly sql: string,
    private readonly state: { rows: Row[]; uniqueKeys: Set<string> },
  ) {}
  private bound: ReadonlyArray<unknown> = [];
  bind(...args: ReadonlyArray<unknown>): this {
    this.bound = args;
    return this;
  }
  async run(): Promise<{ meta: { changes: number } }> {
    // INSERT OR IGNORE 模擬: (fp_prefix, observed_at, event_type) のユニーク制約
    const [prefix, , , , , , event_type, , observed_at] = this.bound;
    const uniqueKey = `${String(prefix)}|${String(observed_at)}|${String(event_type)}`;
    if (this.state.uniqueKeys.has(uniqueKey)) {
      return { meta: { changes: 0 } };
    }
    this.state.uniqueKeys.add(uniqueKey);
    this.state.rows.push({ values: this.bound });
    return { meta: { changes: 1 } };
  }
}

function fakeDb(): { db: D1Database; rows: Row[] } {
  const state = { rows: [] as Row[], uniqueKeys: new Set<string>() };
  const db = {
    prepare(sql: string) {
      return new FakeStmt(sql, state);
    },
  } as unknown as D1Database;
  return { db, rows: state.rows };
}

const fp = ('feedface' + 'a'.repeat(56)) as FingerprintHash;
function makeEvent(overrides: Partial<NormalizedAuditEvent> = {}): NormalizedAuditEvent {
  return {
    fingerprintHash: fp,
    fingerprintVersion: 1,
    source: 'github',
    eventType: 'org.update_member',
    occurredAt: 1_700_000_000_000,
    actorDomain: 'example.com',
    ipPrefix: '203.0.113.0/24',
    userAgentBucket: 'firefox',
    ...overrides,
  };
}

function finding(events: NormalizedAuditEvent[], severity: CorrelatedFinding['severity']): CorrelatedFinding {
  return {
    correlationKey: { fingerprintHash: events[0]!.fingerprintHash, fingerprintVersion: 1 },
    events,
    severity,
    reason: 'r',
  };
}

describe('persistFindings', () => {
  it('returns 0/0 for empty input', async () => {
    const { db } = fakeDb();
    const result = await persistFindings([], { db });
    expect(result).toEqual({ attempted: 0, inserted: 0 });
  });

  it('inserts redact-safe row using fingerprint hash prefix only (8 chars)', async () => {
    const { db, rows } = fakeDb();
    const result = await persistFindings([finding([makeEvent()], 'HIGH')], { db });
    expect(result).toEqual({ attempted: 1, inserted: 1 });
    expect(rows.length).toBe(1);
    const [prefix] = rows[0]!.values;
    expect(prefix).toBe('feedface');
    expect(rows[0]!.values).not.toContain(fp);
  });

  it('UNIQUE 競合 (同 prefix+observed_at+event_type) は inserted に数えない', async () => {
    const { db } = fakeDb();
    const f = finding([makeEvent()], 'HIGH');
    const result1 = await persistFindings([f], { db });
    const result2 = await persistFindings([f], { db });
    expect(result1.inserted).toBe(1);
    expect(result2.inserted).toBe(0);
    expect(result2.attempted).toBe(1);
  });

  it('GitHub 権限変更 event を Cloudflare token_rotate より優先する', async () => {
    const { db, rows } = fakeDb();
    const events = [
      makeEvent({ source: 'cloudflare', eventType: 'token_rotate' }),
      makeEvent({ source: 'github', eventType: 'org.update_member' }),
    ];
    await persistFindings([finding(events, 'HIGH')], { db });
    const event_type = rows[0]!.values[6];
    expect(event_type).toBe('org.update_member');
  });

  it('GitHub 権限変更が無ければ Cloudflare token_rotate を優先する', async () => {
    const { db, rows } = fakeDb();
    const events = [
      makeEvent({ source: 'cloudflare', eventType: 'login_fail' }),
      makeEvent({ source: 'cloudflare', eventType: 'token_rotate' }),
    ];
    await persistFindings([finding(events, 'HIGH')], { db });
    expect(rows[0]!.values[6]).toBe('token_rotate');
  });

  it('token_rotate も無ければ Cloudflare login_fail を優先する', async () => {
    const { db, rows } = fakeDb();
    const events = [
      makeEvent({ source: 'cloudflare', eventType: 'session_create' }),
      makeEvent({ source: 'cloudflare', eventType: 'login_fail' }),
    ];
    await persistFindings([finding(events, 'MEDIUM')], { db });
    expect(rows[0]!.values[6]).toBe('login_fail');
  });

  it('優先 event が無ければ先頭 event を採用する', async () => {
    const { db, rows } = fakeDb();
    const events = [
      makeEvent({ source: 'cloudflare', eventType: 'session_create' }),
      makeEvent({ source: 'github', eventType: 'repo.access' }),
    ];
    await persistFindings([finding(events, 'LOW')], { db });
    expect(rows[0]!.values[6]).toBe('session_create');
  });

  it('events が空の finding は skip し attempted には数える', async () => {
    const { db, rows } = fakeDb();
    const emptyFinding: CorrelatedFinding = {
      correlationKey: { fingerprintHash: fp, fingerprintVersion: 1 },
      events: [],
      severity: 'LOW',
      reason: 'r',
    };
    const result = await persistFindings([emptyFinding], { db });
    expect(result).toEqual({ attempted: 1, inserted: 0 });
    expect(rows.length).toBe(0);
  });

  it('actorDomain / ipPrefix / userAgentBucket が未指定なら NULL を bind する', async () => {
    const { db, rows } = fakeDb();
    const ev = makeEvent({
      actorDomain: undefined,
      ipPrefix: undefined,
      userAgentBucket: undefined,
    });
    await persistFindings([finding([ev], 'HIGH')], { db });
    const v = rows[0]!.values;
    expect(v[2]).toBeNull(); // actor_domain
    expect(v[3]).toBeNull(); // ip_prefix
    expect(v[4]).toBeNull(); // ua_bucket
  });

  it('opts.now 未指定でも created_at に現在時刻が書かれる', async () => {
    const { db, rows } = fakeDb();
    const before = Date.now();
    await persistFindings([finding([makeEvent()], 'HIGH')], { db });
    const createdAt = rows[0]!.values[9] as number;
    expect(typeof createdAt).toBe('number');
    expect(createdAt).toBeGreaterThanOrEqual(before);
  });

  it('opts.now 指定時はその時刻を created_at に使う', async () => {
    const { db, rows } = fakeDb();
    const fixed = new Date('2026-01-02T03:04:05Z');
    await persistFindings([finding([makeEvent()], 'HIGH')], {
      db,
      now: () => fixed,
    });
    expect(rows[0]!.values[9]).toBe(fixed.getTime());
  });

  it('D1 meta.changes が未定義なら inserted に数えない', async () => {
    const noMetaDb = {
      prepare() {
        return {
          bind() {
            return this;
          },
          async run() {
            return {}; // meta 欠落 → changes ?? 0 が 0 になる経路
          },
        };
      },
    } as unknown as D1Database;
    const result = await persistFindings([finding([makeEvent()], 'HIGH')], {
      db: noMetaDb,
    });
    expect(result).toEqual({ attempted: 1, inserted: 0 });
  });
});
