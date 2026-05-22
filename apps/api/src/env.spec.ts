// @vitest-environment node
import { describe, expect, expectTypeOf, it } from "vitest";
import type { Env } from "./env";
import { validateAuthSecretEnv } from "./env";
import { ctx } from "./repository/_shared/db";

describe("Env type contract", () => {
  it("exposes wrangler vars and D1 binding through the central Env type", () => {
    expectTypeOf<Env>().toHaveProperty("DB").toEqualTypeOf<D1Database>();
    expectTypeOf<Env>().toHaveProperty("SHEET_ID").toEqualTypeOf<string | undefined>();
    expectTypeOf<Env>().toHaveProperty("SHEETS_SPREADSHEET_ID").toEqualTypeOf<
      string | undefined
    >();
    expectTypeOf<Env>().toHaveProperty("GOOGLE_FORM_ID").toEqualTypeOf<string | undefined>();
  });

  it("keeps repository ctx scoped to the DB binding subset", () => {
    expectTypeOf(ctx).parameter(0).toEqualTypeOf<Pick<Env, "DB">>();
  });
});

describe("validateAuthSecretEnv", () => {
  it("AUTH_SECRET が32文字以上なら通過する", () => {
    expect(validateAuthSecretEnv({ AUTH_SECRET: "a".repeat(32) })).toEqual({
      AUTH_SECRET: "a".repeat(32),
    });
  });

  it("AUTH_SECRET が未設定なら fail close", () => {
    expect(() => validateAuthSecretEnv({})).toThrow();
  });

  it("AUTH_SECRET が空白または短すぎる場合は fail close", () => {
    expect(() => validateAuthSecretEnv({ AUTH_SECRET: "   " })).toThrow();
    expect(() => validateAuthSecretEnv({ AUTH_SECRET: "short" })).toThrow();
  });
});
