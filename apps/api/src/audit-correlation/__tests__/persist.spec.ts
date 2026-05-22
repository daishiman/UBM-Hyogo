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
});
