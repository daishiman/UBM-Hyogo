import { describe, it, expectTypeOf } from "vitest";
import type {
  MemberId,
  ResponseId,
  ResponseEmail,
  StableKey,
  SessionId,
  TagId,
  AdminId,
} from "./ids";
import {
  asMemberId,
  asResponseId,
  asResponseEmail,
  asStableKey,
  asSessionId,
  asTagId,
  asAdminId,
  BRANDED_KIND_LIST,
} from "./ids";

describe("branded types — distinct identity (AC-2 / AC-7)", () => {
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
  it("SessionId is not assignable from plain string", () => {
    expectTypeOf<string>().not.toMatchTypeOf<SessionId>();
  });
  it("TagId is not assignable from plain string", () => {
    expectTypeOf<string>().not.toMatchTypeOf<TagId>();
  });
  it("AdminId is not assignable from plain string", () => {
    expectTypeOf<string>().not.toMatchTypeOf<AdminId>();
  });

  it("MemberId and ResponseId are mutually distinct (AC-7)", () => {
    expectTypeOf<MemberId>().not.toMatchTypeOf<ResponseId>();
    expectTypeOf<ResponseId>().not.toMatchTypeOf<MemberId>();
  });

  it("BRANDED_KIND_LIST exports all 7 kinds (AC-2)", () => {
    expectTypeOf(BRANDED_KIND_LIST).toEqualTypeOf<
      readonly [
        "MemberId",
        "ResponseId",
        "ResponseEmail",
        "StableKey",
        "SessionId",
        "TagId",
        "AdminId",
      ]
    >();
  });

  it("smart constructors return branded value at runtime", () => {
    const m: MemberId = asMemberId("m_1");
    const r: ResponseId = asResponseId("r_1");
    const e: ResponseEmail = asResponseEmail("a@example.com");
    const k: StableKey = asStableKey("fullName");
    const s: SessionId = asSessionId("sess_1");
    const t: TagId = asTagId("tag_1");
    const a: AdminId = asAdminId("admin_1");
    [m, r, e, k, s, t, a].forEach((value) => {
      expectTypeOf(value).toBeString();
    });
  });
});
