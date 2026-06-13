// @vitest-environment node
// Branch coverage for backfill.ts: performBackfill default fetchValues paths
// (missing config, SheetsFetchError → RateLimitError, non-retriable rethrow,
// `value.values ?? []`, empty-rows preflight throw, successful batch),
// injected-deps default now/newId, and backfillSyncRoute skipped/failed/success.
//
// withSyncMutex is mocked to invoke the wrapped body directly so the otherwise
// unexported performBackfill is reached without a real D1 audit ledger.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const withSyncMutexMock = vi.fn();
const fetchAllMock = vi.fn();
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
    createSheetsClient: () => ({ fetchAll: fetchAllMock }),
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

import { runBackfill, backfillSyncRoute } from "./backfill";
import { SheetsFetchError } from "./sheets-client";

// A sheet row that mapSheetRows accepts: header + one valid response row.
// We only need a non-empty mapped result, so include the timestamp + an email.
const headerRow = ["タイムスタンプ", "メールアドレス", "氏名"];
const dataRow = ["2026/06/01 10:00:00", "a@example.com", "Alice"];

const stubDb = {
  prepare: vi.fn(() => ({ bind: vi.fn().mockReturnThis() })),
  batch: vi.fn().mockResolvedValue([]),
} as unknown as D1Database;

const baseEnv = {
  DB: stubDb,
  SHEETS_SPREADSHEET_ID: "sheet-1",
} as unknown as Parameters<typeof runBackfill>[0];

// Make withSyncMutex run the wrapped body and surface success/failure like the
// real implementation, so route status branches can be driven separately.
function passthroughMutex() {
  withSyncMutexMock.mockImplementation(
    async (
      _deps: unknown,
      _trigger: unknown,
      body: (auditId: string) => Promise<unknown>,
    ) => {
      try {
        const summary = await body("audit-1");
        return { status: "success", auditId: "audit-1", ...(summary as object) };
      } catch (err) {
        return {
          status: "failed",
          auditId: "audit-1",
          errorReason: (err as Error).message,
        };
      }
    },
  );
}

beforeEach(() => {
  withSyncMutexMock.mockReset();
  fetchAllMock.mockReset();
  fetchWithBackoffMock.mockReset();
  resolveServiceAccountJsonMock.mockReset();
  logSheetsAuthFailureMock.mockReset();
  (stubDb.batch as ReturnType<typeof vi.fn>).mockClear();
});

describe("performBackfill via runBackfill — injected fetchValues", () => {
  it("performs the truncate+reload batch for non-empty mapped rows", async () => {
    passthroughMutex();
    const result = await runBackfill(baseEnv, {
      fetchValues: async () => ({
        values: [headerRow, dataRow],
        retryCount: 1,
      }),
    });
    expect(result).toMatchObject({ status: "success", retryCount: 1 });
    expect((result as { fetched: number }).fetched).toBeGreaterThan(0);
    expect(stubDb.batch).toHaveBeenCalledOnce();
  });

  it("throws preflight error when no rows map (empty values)", async () => {
    passthroughMutex();
    const result = await runBackfill(baseEnv, {
      fetchValues: async () => ({ values: [], retryCount: 0 }),
    });
    expect(result).toMatchObject({ status: "failed" });
    expect((result as { errorReason: string }).errorReason).toMatch(/preflight/);
  });
});

describe("performBackfill — default fetchValues config guard", () => {
  it("throws when service account JSON is missing", async () => {
    passthroughMutex();
    resolveServiceAccountJsonMock.mockReturnValue(null);
    const result = await runBackfill(baseEnv, {});
    expect(result).toMatchObject({ status: "failed" });
    expect((result as { errorReason: string }).errorReason).toMatch(/未設定/);
  });

  it("throws when SHEETS_SPREADSHEET_ID is missing", async () => {
    passthroughMutex();
    resolveServiceAccountJsonMock.mockReturnValue("{}");
    const env = { DB: stubDb } as unknown as Parameters<typeof runBackfill>[0];
    const result = await runBackfill(env, {});
    expect((result as { errorReason: string }).errorReason).toMatch(/未設定/);
  });
});

describe("performBackfill — default fetchValues fetch branches", () => {
  beforeEach(() => resolveServiceAccountJsonMock.mockReturnValue("{}"));

  it("tolerates undefined values from fetchAll (`?? []`) → preflight fail", async () => {
    passthroughMutex();
    fetchWithBackoffMock.mockImplementation(async (fn: () => Promise<unknown>) => ({
      value: await fn(),
      retryCount: 0,
    }));
    fetchAllMock.mockResolvedValue({ range: "r" }); // no values
    const result = await runBackfill(baseEnv, {});
    // empty mapped rows → preflight throw → failed
    expect(result).toMatchObject({ status: "failed" });
  });

  it("succeeds when fetchAll returns mappable values", async () => {
    passthroughMutex();
    fetchWithBackoffMock.mockImplementation(async (fn: () => Promise<unknown>) => ({
      value: await fn(),
      retryCount: 0,
    }));
    fetchAllMock.mockResolvedValue({ range: "r", values: [headerRow, dataRow] });
    const result = await runBackfill(baseEnv, {});
    expect(result).toMatchObject({ status: "success" });
  });

  it("maps a 500 SheetsFetchError to a RateLimitError", async () => {
    passthroughMutex();
    fetchWithBackoffMock.mockImplementation(async (fn: () => Promise<unknown>) => fn());
    fetchAllMock.mockRejectedValue(new SheetsFetchError("srv", 500));
    const result = await runBackfill(baseEnv, {});
    expect(result).toMatchObject({ status: "failed" });
    expect(logSheetsAuthFailureMock).not.toHaveBeenCalled();
  });

  it("logs and rethrows a non-retriable SheetsFetchError (404)", async () => {
    passthroughMutex();
    fetchWithBackoffMock.mockImplementation(async (fn: () => Promise<unknown>) => fn());
    fetchAllMock.mockRejectedValue(new SheetsFetchError("nf", 404));
    await runBackfill(baseEnv, {});
    expect(logSheetsAuthFailureMock).toHaveBeenCalledWith(
      expect.any(SheetsFetchError),
      expect.objectContaining({ jobName: "backfill" }),
    );
  });

  it("logs and rethrows a generic error", async () => {
    passthroughMutex();
    fetchWithBackoffMock.mockImplementation(async (fn: () => Promise<unknown>) => fn());
    fetchAllMock.mockRejectedValue(new Error("boom"));
    await runBackfill(baseEnv, {});
    expect(logSheetsAuthFailureMock).toHaveBeenCalled();
  });
});

describe("runBackfill — default now/newId deps", () => {
  it("constructs auditDeps with default now()/newId()", async () => {
    let captured: { now: () => Date; newId: () => string } | undefined;
    withSyncMutexMock.mockImplementation(
      async (deps: { now: () => Date; newId: () => string }) => {
        captured = deps;
        return { status: "success" };
      },
    );
    await runBackfill(baseEnv);
    expect(captured?.now()).toBeInstanceOf(Date);
    expect(typeof captured?.newId()).toBe("string");
  });
});

describe("backfillSyncRoute — status branches", () => {
  const token = "sync-token";
  const headers = { authorization: `Bearer ${token}` };
  const env = { ...baseEnv, SYNC_ADMIN_TOKEN: token } as unknown as Record<string, unknown>;

  afterEach(() => withSyncMutexMock.mockReset());

  it("returns 409 when skipped", async () => {
    withSyncMutexMock.mockResolvedValue({ status: "skipped", auditId: "a-1" });
    const res = await backfillSyncRoute.request(
      "/admin/sync/backfill",
      { method: "POST", headers },
      env,
    );
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ ok: false, error: "sync_in_progress" });
  });

  it("returns 500 when failed", async () => {
    withSyncMutexMock.mockResolvedValue({ status: "failed", auditId: "a-2" });
    const res = await backfillSyncRoute.request(
      "/admin/sync/backfill",
      { method: "POST", headers },
      env,
    );
    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ ok: false });
  });

  it("returns 200 on success", async () => {
    withSyncMutexMock.mockResolvedValue({ status: "success", auditId: "a-3" });
    const res = await backfillSyncRoute.request(
      "/admin/sync/backfill",
      { method: "POST", headers },
      env,
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true });
  });
});
