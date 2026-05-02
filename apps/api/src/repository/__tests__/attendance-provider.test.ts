import { describe, it, expect } from "vitest";
import {
  createAttendanceProvider,
  ATTENDANCE_BIND_CHUNK_SIZE,
} from "../attendance";
import type { AttendanceProvider } from "../attendance";
import type { D1Db, D1Stmt, DbCtx } from "../_shared/db";
import type { MemberId } from "../_shared/brand";
import { asMemberId } from "../_shared/brand";

interface AttendanceRow {
  member_id: string;
  session_id: string;
  title: string;
  held_on: string;
}

interface SessionRow {
  session_id: string;
  title: string;
  held_on: string;
}

class MemoryDb implements D1Db {
  attendance: AttendanceRow[] = [];
  sessions: SessionRow[] = [];
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
        // INNER JOIN を再現
        const memberSet = new Set(bindings as string[]);
        const sessionMap = new Map(self.sessions.map((s) => [s.session_id, s]));
        const out: AttendanceRow[] = [];
        for (const a of self.attendance) {
          if (!memberSet.has(a.member_id)) continue;
          const sess = sessionMap.get(a.session_id);
          if (!sess) continue; // 削除済み meeting 除外
          out.push({
            member_id: a.member_id,
            session_id: sess.session_id,
            title: sess.title,
            held_on: sess.held_on,
          });
        }
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

describe("AttendanceProvider", () => {
  it("空配列入力で D1 にクエリを発行せず空 Map を返す", async () => {
    const db = new MemoryDb();
    const provider: AttendanceProvider = createAttendanceProvider(ctx(db));
    const result = await provider.findByMemberIds([]);
    expect(result.size).toBe(0);
    expect(db.preparedSqls).toHaveLength(0);
  });

  it("attendance 0 件の member は Map に entry を作らない", async () => {
    const db = new MemoryDb();
    const provider = createAttendanceProvider(ctx(db));
    const result = await provider.findByMemberIds([asMemberId("m_001")]);
    expect(result.has(asMemberId("m_001"))).toBe(false);
  });

  it("attendance 1 件を取得できる", async () => {
    const db = new MemoryDb();
    db.sessions = [{ session_id: "s_001", title: "総会", held_on: "2026-01-15" }];
    db.attendance = [
      { member_id: "m_001", session_id: "s_001", title: "", held_on: "" },
    ];
    const provider = createAttendanceProvider(ctx(db));
    const result = await provider.findByMemberIds([asMemberId("m_001")]);
    expect(result.get(asMemberId("m_001"))).toEqual([
      { sessionId: "s_001", title: "総会", heldOn: "2026-01-15" },
    ]);
  });

  it("複数 member の attendance N 件を member ごとにバケット化する", async () => {
    const db = new MemoryDb();
    db.sessions = [
      { session_id: "s_001", title: "1月会", held_on: "2026-01-15" },
      { session_id: "s_002", title: "2月会", held_on: "2026-02-15" },
    ];
    db.attendance = [
      { member_id: "m_001", session_id: "s_001", title: "", held_on: "" },
      { member_id: "m_001", session_id: "s_002", title: "", held_on: "" },
      { member_id: "m_002", session_id: "s_002", title: "", held_on: "" },
    ];
    const provider = createAttendanceProvider(ctx(db));
    const result = await provider.findByMemberIds([
      asMemberId("m_001"),
      asMemberId("m_002"),
    ]);
    expect(result.get(asMemberId("m_001"))).toHaveLength(2);
    expect(result.get(asMemberId("m_002"))).toHaveLength(1);
  });

  it("削除済み meeting（meeting_sessions に存在しない session）は除外される", async () => {
    const db = new MemoryDb();
    db.sessions = [{ session_id: "s_alive", title: "現存", held_on: "2026-03-01" }];
    db.attendance = [
      { member_id: "m_001", session_id: "s_alive", title: "", held_on: "" },
      { member_id: "m_001", session_id: "s_deleted", title: "", held_on: "" },
    ];
    const provider = createAttendanceProvider(ctx(db));
    const result = await provider.findByMemberIds([asMemberId("m_001")]);
    expect(result.get(asMemberId("m_001"))?.map((r) => r.sessionId)).toEqual([
      "s_alive",
    ]);
  });

  it("同一 member の同一 session 重複登録は 1 件に正規化", async () => {
    const db = new MemoryDb();
    db.sessions = [{ session_id: "s_001", title: "重複検証", held_on: "2026-04-01" }];
    db.attendance = [
      { member_id: "m_001", session_id: "s_001", title: "", held_on: "" },
      { member_id: "m_001", session_id: "s_001", title: "", held_on: "" },
    ];
    const provider = createAttendanceProvider(ctx(db));
    const result = await provider.findByMemberIds([asMemberId("m_001")]);
    expect(result.get(asMemberId("m_001"))).toHaveLength(1);
  });

  it("held_on DESC でソートされる", async () => {
    const db = new MemoryDb();
    db.sessions = [
      { session_id: "s_old", title: "古い", held_on: "2026-01-01" },
      { session_id: "s_new", title: "新しい", held_on: "2026-06-01" },
      { session_id: "s_mid", title: "中間", held_on: "2026-03-01" },
    ];
    db.attendance = [
      { member_id: "m_001", session_id: "s_old", title: "", held_on: "" },
      { member_id: "m_001", session_id: "s_new", title: "", held_on: "" },
      { member_id: "m_001", session_id: "s_mid", title: "", held_on: "" },
    ];
    const provider = createAttendanceProvider(ctx(db));
    const result = await provider.findByMemberIds([asMemberId("m_001")]);
    expect(result.get(asMemberId("m_001"))?.map((r) => r.sessionId)).toEqual([
      "s_new",
      "s_mid",
      "s_old",
    ]);
  });

  it("100 件超の memberId はチャンク分割で複数クエリに分かれる（bind 上限保護）", async () => {
    const db = new MemoryDb();
    const memberCount = ATTENDANCE_BIND_CHUNK_SIZE * 2 + 5; // 165
    const ids: MemberId[] = Array.from({ length: memberCount }, (_, i) =>
      asMemberId(`m_${String(i).padStart(4, "0")}`),
    );
    const provider = createAttendanceProvider(ctx(db));
    await provider.findByMemberIds(ids);

    // チャンク数 = ceil(165 / 80) = 3
    expect(db.preparedSqls).toHaveLength(3);
    expect(db.bindBatches[0]).toHaveLength(ATTENDANCE_BIND_CHUNK_SIZE);
    expect(db.bindBatches[1]).toHaveLength(ATTENDANCE_BIND_CHUNK_SIZE);
    expect(db.bindBatches[2]).toHaveLength(5);
  });

  it("入力 memberId の重複は dedupe される", async () => {
    const db = new MemoryDb();
    const provider = createAttendanceProvider(ctx(db));
    await provider.findByMemberIds([
      asMemberId("m_001"),
      asMemberId("m_001"),
      asMemberId("m_002"),
    ]);
    expect(db.bindBatches[0]).toHaveLength(2);
  });

  it("発行 SQL は INNER JOIN + IN(?,?,...) のバッチクエリで N+1 を発生させない", async () => {
    const db = new MemoryDb();
    db.sessions = [{ session_id: "s_001", title: "x", held_on: "2026-01-01" }];
    db.attendance = [
      { member_id: "m_001", session_id: "s_001", title: "", held_on: "" },
      { member_id: "m_002", session_id: "s_001", title: "", held_on: "" },
      { member_id: "m_003", session_id: "s_001", title: "", held_on: "" },
    ];
    const provider = createAttendanceProvider(ctx(db));
    await provider.findByMemberIds([
      asMemberId("m_001"),
      asMemberId("m_002"),
      asMemberId("m_003"),
    ]);
    expect(db.preparedSqls).toHaveLength(1); // N+1 なし
    expect(db.preparedSqls[0]).toMatch(/INNER JOIN meeting_sessions/);
    expect(db.preparedSqls[0]).toMatch(/member_id IN \(/);
  });
});
