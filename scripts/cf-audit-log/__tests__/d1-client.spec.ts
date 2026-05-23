import { describe, expect, it } from "vitest";
import {
  count403FromActor,
  InMemoryD1,
  insertEvents,
  isAlreadyReported,
  loadBaseline,
  purgeOlderThan,
  recentEventsInWindow,
  recordReported,
  saveBaseline,
} from "../d1-client.ts";
import type { AuditLogEvent } from "../types.ts";

function ev(id: string, when: string, opts: Partial<AuditLogEvent> = {}): AuditLogEvent {
  return {
    id,
    when,
    actor: { email: "a@b" },
    action: { type: "t", result: "success" },
    ...opts,
  };
}

describe("InMemoryD1 + d1-client helpers", () => {
  it("inserts events and reads them in window", async () => {
    const db = new InMemoryD1();
    await insertEvents(db, [
      ev("1", "2026-05-06T00:00:00Z"),
      ev("2", "2026-05-06T00:30:00Z"),
      ev("3", "2026-05-06T01:30:00Z"),
    ]);
    const out = await recentEventsInWindow(
      db,
      Date.parse("2026-05-06T00:00:00Z"),
      Date.parse("2026-05-06T01:00:00Z"),
    );
    expect(out.map((e) => e.id)).toEqual(["1", "2"]);
  });

  it("purgeOlderThan deletes rows before cutoff", async () => {
    const db = new InMemoryD1();
    await insertEvents(db, [
      ev("old", "2026-04-01T00:00:00Z"),
      ev("new", "2026-05-06T00:00:00Z"),
    ]);
    await purgeOlderThan(db, Date.parse("2026-05-01T00:00:00Z"));
    const out = await recentEventsInWindow(db, 0, Date.parse("2027-01-01T00:00:00Z"));
    expect(out.map((e) => e.id)).toEqual(["new"]);
  });

  it("baseline save/load roundtrip", async () => {
    const db = new InMemoryD1();
    await saveBaseline(db, {
      successPerHourP95: 12,
      failurePerHourP95: 2,
      offHoursRatio: 0.05,
      computedAt: "2026-05-06T00:00:00Z",
      windowDays: 7,
    });
    const b = await loadBaseline(db);
    expect(b?.successPerHourP95).toBe(12);
    expect(b?.windowDays).toBe(7);
  });

  it("dedupe record/check roundtrip", async () => {
    const db = new InMemoryD1();
    expect(await isAlreadyReported(db, "k1")).toBeNull();
    await recordReported(db, "k1", 7);
    expect(await isAlreadyReported(db, "k1")).toBe(7);
  });

  it("count403FromActor", async () => {
    const db = new InMemoryD1();
    await insertEvents(db, [
      ev("1", "2026-05-06T05:00:00Z", {
        action: { type: "t", result: "failure", result_code: 403 },
      }),
      ev("2", "2026-05-06T05:30:00Z", {
        action: { type: "t", result: "failure", result_code: 403 },
      }),
      ev("3", "2026-05-06T05:40:00Z", {
        action: { type: "t", result: "success" },
      }),
    ]);
    const c = await count403FromActor(
      db,
      "a@b",
      Date.parse("2026-05-06T04:00:00Z"),
      Date.parse("2026-05-06T06:00:00Z"),
    );
    expect(c).toBe(2);
  });
});
