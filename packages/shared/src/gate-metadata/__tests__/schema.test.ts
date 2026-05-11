import { describe, it, expect } from "vitest";
import { GateEntrySchema, GatesArraySchema, GateStatusEnum } from "../schema";

const baseValid = {
  gate_id: "Gate-A",
  status: "passed" as const,
  passed_at: "2026-05-10T00:00:00Z",
  evidence_path: "docs/30-workflows/x/index.md",
  approver: "daishiman",
};

describe("GateEntrySchema", () => {
  it("TC-1: accepts a fully valid passed entry", () => {
    expect(GateEntrySchema.parse(baseValid)).toMatchObject(baseValid);
  });

  it("TC-2: rejects lowercase gate_id", () => {
    expect(() => GateEntrySchema.parse({ ...baseValid, gate_id: "gate-a" })).toThrow();
  });

  it("TC-3: rejects gate_id with dot separator", () => {
    expect(() => GateEntrySchema.parse({ ...baseValid, gate_id: "Gate.A" })).toThrow();
  });

  it("TC-4: accepts hierarchical gate_id (Gate-A-RUNTIME)", () => {
    expect(() =>
      GateEntrySchema.parse({ ...baseValid, gate_id: "Gate-A-RUNTIME" }),
    ).not.toThrow();
  });

  it("TC-5: rejects unknown status", () => {
    expect(() =>
      GateEntrySchema.parse({ ...baseValid, status: "approved" as unknown as never }),
    ).toThrow();
  });

  it("TC-6: rejects non-ISO8601 passed_at", () => {
    expect(() =>
      GateEntrySchema.parse({ ...baseValid, passed_at: "2026/05/10" }),
    ).toThrow();
  });

  it("TC-7: refine rejects status=passed with null passed_at", () => {
    expect(() =>
      GateEntrySchema.parse({ ...baseValid, passed_at: null }),
    ).toThrow(/passed_at must be set/);
  });

  it("TC-8: accepts status=pending with null passed_at", () => {
    expect(() =>
      GateEntrySchema.parse({ ...baseValid, status: "pending", passed_at: null }),
    ).not.toThrow();
  });

  it("rejects status=pending with non-null passed_at", () => {
    expect(() =>
      GateEntrySchema.parse({ ...baseValid, status: "pending" }),
    ).toThrow(/passed_at must be null/);
  });

  it("TC-9: accepts status=failed with null passed_at", () => {
    expect(() =>
      GateEntrySchema.parse({ ...baseValid, status: "failed", passed_at: null }),
    ).not.toThrow();
  });

  it("TC-10: accepts status=waived with null passed_at", () => {
    expect(() =>
      GateEntrySchema.parse({ ...baseValid, status: "waived", passed_at: null }),
    ).not.toThrow();
  });

  it("TC-11: accepts CODEOWNERS-style approver", () => {
    expect(() =>
      GateEntrySchema.parse({ ...baseValid, approver: "CODEOWNERS:apps-api" }),
    ).not.toThrow();
  });

  it("rejects invalid approver text", () => {
    expect(() =>
      GateEntrySchema.parse({ ...baseValid, approver: "not a user" }),
    ).toThrow();
  });

  it("rejects traversal evidence_path before CLI execution", () => {
    expect(() =>
      GateEntrySchema.parse({ ...baseValid, evidence_path: "../outside.md" }),
    ).toThrow(/path traversal/);
  });

  it("rejects absolute evidence_path before CLI execution", () => {
    expect(() =>
      GateEntrySchema.parse({ ...baseValid, evidence_path: "/tmp/outside.md" }),
    ).toThrow(/repo-root relative/);
  });

  it("TC-12: accepts entry with optional notes omitted", () => {
    const { notes: _omit, ...rest } = { ...baseValid, notes: undefined };
    expect(() => GateEntrySchema.parse(rest)).not.toThrow();
  });

  it("GatesArraySchema parses array of valid entries", () => {
    expect(
      GatesArraySchema.parse([
        baseValid,
        { ...baseValid, gate_id: "Gate-B", status: "pending", passed_at: null },
      ]),
    ).toHaveLength(2);
  });

  it("GateStatusEnum exposes all four values", () => {
    expect(GateStatusEnum.options).toEqual(["pending", "passed", "failed", "waived"]);
  });
});
