import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./safe-server-fetch", () => ({ safeServerFetch: vi.fn() }));

import { countQueuedDiffs, loadSchemaDiffCount } from "./schema-diff-count";
import { safeServerFetch } from "./safe-server-fetch";
import type { SchemaDiffListView } from "../../components/admin/SchemaDiffPanel";

function view(items: Array<{ status: "queued" | "resolved" }>): SchemaDiffListView {
  return { total: items.length, items: items as never };
}

describe("countQueuedDiffs", () => {
  it("queued のみカウントする", () => {
    expect(
      countQueuedDiffs(view([{ status: "queued" }, { status: "queued" }, { status: "resolved" }])),
    ).toBe(2);
  });

  it("空配列は 0", () => {
    expect(countQueuedDiffs(view([]))).toBe(0);
  });
});

describe("loadSchemaDiffCount", () => {
  beforeEach(() => vi.mocked(safeServerFetch).mockReset());

  it("ok 時は queued 件数を返す", async () => {
    vi.mocked(safeServerFetch).mockResolvedValue({
      ok: true,
      data: view([{ status: "queued" }, { status: "resolved" }, { status: "queued" }]),
    });
    expect(await loadSchemaDiffCount()).toBe(2);
  });

  it("fetch 失敗時は 0", async () => {
    vi.mocked(safeServerFetch).mockResolvedValue({
      ok: false,
      error: { code: "ADMIN_FETCH_FAILED", message: "boom" },
    });
    expect(await loadSchemaDiffCount()).toBe(0);
  });
});
