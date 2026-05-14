import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { runWithCompensation, type CompensationStep } from "./transaction";

describe("runWithCompensation", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns results when all steps succeed", async () => {
    const steps: CompensationStep[] = [
      { name: "a", execute: async () => 1, compensate: async () => {} },
      { name: "b", execute: async () => 2, compensate: async () => {} },
    ];
    const out = await runWithCompensation<number>(steps);
    expect(out).toEqual([1, 2]);
  });

  it("rolls back completed steps in reverse order on failure with primaryFailureCode", async () => {
    const order: string[] = [];
    const steps: CompensationStep[] = [
      {
        name: "a",
        execute: async () => "ra",
        compensate: async (r) => {
          order.push(`comp-a:${r as string}`);
        },
      },
      {
        name: "b",
        execute: async () => {
          throw new Error("boom");
        },
        compensate: async () => {},
      },
    ];
    await expect(runWithCompensation(steps)).rejects.toMatchObject({ code: "UBM-5001" });
    expect(order).toEqual(["comp-a:ra"]);
  });

  it("uses compensationFailureCode when a compensate throws", async () => {
    const steps: CompensationStep[] = [
      {
        name: "a",
        execute: async () => "ra",
        compensate: async () => {
          throw new Error("comp-fail");
        },
      },
      {
        name: "b",
        execute: async () => {
          throw new Error("boom");
        },
        compensate: async () => {},
      },
    ];
    await expect(runWithCompensation(steps)).rejects.toMatchObject({ code: "UBM-5101" });
  });

  it("invokes recordDeadLetter and tolerates its failure", async () => {
    const dlq = vi.fn(async () => {
      throw new Error("dlq down");
    });
    const steps: CompensationStep[] = [
      {
        name: "a",
        execute: async () => {
          throw new Error("primary");
        },
        compensate: async () => {},
      },
    ];
    await expect(
      runWithCompensation(steps, { recordDeadLetter: dlq }),
    ).rejects.toMatchObject({ code: "UBM-5001" });
    expect(dlq).toHaveBeenCalledTimes(1);
  });

  it("invokes recordDeadLetter successfully", async () => {
    const dlq = vi.fn(async () => {});
    const steps: CompensationStep[] = [
      {
        name: "a",
        execute: async () => {
          throw new Error("primary");
        },
        compensate: async () => {},
      },
    ];
    await expect(runWithCompensation(steps, { recordDeadLetter: dlq })).rejects.toBeDefined();
    expect(dlq).toHaveBeenCalledTimes(1);
  });

  it("respects custom failure codes", async () => {
    const steps: CompensationStep[] = [
      {
        name: "a",
        execute: async () => {
          throw new Error("x");
        },
        compensate: async () => {},
      },
    ];
    await expect(
      runWithCompensation(steps, {
        primaryFailureCode: "UBM-5500",
        compensationFailureCode: "UBM-6004",
      }),
    ).rejects.toMatchObject({ code: "UBM-5500" });
  });
});
