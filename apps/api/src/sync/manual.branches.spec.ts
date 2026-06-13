// @vitest-environment node
// Branch coverage for manual.ts: runFetchMapUpsert default fetchValues paths
// (missing config, SheetsFetchError → RateLimitError, non-retriable rethrow,
// `value.values ?? []`), injected-deps default `now`/`newId`, and the
// manualSyncRoute skipped(409)/failed(500)/success(200) status branches.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const withSyncMutexMock = vi.fn();
const fetchAllMock = vi.fn();
const fetchDeltaMock = vi.fn();
const fetchWithBackoffMock = vi.fn();
const resolveServiceAccountJsonMock = vi.fn();
const logSheetsAuthFailureMock = vi.fn();

vi.mock("./audit", () => ({
  withSyncMutex: (...args: unknown[]) => withSyncMutexMock(...args),
}));

vi.mock("./sheets-client", async () => {
  const actual = await vi.importActual<typeof import("./sheets-client")>(
    "./sheets-client",
  );
  return {
    ...actual,
    createSheetsClient: () => ({
      fetchAll: fetchAllMock,
      fetchDelta: fetchDeltaMock,
    }),
    fetchWithBackoff: (fn: () => Promise<unknown>) => fetchWithBackoffMock(fn),
    backoffConfigFromEnv: () => actual.DEFAULT_BACKOFF,
  };
});

vi.mock("../jobs/sync-sheets-to-d1", () => ({
  resolveServiceAccountJson: (e: unknown) => resolveServiceAccountJsonMock(e),
}));

vi.mock("../jobs/sheets-auth-logger", () => ({
  logSheetsAuthFailure: (...args: unknown[]) => logSheetsAuthFailureMock(...args),
}));

import {
  runFetchMapUpsert,
  runManualSync,
  manualSyncRoute,
} from "./manual";
import { SheetsFetchError } from "./sheets-client";

const stubDb = { batch: vi.fn() } as unknown as D1Database;

const baseEnv = {
  DB: stubDb,
  SHEETS_SPREADSHEET_ID: "sheet-1",
} as unknown as Parameters<typeof runFetchMapUpsert>[0];

beforeEach(() => {
  withSyncMutexMock.mockReset();
  fetchAllMock.mockReset();
  fetchDeltaMock.mockReset();
  fetchWithBackoffMock.mockReset();
  resolveServiceAccountJsonMock.mockReset();
  logSheetsAuthFailureMock.mockReset();
});

describe("runFetchMapUpsert — injected fetchValues", () => {
  it("returns a diff summary from injected values (empty rows skip upsert)", async () => {
    const summary = await runFetchMapUpsert(baseEnv, {
      fetchValues: async () => ({ values: [], retryCount: 2 }),
    });
    expect(summary).toEqual({
      fetched: 0,
      upserted: 0,
      failed: 0,
      retryCount: 2,
      durationMs: 0,
    });
  });
});

describe("runFetchMapUpsert — default fetchValues config guard", () => {
  it("throws when service account JSON is missing (!sa)", async () => {
    resolveServiceAccountJsonMock.mockReturnValue(null);
    await expect(runFetchMapUpsert(baseEnv, {})).rejects.toThrow("未設定");
  });

  it("throws when SHEETS_SPREADSHEET_ID is missing", async () => {
    resolveServiceAccountJsonMock.mockReturnValue("{}");
    const env = { DB: stubDb } as unknown as Parameters<typeof runFetchMapUpsert>[0];
    await expect(runFetchMapUpsert(env, {})).rejects.toThrow("未設定");
  });
});

describe("runFetchMapUpsert — default fetchValues fetch branches", () => {
  beforeEach(() => {
    resolveServiceAccountJsonMock.mockReturnValue("{}");
  });

  it("uses fetchAll when cursorIso is null and tolerates undefined values", async () => {
    // run the inner fetch fn so its branches execute, then surface its result
    fetchWithBackoffMock.mockImplementation(async (fn: () => Promise<unknown>) => ({
      value: await fn(),
      retryCount: 0,
    }));
    fetchAllMock.mockResolvedValue({ range: "r" }); // values undefined → `?? []`
    const summary = await runFetchMapUpsert(baseEnv, {}, null);
    expect(fetchAllMock).toHaveBeenCalled();
    expect(summary.fetched).toBe(0);
  });

  it("uses fetchDelta when cursorIso is provided", async () => {
    fetchWithBackoffMock.mockImplementation(async (fn: () => Promise<unknown>) => ({
      value: await fn(),
      retryCount: 0,
    }));
    fetchDeltaMock.mockResolvedValue({ range: "r", values: [] });
    await runFetchMapUpsert(baseEnv, {}, "2026-01-01T00:00:00Z");
    expect(fetchDeltaMock).toHaveBeenCalled();
  });

  it("maps a 429 SheetsFetchError to a RateLimitError", async () => {
    fetchWithBackoffMock.mockImplementation(async (fn: () => Promise<unknown>) => fn());
    fetchAllMock.mockRejectedValue(new SheetsFetchError("rl", 429));
    await expect(runFetchMapUpsert(baseEnv, {}, null)).rejects.toMatchObject({
      name: "RateLimitError",
    });
    expect(logSheetsAuthFailureMock).not.toHaveBeenCalled();
  });

  it("maps a 503 SheetsFetchError to a RateLimitError", async () => {
    fetchWithBackoffMock.mockImplementation(async (fn: () => Promise<unknown>) => fn());
    fetchAllMock.mockRejectedValue(new SheetsFetchError("srv", 503));
    await expect(runFetchMapUpsert(baseEnv, {}, null)).rejects.toMatchObject({
      name: "RateLimitError",
    });
  });

  it("logs and rethrows a non-retriable SheetsFetchError (status 401)", async () => {
    fetchWithBackoffMock.mockImplementation(async (fn: () => Promise<unknown>) => fn());
    fetchAllMock.mockRejectedValue(new SheetsFetchError("auth", 401));
    await expect(runFetchMapUpsert(baseEnv, {}, null)).rejects.toBeInstanceOf(
      SheetsFetchError,
    );
    expect(logSheetsAuthFailureMock).toHaveBeenCalledWith(
      expect.any(SheetsFetchError),
      expect.objectContaining({ jobName: "manual-sync" }),
    );
  });

  it("logs and rethrows a generic (non-SheetsFetchError) error", async () => {
    fetchWithBackoffMock.mockImplementation(async (fn: () => Promise<unknown>) => fn());
    const err = new Error("boom");
    fetchAllMock.mockRejectedValue(err);
    await expect(runFetchMapUpsert(baseEnv, {}, null)).rejects.toThrow("boom");
    expect(logSheetsAuthFailureMock).toHaveBeenCalled();
  });
});

describe("runManualSync — default now/newId deps", () => {
  it("constructs auditDeps with default now()/newId() and delegates to withSyncMutex", async () => {
    let captured: { now: () => Date; newId: () => string } | undefined;
    withSyncMutexMock.mockImplementation(
      async (deps: { now: () => Date; newId: () => string }) => {
        captured = deps;
        return { status: "success" };
      },
    );
    await runManualSync(baseEnv);
    expect(captured?.now()).toBeInstanceOf(Date);
    expect(typeof captured?.newId()).toBe("string");
  });
});

describe("manualSyncRoute — status branches", () => {
  const token = "sync-token";
  const headers = { authorization: `Bearer ${token}` };
  const env = { ...baseEnv, SYNC_ADMIN_TOKEN: token } as unknown as Record<string, unknown>;

  afterEach(() => withSyncMutexMock.mockReset());

  it("returns 409 when the run is skipped (mutex in progress)", async () => {
    withSyncMutexMock.mockResolvedValue({ status: "skipped", auditId: "a-1" });
    const res = await manualSyncRoute.request("/admin/sync/run", { method: "POST", headers }, env);
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ ok: false, error: "sync_in_progress" });
  });

  it("returns 500 when the run failed", async () => {
    withSyncMutexMock.mockResolvedValue({ status: "failed", auditId: "a-2" });
    const res = await manualSyncRoute.request("/admin/sync/run", { method: "POST", headers }, env);
    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ ok: false });
  });

  it("returns 200 on success", async () => {
    withSyncMutexMock.mockResolvedValue({ status: "success", auditId: "a-3" });
    const res = await manualSyncRoute.request("/admin/sync/run", { method: "POST", headers }, env);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true });
  });
});
