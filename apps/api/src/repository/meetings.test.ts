import { describe, it, expect } from "vitest";
import { createFakeD1 } from "./_shared/__fakes__/fakeD1";
import { findMeetingById, insertMeeting, listMeetings, listRecentMeetings } from "./meetings";

const baseSpec = {
  tables: {
    meeting_sessions: [
      {
        session_id: "s1",
        title: "第1回",
        held_on: "2026-01-10",
        note: null,
        created_at: "2026-01-01",
        created_by: "admin1",
      },
      {
        session_id: "s2",
        title: "第2回",
        held_on: "2026-02-10",
        note: "オンライン",
        created_at: "2026-02-01",
        created_by: "admin1",
      },
    ],
  },
  primaryKeys: { meeting_sessions: ["session_id"] },
};

describe("meetings repository", () => {
  it("findMeetingById は session_id で 1 件返す", async () => {
    const fake = createFakeD1(baseSpec);
    const r = await findMeetingById({ db: fake.d1 }, "s1");
    expect(r?.title).toBe("第1回");
  });

  it("findMeetingById 見つからない場合は null", async () => {
    const fake = createFakeD1(baseSpec);
    const r = await findMeetingById({ db: fake.d1 }, "missing");
    expect(r).toBeNull();
  });

  it("listMeetings は held_on DESC で並ぶ", async () => {
    const fake = createFakeD1(baseSpec);
    const r = await listMeetings({ db: fake.d1 }, 10, 0);
    expect(r.map((m) => m.sessionId)).toEqual(["s2", "s1"]);
  });

  it("listRecentMeetings は LIMIT を反映", async () => {
    const fake = createFakeD1(baseSpec);
    const r = await listRecentMeetings({ db: fake.d1 }, 1);
    expect(r).toHaveLength(1);
    expect(r[0]!.sessionId).toBe("s2");
  });

  it("insertMeeting は新規行を保存して返す", async () => {
    const fake = createFakeD1({ tables: { meeting_sessions: [] }, primaryKeys: { meeting_sessions: ["session_id"] } });
    const r = await insertMeeting(
      { db: fake.d1 },
      { sessionId: "s9", title: "新規", heldOn: "2026-04-01", note: null, createdBy: "admin2" },
    );
    expect(r.sessionId).toBe("s9");
    expect(fake.state.tables.meeting_sessions).toHaveLength(1);
  });
});
