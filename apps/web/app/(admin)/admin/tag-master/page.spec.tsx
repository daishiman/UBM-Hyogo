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
  it("GET /admin/tags の { items, total } を TagMasterPanel に渡す", async () => {
    vi.mocked(safeServerFetch).mockResolvedValueOnce({
      ok: true,
      data: {
        total: 1,
        items: [{ tagId: "tag_1", code: "mentor", label: "メンター", category: "role" }],
      },
    });

    render(await AdminTagMasterPage());

    expect(safeServerFetch).toHaveBeenCalledWith("/admin/tags?page=1&pageSize=100");
    expect(screen.getByRole("button", { name: /メンター/ })).toBeDefined();
    expect(screen.getByText("1/1件")).toBeDefined();
  });
});
