import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  postTrigger: vi.fn(),
  deleteTrigger: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: vi.fn() }),
}));

vi.mock("../../../features/admin/hooks/useAdminMutation", () => ({
  useAdminMutation: (_endpoint: string, method: string) => ({
    trigger: method === "POST" ? mocks.postTrigger : mocks.deleteTrigger,
    isLoading: false,
    error: null,
    reset: vi.fn(),
    abort: vi.fn(),
  }),
}));

import { TagCatalogPanel } from "../TagCatalogPanel";

beforeEach(() => {
  mocks.push.mockClear();
  mocks.postTrigger.mockReset();
  mocks.deleteTrigger.mockReset();
});

afterEach(() => cleanup());

describe("TagCatalogPanel reduce guard", () => {
  it("does not throw when initial is undefined", () => {
    expect(() =>
      render(<TagCatalogPanel initial={undefined} query="" page={1} pageSize={20} />),
    ).not.toThrow();
    expect(screen.getByText("該当するタグはありません")).toBeTruthy();
    expect(screen.getByText("有効 0件")).toBeTruthy();
  });

  it("does not throw when initial.items is null", () => {
    expect(() =>
      render(
        <TagCatalogPanel
          initial={{ total: 3, items: null as never }}
          query=""
          page={1}
          pageSize={20}
        />,
      ),
    ).not.toThrow();
    expect(screen.getByText("全体 3件")).toBeTruthy();
    expect(screen.getByText("page 1 / 1")).toBeTruthy();
  });
});
