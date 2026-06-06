import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchAllTagMaster,
  fetchTagMaster,
  type AdminTagRef,
} from "../members";

type FetchMock = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

const tag = (id: number): AdminTagRef => ({
  tagId: `tag_${id}`,
  code: `code-${id}`,
  label: `Tag ${id}`,
  category: id % 2 === 0 ? "even" : "odd",
});

const response = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("admin members tag master client", () => {
  it("TC-API-TM-01: query options are normalized", async () => {
    const fetchSpy = vi.fn<FetchMock>(async () => response({ total: 0, items: [] }));
    vi.stubGlobal("fetch", fetchSpy);

    await fetchTagMaster({ q: " eng ", page: 2, pageSize: 50 });

    const url = new URL(String(fetchSpy.mock.calls[0]?.[0]), "http://localhost");
    expect(url.pathname).toBe("/api/admin/tags");
    expect(url.searchParams.get("q")).toBe("eng");
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("pageSize")).toBe("50");
  });

  it("TC-API-TM-02: defaults to first page and pageSize 100", async () => {
    const fetchSpy = vi.fn<FetchMock>(async () => response({ total: 0, items: [] }));
    vi.stubGlobal("fetch", fetchSpy);

    await fetchTagMaster();

    const url = new URL(String(fetchSpy.mock.calls[0]?.[0]), "http://localhost");
    expect(url.searchParams.get("q")).toBeNull();
    expect(url.searchParams.get("page")).toBe("1");
    expect(url.searchParams.get("pageSize")).toBe("100");
  });

  it("TC-API-TM-03: converts {total, items} into {available, total}", async () => {
    const items = [tag(1), tag(2)];
    vi.stubGlobal("fetch", vi.fn(async () => response({ total: 2, items })));

    await expect(fetchTagMaster()).resolves.toEqual({ available: items, total: 2 });
  });

  it("TC-API-TM-04: falls back to item length when total is absent", async () => {
    const items = [tag(1)];
    vi.stubGlobal("fetch", vi.fn(async () => response({ items })));

    await expect(fetchTagMaster()).resolves.toEqual({ available: items, total: 1 });
  });

  it("TC-API-TM-05: falls back to an empty list when items is absent", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => response({ total: 0 })));

    await expect(fetchTagMaster()).resolves.toEqual({ available: [], total: 0 });
  });

  it("TC-API-TM-06: throws on non-ok HTTP response", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => response({ error: "boom" }, 500)));

    await expect(fetchTagMaster()).rejects.toThrow("HTTP 500");
  });

  it("TC-API-TM-07: walks pages until the last partial page", async () => {
    const first = Array.from({ length: 100 }, (_, i) => tag(i));
    const second = Array.from({ length: 30 }, (_, i) => tag(100 + i));
    const fetchSpy = vi
      .fn<FetchMock>()
      .mockResolvedValueOnce(response({ total: 130, items: first }))
      .mockResolvedValueOnce(response({ total: 130, items: second }));
    vi.stubGlobal("fetch", fetchSpy);

    const result = await fetchAllTagMaster();

    expect(result.available).toHaveLength(130);
    expect(result.total).toBe(130);
    expect(result.truncated).toBe(false);
    expect(String(fetchSpy.mock.calls[0]?.[0])).toContain("page=1&pageSize=100");
    expect(String(fetchSpy.mock.calls[1]?.[0])).toContain("page=2&pageSize=100");
  });

  it("TC-API-TM-08: caps large catalogs and marks them truncated", async () => {
    const full = Array.from({ length: 100 }, (_, i) => tag(i));
    const fetchSpy = vi.fn<FetchMock>(async () => response({ total: 220, items: full }));
    vi.stubGlobal("fetch", fetchSpy);

    const result = await fetchAllTagMaster(120);

    expect(result.available).toHaveLength(120);
    expect(result.total).toBe(220);
    expect(result.truncated).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("TC-API-TM-09: does not mark complete catalogs as truncated", async () => {
    const items = Array.from({ length: 80 }, (_, i) => tag(i));
    vi.stubGlobal("fetch", vi.fn(async () => response({ total: 80, items })));

    const result = await fetchAllTagMaster();

    expect(result.available).toHaveLength(80);
    expect(result.total).toBe(80);
    expect(result.truncated).toBe(false);
  });

  it("TC-API-TM-11: stops immediately when the first page is empty", async () => {
    const fetchSpy = vi.fn<FetchMock>(async () => response({ total: 0, items: [] }));
    vi.stubGlobal("fetch", fetchSpy);

    const result = await fetchAllTagMaster();

    expect(result).toEqual({ available: [], total: 0, truncated: false });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("TC-API-TM-12: omits q when the search string is blank", async () => {
    const fetchSpy = vi.fn<FetchMock>(async () => response({ total: 0, items: [] }));
    vi.stubGlobal("fetch", fetchSpy);

    await fetchTagMaster({ q: "   ", page: 1, pageSize: 100 });

    const url = new URL(String(fetchSpy.mock.calls[0]?.[0]), "http://localhost");
    expect(url.searchParams.get("q")).toBeNull();
    expect(url.searchParams.get("page")).toBe("1");
    expect(url.searchParams.get("pageSize")).toBe("100");
  });
});
