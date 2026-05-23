// UT-25-DERIV-02: classifier 純関数の unit test
import { describe, expect, it } from "vitest";
import { classifySheetsAuthError } from "./sheets-auth-classifier";
import { SheetsFetchError } from "./sheets-fetcher";

describe("classifySheetsAuthError", () => {
  it("401 を SHEETS_AUTH_401_KEY_INVALID に分類する", () => {
    const r = classifySheetsAuthError(new SheetsFetchError("unauthorized", 401));
    expect(r.code).toBe("SHEETS_AUTH_401_KEY_INVALID");
    expect(r.status).toBe(401);
    expect(r.isAuthFailure).toBe(true);
  });

  it("403 を SHEETS_AUTH_403_FORBIDDEN に分類する", () => {
    const r = classifySheetsAuthError(new SheetsFetchError("forbidden", 403));
    expect(r.code).toBe("SHEETS_AUTH_403_FORBIDDEN");
    expect(r.status).toBe(403);
    expect(r.isAuthFailure).toBe(true);
  });

  it("500 を SHEETS_AUTH_OTHER として透過する (isAuthFailure=false)", () => {
    const r = classifySheetsAuthError(new SheetsFetchError("server error", 500));
    expect(r.code).toBe("SHEETS_AUTH_OTHER");
    expect(r.status).toBe(500);
    expect(r.isAuthFailure).toBe(false);
  });

  it("429 を SHEETS_AUTH_OTHER として透過する", () => {
    const r = classifySheetsAuthError(new SheetsFetchError("rate limit", 429));
    expect(r.code).toBe("SHEETS_AUTH_OTHER");
    expect(r.isAuthFailure).toBe(false);
  });

  it("network error (非 SheetsFetchError) は OTHER + status=null", () => {
    const r = classifySheetsAuthError(new TypeError("fetch failed"));
    expect(r.code).toBe("SHEETS_AUTH_OTHER");
    expect(r.status).toBeNull();
    expect(r.isAuthFailure).toBe(false);
  });

  it("非 Error の throw 値は String 化して OTHER", () => {
    const r = classifySheetsAuthError("string error");
    expect(r.code).toBe("SHEETS_AUTH_OTHER");
    expect(r.message).toBe("string error");
    expect(r.isAuthFailure).toBe(false);
  });

  it("500 文字超の message を 500 文字に trim する", () => {
    const long = "x".repeat(600);
    const r = classifySheetsAuthError(new SheetsFetchError(long, 401));
    expect(r.message.length).toBe(500);
  });
});
