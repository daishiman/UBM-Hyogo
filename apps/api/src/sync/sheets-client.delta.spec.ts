// @vitest-environment node
// Branch coverage for sheets-client.ts: createSheetsClient.fetchDelta filter
// paths, normalizeTs, backoffConfigFromEnv parse fallbacks, and the
// fetchWithBackoff default sleep arg. GoogleSheetsFetcher is mocked so no JWT
// signing / network is needed.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchRangeMock = vi.fn();

vi.mock("../jobs/sheets-fetcher", async () => {
  const actual = await vi.importActual<typeof import("../jobs/sheets-fetcher")>(
    "../jobs/sheets-fetcher",
  );
  return {
    ...actual,
    GoogleSheetsFetcher: class {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      constructor(_opts: unknown) {}
      fetchRange(range: string) {
        return fetchRangeMock(range);
      }
    },
  };
});

import {
  createSheetsClient,
  backoffConfigFromEnv,
  fetchWithBackoff,
  RateLimitError,
  DEFAULT_BACKOFF,
} from "./sheets-client";

const opts = {
  spreadsheetId: "sheet-1",
  serviceAccountJson: "{}",
};

describe("createSheetsClient.fetchAll", () => {
  beforeEach(() => fetchRangeMock.mockReset());

  it("delegates fetchAll to the underlying fetcher", async () => {
    const range = { range: "A1:Z", values: [["タイムスタンプ"]] };
    fetchRangeMock.mockResolvedValue(range);
    const client = createSheetsClient(opts);
    await expect(client.fetchAll("A1:Z")).resolves.toBe(range);
    expect(fetchRangeMock).toHaveBeenCalledWith("A1:Z");
  });
});

describe("createSheetsClient.fetchDelta — early-return branches", () => {
  beforeEach(() => fetchRangeMock.mockReset());

  it("returns all rows when cursor is null (no filtering)", async () => {
    const all = { range: "A1:Z", values: [["タイムスタンプ"], ["2026-01-01"]] };
    fetchRangeMock.mockResolvedValue(all);
    const client = createSheetsClient(opts);
    await expect(client.fetchDelta("A1:Z", null)).resolves.toBe(all);
  });

  it("returns all when values is undefined", async () => {
    const all = { range: "A1:Z" };
    fetchRangeMock.mockResolvedValue(all);
    const client = createSheetsClient(opts);
    await expect(client.fetchDelta("A1:Z", "2026-01-01")).resolves.toBe(all);
  });

  it("returns all when values is empty", async () => {
    const all = { range: "A1:Z", values: [] as string[][] };
    fetchRangeMock.mockResolvedValue(all);
    const client = createSheetsClient(opts);
    await expect(client.fetchDelta("A1:Z", "2026-01-01")).resolves.toBe(all);
  });

  it("returns all when no timestamp column is present (tsIdx < 0)", async () => {
    const all = {
      range: "A1:Z",
      values: [
        ["氏名", "メール"],
        ["Alice", "a@example.com"],
      ],
    };
    fetchRangeMock.mockResolvedValue(all);
    const client = createSheetsClient(opts);
    await expect(client.fetchDelta("A1:Z", "2026-01-01")).resolves.toBe(all);
  });
});

describe("createSheetsClient.fetchDelta — row filtering", () => {
  beforeEach(() => fetchRangeMock.mockReset());

  it("matches the english 'timestamp' header alternate and filters by cursor", async () => {
    const all = {
      range: "A1:Z",
      values: [
        ["Name", "Timestamp"],
        ["empty", ""], // dropped: !v
        ["keep-iso", "2026-06-01T00:00:00Z"], // kept: raw >= cursor (short-circuit)
        // raw "2025/..." < cursor at year digit → first operand false → normalizeTs
        // evaluated (covers normalizeTs YYYY/.. branch); normalized still < cursor → dropped
        ["drop-normalized", "2025/12/31 23:00:00"],
        // raw "2026/06/03" with cursor "2026/06/01" style is ISO; here cursor is
        // 2026-01-01 so raw passes via short-circuit but exercises the OR's left side.
        ["keep-slash", "2026/06/03 09:00:00"],
      ],
    };
    fetchRangeMock.mockResolvedValue(all);
    const client = createSheetsClient(opts);
    const result = await client.fetchDelta("A1:Z", "2026-01-01");
    const rows = result.values ?? [];
    expect(rows[0]).toEqual(["Name", "Timestamp"]);
    const names = rows.slice(1).map((r) => r[0]);
    expect(names).toEqual(["keep-iso", "keep-slash"]);
  });

  it("matches japanese 'タイムスタンプ' header and drops rows missing the value", async () => {
    const all = {
      range: "A1:Z",
      values: [
        ["タイムスタンプ", "Name"],
        ["", "no-timestamp"], // dropped: !v
        ["2026-06-05T00:00:00Z", "kept"],
      ],
    };
    fetchRangeMock.mockResolvedValue(all);
    const client = createSheetsClient(opts);
    const result = await client.fetchDelta("A1:Z", "2026-01-01");
    const rows = result.values ?? [];
    expect(rows.slice(1).map((r) => r[1])).toEqual(["kept"]);
  });
});

describe("backoffConfigFromEnv", () => {
  it("uses the parsed value when within range", () => {
    expect(backoffConfigFromEnv({ SYNC_MAX_RETRIES: "2" }).maxRetries).toBe(2);
  });

  it("clamps values above 3 down to 3", () => {
    expect(backoffConfigFromEnv({ SYNC_MAX_RETRIES: "9" }).maxRetries).toBe(3);
  });

  it("falls back to 3 when env is missing (?? '' → NaN)", () => {
    expect(backoffConfigFromEnv({}).maxRetries).toBe(3);
  });

  it("falls back to 3 on a non-numeric value", () => {
    expect(backoffConfigFromEnv({ SYNC_MAX_RETRIES: "abc" }).maxRetries).toBe(3);
  });

  it("falls back to 3 on a negative value", () => {
    expect(backoffConfigFromEnv({ SYNC_MAX_RETRIES: "-1" }).maxRetries).toBe(3);
  });
});

describe("fetchWithBackoff default sleep arg", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("exercises the default setTimeout-based sleep on a retriable error", async () => {
    let n = 0;
    const promise = fetchWithBackoff(
      async () => {
        n += 1;
        if (n < 2) throw new RateLimitError(429);
        return "ok";
      },
      { ...DEFAULT_BACKOFF, baseMs: 10, maxRetries: 2, factor: 2 },
      // no sleep override → default arg path (line 80)
    );
    await vi.advanceTimersByTimeAsync(10);
    await expect(promise).resolves.toEqual({ value: "ok", retryCount: 1 });
  });
});
