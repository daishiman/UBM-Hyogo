// UT-09: runSync の integration-light テスト。
// D1Database を最小限の in-memory mock で代替し、lock / log / upsert の挙動を検証する。

import { describe, it, expect } from "vitest";
import {
  runSync,
  chunk,
  resolveServiceAccountJson,
} from "./sync-sheets-to-d1";
import type { SyncEnv } from "./sync-sheets-to-d1";
import type { SheetsFetcher, SheetsValueRange } from "./sheets-fetcher";

interface RecordedCall {
  sql: string;
  bindings: unknown[];
}

class FakeD1 {
  readonly calls: RecordedCall[] = [];
  readonly state = {
    locks: new Map<string, { holder: string; expiresAt: string }>(),
    logs: new Map<string, Record<string, unknown>>(),
    members: new Map<string, Record<string, unknown>>(),
  };

  prepare(sql: string): D1PreparedStatement {
    const self = this;
    let bindings: unknown[] = [];
    const stmt: D1PreparedStatement = {
      bind(...args: unknown[]) {
        bindings = args;
        return stmt;
      },
      async run() {
        self.exec(sql, bindings);
        return { success: true, meta: {} } as unknown as D1Response;
      },
      async all() {
        return { results: [], success: true, meta: {} } as unknown as D1Result;
      },
      async first() {
        return null;
      },
      async raw() {
        return [];
      },
    } as unknown as D1PreparedStatement;
    return stmt;
  }

  async batch(statements: D1PreparedStatement[]): Promise<D1Result[]> {
    for (const s of statements) {
      await (s as unknown as { run: () => Promise<unknown> }).run();
    }
    return [];
  }

  async dump(): Promise<ArrayBuffer> {
    return new ArrayBuffer(0);
  }

  async exec_(sql: string): Promise<D1ExecResult> {
    return { count: 0, duration: 0 };
  }

  private exec(sql: string, bindings: unknown[]): void {
    this.calls.push({ sql, bindings });
    if (sql.startsWith("INSERT INTO sync_locks")) {
      const [id, , expiresAt, holder] = bindings as string[];
      if (this.state.locks.has(id)) {
        throw new Error("UNIQUE constraint failed");
      }
      this.state.locks.set(id, { holder, expiresAt });
    } else if (sql.startsWith("DELETE FROM sync_locks WHERE id = ?1 AND expires_at <")) {
      // expired のみ削除
      const [id, nowIso] = bindings as string[];
      const lock = this.state.locks.get(id);
      if (lock && lock.expiresAt < nowIso) this.state.locks.delete(id);
    } else if (sql.startsWith("DELETE FROM sync_locks WHERE id = ?1 AND holder")) {
      const [id, holder] = bindings as string[];
      const lock = this.state.locks.get(id);
      if (lock && lock.holder === holder) this.state.locks.delete(id);
    } else if (sql.startsWith("INSERT INTO sync_job_logs")) {
      const [runId] = bindings as string[];
      this.state.logs.set(runId, { runId, status: "running" });
    } else if (sql.startsWith("UPDATE sync_job_logs")) {
      const [runId, status] = bindings as string[];
      const prev = this.state.logs.get(runId) ?? { runId };
      this.state.logs.set(runId, { ...prev, status });
    } else if (sql.startsWith("INSERT INTO member_responses")) {
      const responseId = bindings[0] as string;
      this.state.members.set(responseId, { responseId, bindings });
    }
  }
}

class FakeFetcher implements SheetsFetcher {
  constructor(private readonly values: string[][]) {}
  async fetchRange(_range: string): Promise<SheetsValueRange> {
    return { range: _range, values: this.values };
  }
}

function buildEnv(db: FakeD1): SyncEnv {
  return {
    DB: db as unknown as D1Database,
    SHEETS_SPREADSHEET_ID: "test-sheet",
    GOOGLE_SERVICE_ACCOUNT_JSON: "{}",
    SYNC_BATCH_SIZE: "2",
    SYNC_MAX_RETRIES: "0",
  };
}

describe("chunk", () => {
  it("配列を size ごとに分割する", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([], 2)).toEqual([]);
  });
});

describe("resolveServiceAccountJson", () => {
  it("canonical GOOGLE_SERVICE_ACCOUNT_JSON が legacy alias より優先される", () => {
    expect(
      resolveServiceAccountJson({
        DB: {} as D1Database,
        GOOGLE_SERVICE_ACCOUNT_JSON: "canonical",
        GOOGLE_SHEETS_SA_JSON: "legacy",
      }),
    ).toBe("canonical");
  });
});

describe("runSync", () => {
  it("成功時に sync_job_logs を success に更新する", async () => {
    const db = new FakeD1();
    const fetcher = new FakeFetcher([
      ["タイムスタンプ", "メールアドレス", "氏名"],
      ["2026-04-27T08:00:00Z", "a@example.com", "A"],
      ["2026-04-27T09:00:00Z", "b@example.com", "B"],
    ]);
    const result = await runSync(buildEnv(db), {
      trigger: "admin",
      fetcher,
      runId: "run-1",
    });
    expect(result.status).toBe("success");
    expect(result.fetched).toBe(2);
    expect(result.upserted).toBe(2);
    expect(db.state.logs.get("run-1")?.status).toBe("success");
    expect(db.state.members.size).toBe(2);
  });

  it("二重起動時は skipped を返す", async () => {
    const db = new FakeD1();
    // 先に lock を仕込む
    db["state"].locks.set("sheets-to-d1", {
      holder: "other",
      expiresAt: "2099-01-01T00:00:00Z",
    });
    const fetcher = new FakeFetcher([["タイムスタンプ", "メールアドレス"]]);
    const result = await runSync(buildEnv(db), {
      trigger: "cron",
      fetcher,
      runId: "run-2",
    });
    expect(result.status).toBe("skipped");
  });

  it("fetcher が throw すると failed として記録される", async () => {
    const db = new FakeD1();
    const fetcher: SheetsFetcher = {
      async fetchRange() {
        throw new Error("Sheets API 503");
      },
    };
    const result = await runSync(buildEnv(db), {
      trigger: "cron",
      fetcher,
      runId: "run-3",
    });
    expect(result.status).toBe("failed");
    expect(result.error).toContain("503");
    expect(db.state.logs.get("run-3")?.status).toBe("failed");
  });

  it("legacy GOOGLE_SHEETS_SA_JSON alias も移行期間は受け付ける", async () => {
    const db = new FakeD1();
    const fetcher = new FakeFetcher([["タイムスタンプ", "メールアドレス"]]);
    const { GOOGLE_SERVICE_ACCOUNT_JSON: _unused, ...baseEnv } = buildEnv(db);
    const env: SyncEnv = {
      ...baseEnv,
      GOOGLE_SHEETS_SA_JSON: "{}",
    };
    const result = await runSync(env, {
      trigger: "cron",
      fetcher,
      runId: "run-legacy",
    });
    expect(result.status).toBe("success");
  });

  it("冪等性: 同じデータを 2 回実行しても upsert は同件数", async () => {
    const db = new FakeD1();
    const values = [
      ["タイムスタンプ", "メールアドレス"],
      ["2026-04-27T08:00:00Z", "a@example.com"],
    ];
    const env = buildEnv(db);
    await runSync(env, {
      trigger: "admin",
      fetcher: new FakeFetcher(values),
      runId: "run-a",
    });
    await runSync(env, {
      trigger: "admin",
      fetcher: new FakeFetcher(values),
      runId: "run-b",
    });
    expect(db.state.members.size).toBe(1);
  });
});
