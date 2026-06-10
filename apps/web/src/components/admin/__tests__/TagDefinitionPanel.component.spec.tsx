import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  postTrigger: vi.fn(),
  deactivateTrigger: vi.fn(),
  physicalTrigger: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh, push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("../../../features/admin/api/tags", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../features/admin/api/tags")>();
  return {
    ...actual,
    createTag: vi.fn(),
  };
});

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
    useAdminMutation: (
      _endpoint: string,
      method: string,
      options?: {
        successMessage?: string;
        mutationFn?: (payload: unknown) => Promise<unknown>;
        onSuccess?: (data: unknown) => void;
        onError?: (error: Error) => void;
      },
    ) => {
      const trigger = options?.mutationFn
        ? async (payload: unknown) => {
            try {
              const data = await options.mutationFn?.(payload);
              options.onSuccess?.(data);
              return data;
            } catch (error) {
              options.onError?.(error instanceof Error ? error : new Error(String(error)));
              throw error;
            }
          }
        : method === "POST"
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

import { createTag } from "../../../features/admin/api/tags";
import { FetchAuthedError } from "../../../features/admin/hooks/useAdminMutation";
import { TagDefinitionPanel } from "../TagDefinitionPanel";
import type { TagDefinitionListView } from "../tagDefinitionView";

const initial: TagDefinitionListView = {
  total: 2,
  items: [
    { tagId: "tag_active", code: "active_tag", label: "有効タグ", category: "role", active: true },
    { tagId: "tag_inactive", code: "inactive_tag", label: "停止タグ", category: "role", active: false },
  ],
};

beforeEach(() => {
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
  vi.mocked(createTag).mockReset();
});

afterEach(() => cleanup());

describe("TagDefinitionPanel", () => {
  it("既定は有効タグのみ表示し、トグルで停止中を表示する", () => {
    render(<TagDefinitionPanel initial={initial} />);
    expect(screen.getByText("有効タグ")).toBeTruthy();
    expect(screen.queryByText("停止タグ")).toBeNull();
    fireEvent.click(screen.getByLabelText("停止中も表示"));
    expect(screen.getByText("停止タグ")).toBeTruthy();
  });

  it("作成成功で一覧に追加し選択する", async () => {
    vi.mocked(createTag).mockResolvedValue({
      tagId: "tag_new",
      code: "new_tag",
      label: "新規タグ",
      category: "role",
      active: true,
    });
    render(<TagDefinitionPanel initial={initial} />);
    fireEvent.change(screen.getAllByLabelText("コード")[0]!, { target: { value: "new_tag" } });
    fireEvent.change(screen.getAllByLabelText("表示名")[0]!, { target: { value: "新規タグ" } });
    fireEvent.change(screen.getAllByLabelText("カテゴリ")[0]!, { target: { value: "role" } });
    fireEvent.click(screen.getByRole("button", { name: "作成" }));
    await waitFor(() => expect(createTag).toHaveBeenCalled());
    expect(screen.getByText("新規タグ")).toBeTruthy();
  });

  it("inactive 行の reactivate 成功で状態を有効へ更新する", async () => {
    render(<TagDefinitionPanel initial={initial} />);
    fireEvent.click(screen.getByLabelText("停止中も表示"));
    fireEvent.click(screen.getByRole("button", { name: "停止タグを棚に戻す" }));
    await waitFor(() => {
      expect(mocks.postTrigger).toHaveBeenCalledWith(
        {},
        "/api/admin/tags/tag_inactive/reactivate",
      );
    });
    expect(screen.getAllByText("有効")).toHaveLength(2);
  });

  it("physical delete 409 referenceCount を行内 alert に表示する", async () => {
    mocks.physicalTrigger.mockRejectedValue(
      new FetchAuthedError(
        409,
        JSON.stringify({ ok: false, error: "tag_has_references", referenceCount: 7 }),
      ),
    );
    render(<TagDefinitionPanel initial={initial} />);
    fireEvent.click(screen.getByRole("button", { name: "有効タグを完全削除" }));
    fireEvent.click(screen.getByRole("button", { name: "完全削除" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "7人に使用中のため削除不可",
    );
  });
});
