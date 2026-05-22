// issue-372: AttendanceProvider.findByMemberId ページング検証
import { describe, it, expect } from "vitest";
import {
  createAttendanceProvider,
  encodeAttendanceCursor,
  decodeAttendanceCursor,
  clampAttendanceLimit,
  ATTENDANCE_PAGE_DEFAULT_LIMIT,
  ATTENDANCE_PAGE_MAX_LIMIT,
} from "../attendance";
import type { D1Db, D1Stmt, DbCtx } from "../_shared/db";
import { asMemberId } from "../_shared/brand";

interface Row {
  session_id: string;
  title: string;
  held_on: string;
}

class MemoryDb implements D1Db {
  rows: Row[] = [];
  preparedSqls: string[] = [];
  bindBatches: unknown[][] = [];

  prepare(sql: string): D1Stmt {
    this.preparedSqls.push(sql);
    const self = this;
    let bindings: unknown[] = [];
    const stmt: D1Stmt = {
      bind(...values: unknown[]): D1Stmt {
        bindings = values;
        self.bindBatches.push(values);
        return stmt;
      },
      async first<T = unknown>(): Promise<T | null> {
        return null;
      },
      async all<T = unknown>(): Promise<{ results: T[] }> {
        // 模擬: held_on DESC, session_id DESC でソートし、cursor 条件と LIMIT を適用
        const memberId = bindings[0] as string;
        let cursorHeldOn: string | null = null;
        let cursorSessionId: string | null = null;
        let limit: number;
        if (bindings.length === 4) {
          // cursor あり: [memberId, heldOn, heldOn, sessionId, limit] ではなく
          // 実際のバインドは [memberId, c.heldOn, c.heldOn, c.sessionId, limit] = 5
          limit = bindings[3] as number;
        } else if (bindings.length === 5) {
          cursorHeldOn = bindings[1] as string;
          cursorSessionId = bindings[3] as string;
          limit = bindings[4] as number;
        } else {
          limit = bindings[1] as number;
        }
        let filtered = self.rows.filter(() => memberId.length > 0); // 全件（memberId は無視・テストでは 1 人分）
        if (cursorHeldOn !== null && cursorSessionId !== null) {
          filtered = filtered.filter(
            (r) =>
              r.held_on < cursorHeldOn! ||
              (r.held_on === cursorHeldOn && r.session_id < cursorSessionId!),
          );
        }
        filtered.sort((a, b) => {
          if (a.held_on !== b.held_on) return a.held_on < b.held_on ? 1 : -1;
          if (a.session_id !== b.session_id) return a.session_id < b.session_id ? 1 : -1;
          return 0;
        });
        const out = filtered.slice(0, limit).map((r) => ({
          member_id: memberId,
          session_id: r.session_id,
          title: r.title,
          held_on: r.held_on,
        }));
        return { results: out as unknown as T[] };
      },
      async run() {
        return { success: true, meta: { changes: 0, last_row_id: 0 } };
      },
    };
    return stmt;
  }

  async exec(_sql: string): Promise<{ count: number; duration: number }> {
    return { count: 0, duration: 0 };
  }
}

const ctx = (db: MemoryDb): DbCtx => ({ db });

describe("attendance cursor encoder", () => {
  it("encode→decode roundtrip", () => {
    const cur = { heldOn: "2026-03-01", sessionId: "s_123" };
    const enc = encodeAttendanceCursor(cur);
    expect(enc).not.toContain("=");
    expect(enc).not.toContain("+");
    expect(enc).not.toContain("/");
    expect(decodeAttendanceCursor(enc)).toEqual(cur);
  });

  it("decode 不正文字列は null", () => {
    expect(decodeAttendanceCursor("not-base64!!!")).toBeNull();
    expect(decodeAttendanceCursor("")).toBeNull();
  });

  it("decode JSON 構造不正は null", () => {
    const bad = Buffer.from(JSON.stringify({ foo: "bar" }), "utf-8")
      .toString("base64")
      .replace(/=/g, "");
    expect(decodeAttendanceCursor(bad)).toBeNull();
  });
});

describe("clampAttendanceLimit", () => {
  it("undefined / 不正値は default", () => {
    expect(clampAttendanceLimit(undefined)).toBe(ATTENDANCE_PAGE_DEFAULT_LIMIT);
    expect(clampAttendanceLimit(0)).toBe(ATTENDANCE_PAGE_DEFAULT_LIMIT);
    expect(clampAttendanceLimit(-1)).toBe(ATTENDANCE_PAGE_DEFAULT_LIMIT);
    expect(clampAttendanceLimit(NaN)).toBe(ATTENDANCE_PAGE_DEFAULT_LIMIT);
  });

  it("max を超えると max にクランプ", () => {
    expect(clampAttendanceLimit(99999)).toBe(ATTENDANCE_PAGE_MAX_LIMIT);
  });

  it("範囲内の整数はそのまま", () => {
    expect(clampAttendanceLimit(25)).toBe(25);
  });
});

describe("AttendanceProvider.findByMemberId", () => {
  it("limit 未指定なら default 件数 + hasMore=false（全件）", async () => {
    const db = new MemoryDb();
    db.rows = Array.from({ length: 10 }, (_, i) => ({
      session_id: `s_${String(i).padStart(3, "0")}`,
      title: `t${i}`,
      held_on: `2026-01-${String(i + 1).padStart(2, "0")}`,
    }));
    const provider = createAttendanceProvider(ctx(db));
    const result = await provider.findByMemberId(asMemberId("m_001"));
    expect(result.records).toHaveLength(10);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();
    expect(db.preparedSqls[0]).toMatch(/ms\.deleted_at IS NULL/);
  });

  it("件数が limit を超えると hasMore=true + nextCursor 返却", async () => {
    const db = new MemoryDb();
    db.rows = Array.from({ length: 5 }, (_, i) => ({
      session_id: `s_${i}`,
      title: `t${i}`,
      held_on: `2026-01-${String(i + 1).padStart(2, "0")}`,
    }));
    const provider = createAttendanceProvider(ctx(db));
    const result = await provider.findByMemberId(asMemberId("m_001"), { limit: 3 });
    expect(result.records).toHaveLength(3);
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).not.toBeNull();
    // sort: held_on DESC. 1月5日, 4日, 3日 が先頭ページ
    expect(result.records[0]?.heldOn).toBe("2026-01-05");
    expect(result.records[2]?.heldOn).toBe("2026-01-03");
    const decoded = decodeAttendanceCursor(result.nextCursor!);
    expect(decoded).toEqual({ heldOn: "2026-01-03", sessionId: "s_2" });
  });

  it("cursor 指定で次ページが取れる", async () => {
    const db = new MemoryDb();
    db.rows = Array.from({ length: 5 }, (_, i) => ({
      session_id: `s_${i}`,
      title: `t${i}`,
      held_on: `2026-01-${String(i + 1).padStart(2, "0")}`,
    }));
    const provider = createAttendanceProvider(ctx(db));
    const first = await provider.findByMemberId(asMemberId("m_001"), { limit: 3 });
    const second = await provider.findByMemberId(asMemberId("m_001"), {
      limit: 3,
      cursor: decodeAttendanceCursor(first.nextCursor!)!,
    });
    expect(second.records).toHaveLength(2);
    expect(second.records.map((r) => r.heldOn)).toEqual(["2026-01-02", "2026-01-01"]);
    expect(second.hasMore).toBe(false);
    expect(second.nextCursor).toBeNull();
  });

  it("limit が MAX を超えると MAX にクランプされる", async () => {
    const db = new MemoryDb();
    const provider = createAttendanceProvider(ctx(db));
    await provider.findByMemberId(asMemberId("m_001"), { limit: 99999 });
    // bind の最後の引数が limit+1 = MAX+1
    const last = db.bindBatches[0]?.at(-1);
    expect(last).toBe(ATTENDANCE_PAGE_MAX_LIMIT + 1);
  });

  it("空結果でも records=[] / hasMore=false / nextCursor=null", async () => {
    const db = new MemoryDb();
    const provider = createAttendanceProvider(ctx(db));
    const result = await provider.findByMemberId(asMemberId("m_001"));
    expect(result.records).toEqual([]);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();
  });
});
