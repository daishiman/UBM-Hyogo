import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  postTrigger: vi.fn(),
  deactivateTrigger: vi.fn(),
  physicalTrigger: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));

vi.mock("../../../features/admin/hooks/useAdminMutation", () => {
  class FetchAuthedError extends Error {
    readonly status: number;
    readonly bodyText: string;
    constructor(status: number, bodyText: string) {
      super(`fetchAuthed failed: ${status}`);
      this.name = "FetchAuthedError";
      this.status = status;
      this.bodyText = bodyText;
    }
  }
  return {
    FetchAuthedError,
    useAdminMutation: (_endpoint: string, method: string, options?: { successMessage?: string }) => {
      const trigger =
        method === "POST"
          ? mocks.postTrigger
          : options?.successMessage === "タグをしまいました"
            ? mocks.deactivateTrigger
            : mocks.physicalTrigger;
      return {
        trigger,
        isLoading: false,
        error: null,
        reset: vi.fn(),
        abort: vi.fn(),
      };
    },
  };
});

import { FetchAuthedError } from "../../../features/admin/hooks/useAdminMutation";
import { TagCatalogPanel, type TagCatalogListView } from "../TagCatalogPanel";

const initial: TagCatalogListView = {
  total: 2,
  items: [
    {
      tagId: "tag_active",
      code: "active_tag",
      label: "有効タグ",
      category: "role",
      active: true,
    },
    {
      tagId: "tag_inactive",
      code: "inactive_tag",
      label: "停止タグ",
      category: "role",
      active: false,
    },
  ],
};

beforeEach(() => {
  mocks.push.mockClear();
  mocks.refresh.mockClear();
  mocks.postTrigger.mockReset();
  mocks.deactivateTrigger.mockReset();
  mocks.physicalTrigger.mockReset();
  mocks.postTrigger.mockResolvedValue({
    tagId: "tag_inactive",
    code: "inactive_tag",
    label: "停止タグ",
    category: "role",
    active: true,
  });
  mocks.deactivateTrigger.mockResolvedValue(undefined);
  mocks.physicalTrigger.mockResolvedValue(undefined);
});

afterEach(() => cleanup());

describe("TagCatalogPanel", () => {
  it("active 行と inactive 行の lifecycle 操作を分けて表示する", () => {
    render(<TagCatalogPanel initial={initial} query="" page={1} pageSize={50} />);
    expect(screen.getByTestId("admin-tag-catalog-list")).toBeTruthy();
    expect(screen.getByRole("button", { name: "有効タグをしまう" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "有効タグを完全削除" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "有効タグを棚に戻す" })).toBeNull();
    expect(screen.getByRole("button", { name: "停止タグを棚に戻す" })).toBeTruthy();
  });

  it("検索 submit で catalog route に q/pageSize を反映する", () => {
    render(<TagCatalogPanel initial={initial} query="" page={1} pageSize={50} />);
    fireEvent.change(screen.getByLabelText("タグ検索"), {
      target: { value: "role" },
    });
    fireEvent.click(screen.getByRole("button", { name: "検索" }));
    expect(mocks.push).toHaveBeenCalledWith("/admin/tags/catalog?q=role&pageSize=50");
  });

  it("inactive 行の reactivate 成功で状態を有効へ更新する", async () => {
    render(<TagCatalogPanel initial={initial} query="" page={1} pageSize={50} />);
    fireEvent.click(screen.getByRole("button", { name: "停止タグを棚に戻す" }));
    await waitFor(() => {
      expect(mocks.postTrigger).toHaveBeenCalledWith(
        {},
        "/api/admin/tags/tag_inactive/reactivate",
      );
    });
    expect(screen.getAllByText("有効")).toHaveLength(2);
  });

  it("physical delete は確認 dialog 後に実行し、成功時に行を消す", async () => {
    render(<TagCatalogPanel initial={initial} query="" page={1} pageSize={50} />);
    fireEvent.click(screen.getByRole("button", { name: "有効タグを完全削除" }));
    expect(screen.getByRole("dialog", { name: "タグを完全削除しますか" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "完全削除" }));
    await waitFor(() => {
      expect(mocks.physicalTrigger).toHaveBeenCalledWith(
        {},
        "/api/admin/tags/tag_active/physical",
      );
    });
    expect(screen.queryByTestId("tag-catalog-row-tag_active")).toBeNull();
  });

  it("physical delete 409 referenceCount を行内 alert に表示する", async () => {
    mocks.physicalTrigger.mockRejectedValue(
      new FetchAuthedError(
        409,
        JSON.stringify({ ok: false, error: "tag_has_references", referenceCount: 7 }),
      ),
    );
    render(<TagCatalogPanel initial={initial} query="" page={1} pageSize={50} />);
    fireEvent.click(screen.getByRole("button", { name: "有効タグを完全削除" }));
    fireEvent.click(screen.getByRole("button", { name: "完全削除" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "7人に使用中のため削除不可",
    );
  });
});
