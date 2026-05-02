import { describe, expectTypeOf, it } from "vitest";
import type { Env } from "./env";
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
