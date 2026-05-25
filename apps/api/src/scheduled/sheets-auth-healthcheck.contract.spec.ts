// UT-25-DERIV-02: healthcheck の 4 分岐 (200/401/403/500) と alert-relay POST を検証する。
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runSheetsAuthHealthcheck } from "./sheets-auth-healthcheck";
import { SheetsFetchError, type SheetsFetcher } from "../jobs/sheets-fetcher";
import type { Env } from "../env";

const baseEnv = {
  GOOGLE_SERVICE_ACCOUNT_JSON: "dummy",
  SHEETS_SPREADSHEET_ID: "sheet-id",
  API_INTERNAL_BASE_URL: "https://api.example.com",
  INTERNAL_ALERT_TOKEN: "tok",
} as unknown as Env;

const dummyEvent = { cron: "*/15 * * * *" } as unknown as ScheduledController;

function makeFetcher(impl: (range: string) => Promise<unknown>): SheetsFetcher {
  return {
    fetchRange: impl as SheetsFetcher["fetchRange"],
  };
}

describe("runSheetsAuthHealthcheck", () => {
  let errSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    errSpy.mockRestore();
  });

  it("200 OK の場合 ok=true / alert-relay POST されない", async () => {
    const fetcher = makeFetcher(async () => ({ range: "A1:A1", values: [] }));
    const fetchSpy = vi.fn();
    const result = await runSheetsAuthHealthcheck(baseEnv, dummyEvent, {
      fetcher,
      fetch: fetchSpy,
    });
    expect(result.ok).toBe(true);
    expect(result.classification.code).toBe("SHEETS_AUTH_OTHER");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("401 の場合 alert-relay へ POST 1 回 / payload に category=sheets-auth を含む", async () => {
    const fetcher = makeFetcher(async () => {
      throw new SheetsFetchError("unauthorized", 401);
    });
    const fetchSpy = vi.fn(async () => new Response("{}", { status: 200 }));
    const result = await runSheetsAuthHealthcheck(baseEnv, dummyEvent, {
      fetcher,
      fetch: fetchSpy as unknown as typeof fetch,
    });
    expect(result.ok).toBe(false);
    expect(result.classification.code).toBe("SHEETS_AUTH_401_KEY_INVALID");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const calls = fetchSpy.mock.calls as unknown as Array<[unknown, RequestInit]>;
    expect(String(calls[0]![0])).toBe("https://api.example.com/internal/alert-relay");
    const body = JSON.parse(String(calls[0]![1].body));
    expect(body.category).toBe("sheets-auth");
    expect(body.code).toBe("SHEETS_AUTH_401_KEY_INVALID");
  });

  it("INTERNAL_ALERT_TOKEN 未設定でも CF_WEBHOOK_AUTH_SECRET で alert-relay POST する", async () => {
    const fetcher = makeFetcher(async () => {
      throw new SheetsFetchError("unauthorized", 401);
    });
    const fetchSpy = vi.fn(async () => new Response("{}", { status: 200 }));
    const env = {
      ...baseEnv,
      INTERNAL_ALERT_TOKEN: undefined,
      CF_WEBHOOK_AUTH_SECRET: "cf-secret",
    } as unknown as Env;

    await runSheetsAuthHealthcheck(env, dummyEvent, {
      fetcher,
      fetch: fetchSpy as unknown as typeof fetch,
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const calls = fetchSpy.mock.calls as unknown as Array<[unknown, RequestInit]>;
    expect(String(calls[0]![0])).toBe("https://api.example.com/internal/alert-relay");
    expect(calls[0]![1].headers).toMatchObject({ "cf-webhook-auth": "cf-secret" });
  });

  it("403 の場合 SHEETS_AUTH_403_FORBIDDEN で alert-relay POST", async () => {
    const fetcher = makeFetcher(async () => {
      throw new SheetsFetchError("forbidden", 403);
    });
    const fetchSpy = vi.fn(async () => new Response("{}", { status: 200 }));
    const result = await runSheetsAuthHealthcheck(baseEnv, dummyEvent, {
      fetcher,
      fetch: fetchSpy as unknown as typeof fetch,
    });
    expect(result.classification.code).toBe("SHEETS_AUTH_403_FORBIDDEN");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("500 は isAuthFailure=false / alert-relay POST されない", async () => {
    const fetcher = makeFetcher(async () => {
      throw new SheetsFetchError("server error", 500);
    });
    const fetchSpy = vi.fn();
    const result = await runSheetsAuthHealthcheck(baseEnv, dummyEvent, {
      fetcher,
      fetch: fetchSpy as unknown as typeof fetch,
    });
    expect(result.classification.code).toBe("SHEETS_AUTH_OTHER");
    expect(result.classification.isAuthFailure).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("alert-relay POST が throw しても healthcheck は rethrow しない", async () => {
    const fetcher = makeFetcher(async () => {
      throw new SheetsFetchError("u", 401);
    });
    const fetchSpy = vi.fn(async () => {
      throw new TypeError("relay down");
    });
    const result = await runSheetsAuthHealthcheck(baseEnv, dummyEvent, {
      fetcher,
      fetch: fetchSpy as unknown as typeof fetch,
    });
    expect(result.ok).toBe(false);
    expect(result.classification.code).toBe("SHEETS_AUTH_401_KEY_INVALID");
  });

  it("env 未設定 (SA / spreadsheetId) は skip 扱いで ok=true", async () => {
    const env = { ...baseEnv, GOOGLE_SERVICE_ACCOUNT_JSON: undefined } as unknown as Env;
    const result = await runSheetsAuthHealthcheck(env, dummyEvent);
    expect(result.ok).toBe(true);
    expect(result.classification.message).toContain("skipped");
  });
});
