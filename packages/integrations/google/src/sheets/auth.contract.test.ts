import { describe, expect, expectTypeOf, it } from "vitest";

import {
  type SheetsAccessToken,
  type SheetsAuthEnv,
  getSheetsAccessToken,
} from "./auth";

describe("SheetsAuthEnv contract (AC-5)", () => {
  it("requires GOOGLE_SERVICE_ACCOUNT_JSON and accepts optional SHEETS_SCOPES", () => {
    const minimal: SheetsAuthEnv = { GOOGLE_SERVICE_ACCOUNT_JSON: "{}" };
    const withScopes: SheetsAuthEnv = {
      GOOGLE_SERVICE_ACCOUNT_JSON: "{}",
      SHEETS_SCOPES: "https://www.googleapis.com/auth/spreadsheets.readonly",
    };
    expect(minimal.GOOGLE_SERVICE_ACCOUNT_JSON).toBe("{}");
    expect(withScopes.SHEETS_SCOPES).toContain("spreadsheets");
  });
});

describe("getSheetsAccessToken contract (AC-5)", () => {
  it("returns Promise<{ accessToken: string; expiresAt: number }>", () => {
    expectTypeOf(getSheetsAccessToken).parameter(0).toMatchTypeOf<SheetsAuthEnv>();
    expectTypeOf(getSheetsAccessToken).returns.resolves.toEqualTypeOf<SheetsAccessToken>();
    expectTypeOf<SheetsAccessToken>().toEqualTypeOf<{
      accessToken: string;
      expiresAt: number;
    }>();
  });
});
