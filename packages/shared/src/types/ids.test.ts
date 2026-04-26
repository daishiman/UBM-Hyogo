import { describe, it, expectTypeOf } from "vitest";
import type { MemberId, ResponseId, ResponseEmail, StableKey } from "./ids";

describe("branded types", () => {
  it("MemberId is not assignable from plain string", () => {
    expectTypeOf<string>().not.toMatchTypeOf<MemberId>();
  });
  it("ResponseId is not assignable from plain string", () => {
    expectTypeOf<string>().not.toMatchTypeOf<ResponseId>();
  });
  it("ResponseEmail is not assignable from plain string", () => {
    expectTypeOf<string>().not.toMatchTypeOf<ResponseEmail>();
  });
  it("StableKey is not assignable from plain string", () => {
    expectTypeOf<string>().not.toMatchTypeOf<StableKey>();
  });
});
