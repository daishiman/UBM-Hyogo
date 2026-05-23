import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../server-fetch", () => ({
  fetchAdmin: vi.fn(),
}));

import { fetchAdmin } from "../server-fetch";
import { safeServerFetch } from "../safe-server-fetch";

const mockedFetch = vi.mocked(fetchAdmin);

describe("safeServerFetch", () => {
  beforeEach(() => mockedFetch.mockReset());

  it("TC-SSF-01: 成功時は ok=true を返す", async () => {
    mockedFetch.mockResolvedValueOnce({ value: 42 });
    const res = await safeServerFetch<{ value: number }>("/admin/x");
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data.value).toBe(42);
  });

  it("TC-SSF-02: throw 時は ok=false に変換する (status を code に展開)", async () => {
    mockedFetch.mockRejectedValueOnce(new Error("admin api /admin/x failed: 500"));
    const res = await safeServerFetch("/admin/x");
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.code).toBe("ADMIN_FETCH_500");
      expect(res.error.message).toContain("500");
    }
  });

  it("TC-SSF-03: Error 以外の throw は UNKNOWN を返す", async () => {
    mockedFetch.mockRejectedValueOnce("string error");
    const res = await safeServerFetch("/admin/x");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("ADMIN_FETCH_UNKNOWN");
  });

  it("TC-SSF-04: 一般 Error は ADMIN_FETCH_FAILED にフォールバック", async () => {
    mockedFetch.mockRejectedValueOnce(new Error("network timeout"));
    const res = await safeServerFetch("/admin/x");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("ADMIN_FETCH_FAILED");
  });
});
