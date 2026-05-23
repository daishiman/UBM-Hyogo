// UT-25-DERIV-02: logger 構造化出力の unit test
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logSheetsAuthFailure } from "./sheets-auth-logger";
import { SheetsFetchError } from "./sheets-fetcher";

describe("logSheetsAuthFailure", () => {
  let errSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    errSpy.mockRestore();
  });

  it("401 のとき event=sheets.auth.failure / code=KEY_INVALID で出力する", () => {
    const cls = logSheetsAuthFailure(new SheetsFetchError("u", 401), {
      jobName: "backfill",
      isolateId: "iso-1",
      spreadsheetId: "sheet-A",
      ts: "2026-05-22T00:00:00.000Z",
    });
    expect(cls.code).toBe("SHEETS_AUTH_401_KEY_INVALID");
    expect(errSpy).toHaveBeenCalledTimes(1);
    const payload = errSpy.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload).toMatchObject({
      event: "sheets.auth.failure",
      code: "SHEETS_AUTH_401_KEY_INVALID",
      status: 401,
      jobName: "backfill",
      isolateId: "iso-1",
      spreadsheetId: "sheet-A",
      ts: "2026-05-22T00:00:00.000Z",
    });
    expect(typeof payload.message).toBe("string");
  });

  it("500 のとき event=sheets.auth.transient で出力する", () => {
    logSheetsAuthFailure(new SheetsFetchError("s", 500), {
      jobName: "manual-sync",
    });
    const payload = errSpy.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload.event).toBe("sheets.auth.transient");
    expect(payload.code).toBe("SHEETS_AUTH_OTHER");
  });

  it("ts 未指定時に ISO 8601 string を埋める", () => {
    logSheetsAuthFailure(new SheetsFetchError("u", 403), {
      jobName: "sheets-auth-healthcheck",
    });
    const payload = errSpy.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(String(payload.ts)).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});
