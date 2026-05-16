import { describe, expect, expectTypeOf, it } from "vitest";
import {
  useAdminMutation,
  type AdminMutationKind,
  type AdminMutationOptions,
  type AdminMutationResult,
} from "../useAdminMutation";

describe("useAdminMutation contract", () => {
  it("exports the skeleton hook signature", () => {
    expectTypeOf(useAdminMutation).toBeFunction();
    expectTypeOf(useAdminMutation).parameter(0).toEqualTypeOf<AdminMutationKind>();
    expectTypeOf(useAdminMutation)
      .parameter(1)
      .toEqualTypeOf<AdminMutationOptions | undefined>();
    expectTypeOf(useAdminMutation).returns.toEqualTypeOf<AdminMutationResult>();
  });

  it("keeps the step-01 sentinel visible until the real implementation lands", () => {
    expect(() => useAdminMutation("patchMemberStatus")).toThrow(
      "implementation in step-01",
    );
  });

  it("re-exports through the admin hooks barrel", async () => {
    const mod = await import("../index");
    expect(mod.useAdminMutation).toBe(useAdminMutation);
  });
});
