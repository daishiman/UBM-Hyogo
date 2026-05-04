import { describe, it, expect } from "vitest";
import { createFakeD1 } from "./_shared/__fakes__/fakeD1";
import { addAttendance, listAttendableMembers, listAttendanceByMember, listAttendanceBySession, removeAttendance } from "./attendance";
import { asMemberId } from "./_shared/brand";

const newSpec = () => ({
  tables: {
    meeting_sessions: [{ session_id: "s1", title: "t", held_on: "2026-01-10", note: null, created_at: "2026-01-01", created_by: "admin" }],
    member_attendance: [],
    member_status: [
      { member_id: "m1", is_deleted: 0 },
      { member_id: "m2", is_deleted: 1 },
    ],
    member_identities: [
      { member_id: "m1", current_response_id: "r1" },
      { member_id: "m2", current_response_id: "r2" },
    ],
    member_responses: [
      { response_id: "r1", form_id: "f", revision_id: "v1", schema_hash: "h", search_text: "", submitted_at: "2026-01-01" },
      { response_id: "r2", form_id: "f", revision_id: "v1", schema_hash: "h", search_text: "", submitted_at: "2026-01-01" },
    ],
    members: [
      { member_id: "m1" },
      { member_id: "m2" },
    ],
  },
  primaryKeys: {
    meeting_sessions: ["session_id"],
    member_attendance: ["member_id", "session_id"],
    member_status: ["member_id"],
    members: ["member_id"],
  },
});

describe("attendance repository", () => {
  it("addAttendance: 成功", async () => {
    const fake = createFakeD1(newSpec());
    const r = await addAttendance({ db: fake.d1 }, asMemberId("m1"), "s1", "admin");
    expect(r).toMatchObject({ ok: true, row: { memberId: "m1", sessionId: "s1", assignedBy: "admin" } });
    expect(fake.state.tables.member_attendance).toHaveLength(1);
  });

  it("addAttendance: session_not_found", async () => {
    const fake = createFakeD1(newSpec());
    const r = await addAttendance({ db: fake.d1 }, asMemberId("m1"), "missing", "admin");
    expect(r).toEqual({ ok: false, reason: "session_not_found" });
  });

  it("addAttendance: 削除済み会員 (is_deleted=1) は deleted_member", async () => {
    const fake = createFakeD1(newSpec());
    const r = await addAttendance({ db: fake.d1 }, asMemberId("m2"), "s1", "admin");
    expect(r).toEqual({ ok: false, reason: "deleted_member" });
  });

  it("addAttendance: PK 重複は duplicate (AC-2)", async () => {
    const fake = createFakeD1(newSpec());
    await addAttendance({ db: fake.d1 }, asMemberId("m1"), "s1", "admin");
    const r = await addAttendance({ db: fake.d1 }, asMemberId("m1"), "s1", "admin");
    expect(r).toMatchObject({ ok: false, reason: "duplicate", existing: { memberId: "m1", sessionId: "s1" } });
  });

  it("listAttendanceByMember / listAttendanceBySession", async () => {
    const fake = createFakeD1(newSpec());
    await addAttendance({ db: fake.d1 }, asMemberId("m1"), "s1", "admin");
    expect(await listAttendanceByMember({ db: fake.d1 }, asMemberId("m1"))).toHaveLength(1);
    expect(await listAttendanceBySession({ db: fake.d1 }, "s1")).toHaveLength(1);
  });

  it("removeAttendance は対象を削除", async () => {
    const fake = createFakeD1(newSpec());
    await addAttendance({ db: fake.d1 }, asMemberId("m1"), "s1", "admin");
    const removed = await removeAttendance({ db: fake.d1 }, asMemberId("m1"), "s1");
    expect(removed).toMatchObject({ memberId: "m1", sessionId: "s1" });
    expect(fake.state.tables.member_attendance).toHaveLength(0);
  });

  it("removeAttendance は対象なしなら null", async () => {
    const fake = createFakeD1(newSpec());
    await expect(removeAttendance({ db: fake.d1 }, asMemberId("m1"), "s1")).resolves.toBeNull();
  });

  it("listAttendableMembers は is_deleted=1 を除外 (AC-7)", async () => {
    const fake = createFakeD1(newSpec());
    const r = await listAttendableMembers({ db: fake.d1 }, "s1");
    expect(r.map((m) => m.memberId as string)).toEqual(["m1"]);
  });

  it("listAttendableMembers は登録済み member を除外", async () => {
    const fake = createFakeD1(newSpec());
    await addAttendance({ db: fake.d1 }, asMemberId("m1"), "s1", "admin");
    const r = await listAttendableMembers({ db: fake.d1 }, "s1");
    expect(r).toHaveLength(0);
  });
});
