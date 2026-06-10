import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { safeServerFetch } from "../../../../src/lib/admin/safe-server-fetch";
import AdminTagMasterPage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("../../../../src/lib/admin/safe-server-fetch", () => ({
  safeServerFetch: vi.fn(),
}));

vi.mock("../../../../src/features/admin/hooks/useAdminMutation", async () => {
  const errors = await import("../../../../src/lib/fetch/errors");
  return {
    FetchAuthedError: errors.FetchAuthedError,
    useAdminMutation: () => ({
      trigger: vi.fn(),
      isLoading: false,
      error: null,
      reset: vi.fn(),
      abort: vi.fn(),
    }),
  };
});

beforeEach(() => {
  vi.mocked(safeServerFetch).mockReset();
});

describe("AdminTagMasterPage", () => {
  it("GET /admin/tags の { items, total } を TagDefinitionPanel に防御正規化して渡す", async () => {
    vi.mocked(safeServerFetch).mockResolvedValueOnce({
      ok: true,
      data: {
        total: 1,
        items: [{ tagId: "tag_1", code: "mentor", label: "メンター", category: "role" }],
      },
    });

    render(await AdminTagMasterPage());

    expect(safeServerFetch).toHaveBeenCalledWith("/admin/tags?page=1&pageSize=100");
    expect(screen.getByRole("heading", { name: "タグ定義" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "タグ一覧" })).toBeDefined();
    expect(screen.getByText("メンター")).toBeDefined();
    expect(screen.getByText("全体 1/1件")).toBeDefined();
  });

  it("items 欠落時も空一覧として render する", async () => {
    vi.mocked(safeServerFetch).mockResolvedValueOnce({
      ok: true,
      data: {},
    });

    render(await AdminTagMasterPage());

    expect(screen.getByText("該当するタグはありません")).toBeDefined();
    expect(screen.getByText("全体 0/0件")).toBeDefined();
  });
});
