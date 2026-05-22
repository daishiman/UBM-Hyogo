import { describe, it, expect } from "vitest";
import { createFakeD1 } from "./_shared/__fakes__/fakeD1";
import { enqueue, findById, list, resolve } from "./schemaDiffQueue";
import { asStableKey } from "./_shared/brand";

const seed = () => ({
  tables: {
    schema_diff_queue: [
      { diff_id: "d3", revision_id: "v2", type: "removed", question_id: null, stable_key: null, label: "Z", suggested_stable_key: null, status: "queued", resolved_by: null, resolved_at: null, created_at: "2026-03-01" },
      { diff_id: "d1", revision_id: "v2", type: "changed", question_id: "q1", stable_key: null, label: "A", suggested_stable_key: null, status: "queued", resolved_by: null, resolved_at: null, created_at: "2026-01-01" },
      { diff_id: "d2", revision_id: "v2", type: "added", question_id: "q2", stable_key: "x", label: "B", suggested_stable_key: null, status: "queued", resolved_by: null, resolved_at: null, created_at: "2026-02-01" },
      { diff_id: "d4", revision_id: "v2", type: "added", question_id: "q4", stable_key: "done", label: "Done", suggested_stable_key: null, status: "resolved", resolved_by: "admin", resolved_at: "2026-02-02", created_at: "2026-01-15" },
    ],
  },
  primaryKeys: { schema_diff_queue: ["diff_id"] },
});

describe("schemaDiffQueue repository", () => {
  it("list() 既定で queued を created_at ASC で返す (AC-5)", async () => {
    const fake = createFakeD1(seed());
    const r = await list({ db: fake.d1 });
    expect(r.map((x) => x.diffId)).toEqual(["d1", "d2", "d3"]);
  });

  it("list('added') は queued の added のみ", async () => {
    const fake = createFakeD1(seed());
    const r = await list({ db: fake.d1 }, "added");
    expect(r.map((x) => x.diffId)).toEqual(["d2"]);
  });

  it("findById", async () => {
    const fake = createFakeD1(seed());
    const r = await findById({ db: fake.d1 }, "d1");
    expect(r?.label).toBe("A");
  });

  it("findById 不在は null", async () => {
    const fake = createFakeD1(seed());
    const r = await findById({ db: fake.d1 }, "nope");
    expect(r).toBeNull();
  });

  it("enqueue は新規 diff を保存", async () => {
    const fake = createFakeD1({ tables: { schema_diff_queue: [] }, primaryKeys: { schema_diff_queue: ["diff_id"] } });
    const r = await enqueue(
      { db: fake.d1 },
      {
        diffId: "d9",
        revisionId: "v3",
        type: "added",
        questionId: "q9",
        stableKey: asStableKey("new_key"),
        label: "新規",
        suggestedStableKey: null,
      },
    );
    expect(r.diffId).toBe("d9");
  });

  it("resolve は status='resolved' / resolved_by を設定", async () => {
    const fake = createFakeD1(seed());
    await resolve({ db: fake.d1 }, "d1", "admin1");
    const row = fake.state.tables.schema_diff_queue!.find((r) => r["diff_id"] === "d1")!;
    expect(row["status"]).toBe("resolved");
    expect(row["resolved_by"]).toBe("admin1");
  });

  it("resolve は存在しない diffId を throw", async () => {
    const fake = createFakeD1(seed());
    await expect(resolve({ db: fake.d1 }, "missing", "admin1")).rejects.toThrow("schema diff missing not found");
  });
});
