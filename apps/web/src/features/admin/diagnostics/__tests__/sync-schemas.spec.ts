import { describe, expect, it } from "vitest";

import { BackfillResultSchema } from "../backfill";
import { SyncResultSchema, SyncRunResponseSchema } from "../manual-sync";

const validBackfill = {
  dryRun: true,
  policy: "auto-publish-on-consent" as const,
  scanned: 10,
  candidates: 2,
  applied: 0,
  skipped: { alreadyPublic: 3, adminExplicit: 1, consentNotMet: 4, deleted: 0 },
};

const validSyncResult = {
  status: "succeeded" as const,
  jobId: "job-1",
  processedCount: 3,
  writeCount: 2,
  cursor: "cursor-1",
};

describe("BackfillResultSchema", () => {
  it("TC-B1 valid parse — endpoint 準拠 object を受理する", () => {
    expect(BackfillResultSchema.parse(validBackfill).candidates).toBe(2);
  });

  it("TC-B2 policy literal — 想定外 policy は reject", () => {
    expect(
      BackfillResultSchema.safeParse({ ...validBackfill, policy: "other" }).success,
    ).toBe(false);
  });

  it("TC-B3 負数 — nonnegative 違反は reject", () => {
    expect(
      BackfillResultSchema.safeParse({ ...validBackfill, scanned: -1 }).success,
    ).toBe(false);
  });

  it("TC-B4 skipped 欠落 — skipped.deleted 欠落は reject", () => {
    const { deleted: _deleted, ...partialSkipped } = validBackfill.skipped;
    expect(
      BackfillResultSchema.safeParse({ ...validBackfill, skipped: partialSkipped })
        .success,
    ).toBe(false);
  });
});

describe("manual-sync schemas", () => {
  it("TC-S1 valid 200 result — SyncResultSchema を受理する", () => {
    expect(SyncResultSchema.parse(validSyncResult).status).toBe("succeeded");
  });

  it("TC-S2 200 wrapper — { ok, result } の result 枝で parse する", () => {
    expect(
      SyncRunResponseSchema.parse({ ok: true, result: validSyncResult }),
    ).toHaveProperty("result.status", "succeeded");
  });

  it("TC-S3 409 wrapper — { ok:false, result: skipped } を parse する", () => {
    expect(
      SyncRunResponseSchema.parse({
        ok: false,
        result: {
          status: "skipped",
          jobId: "job-running",
          processedCount: 0,
          writeCount: 0,
          cursor: null,
          skippedReason: "another response sync is in progress",
        },
      }),
    ).toHaveProperty("result.status", "skipped");
  });

  it("TC-S4 status enum — running は reject（SyncResult から除外）", () => {
    expect(
      SyncResultSchema.safeParse({ ...validSyncResult, status: "running" }).success,
    ).toBe(false);
  });

  it("TC-S5 負数 — writeCount:-1 等 nonnegative 違反は reject", () => {
    expect(
      SyncResultSchema.safeParse({ ...validSyncResult, writeCount: -1 }).success,
    ).toBe(false);
  });

  it("TC-S6 skippedReason optional — 欠落でも success", () => {
    const { skippedReason: _omit, ...withoutReason } = {
      ...validSyncResult,
      skippedReason: "x",
    };
    expect(SyncResultSchema.safeParse(withoutReason).success).toBe(true);
  });

  it("TC-S7 ok:false + non-skipped result は reject", () => {
    expect(
      SyncRunResponseSchema.safeParse({ ok: false, result: validSyncResult }).success,
    ).toBe(false);
  });
});
