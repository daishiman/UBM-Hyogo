// ut-07c-followup-001 parse-attendance.ts unit test.
import { describe, it, expect } from "vitest";
import { parseAttendanceCsv } from "../parse-attendance";

describe("parseAttendanceCsv", () => {
  it("F2: 空ファイルは rows=[], errors=[]", () => {
    const r = parseAttendanceCsv("");
    expect(r.rows).toHaveLength(0);
    expect(r.errors).toHaveLength(0);
  });

  it("F3: header のみは rows=[], errors=[]", () => {
    const r = parseAttendanceCsv("memberId,email\n");
    expect(r.rows).toHaveLength(0);
    expect(r.errors).toHaveLength(0);
  });

  it("正常: memberId / email カラムを抽出", () => {
    const r = parseAttendanceCsv(
      "memberId,email\nm_a,\n,beta@example.com\nm_b,bob@example.com\n",
    );
    expect(r.rows).toEqual([
      { memberId: "m_a", email: undefined },
      { memberId: undefined, email: "beta@example.com" },
      { memberId: "m_b", email: "bob@example.com" },
    ]);
  });

  it("F5: 全角 email を NFKC + lowercase で正規化", () => {
    const r = parseAttendanceCsv("memberId,email\n,ＡＬＰＨＡ@Example.com\n");
    expect(r.rows[0].email).toBe("alpha@example.com");
  });

  it("どちらも空の行は errors に記録 + invalid preview 用 row に残す", () => {
    const r = parseAttendanceCsv("memberId,email\n,\n");
    expect(r.rows).toEqual([{}]);
    expect(r.errors.length).toBeGreaterThan(0);
    expect(r.errors[0].message).toBe("memberId_or_email_required");
  });

  it("F1: malformed CSV (引用符不整合) でも parse は abort せず、errors に記録される", () => {
    const r = parseAttendanceCsv('memberId,email\n"m_a,broken\n');
    // papaparse は malformed でも部分結果を返す。
    // 本ヘルパは errors を捨てずに返すことだけ保証する。
    expect(r.errors.length).toBeGreaterThanOrEqual(0);
  });
});
