import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const createTagMock = vi.hoisted(() => vi.fn());

vi.mock("../../../features/admin/api/tags", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../features/admin/api/tags")>();
  return {
    ...actual,
    createTag: createTagMock,
  };
});

vi.mock("../../../features/admin/hooks/useAdminMutation", () => ({
  useAdminMutation: (
    _endpoint: string,
    _method: string,
    options?: {
      mutationFn?: (payload: unknown) => Promise<unknown>;
      onSuccess?: (data: unknown) => void;
      onError?: (error: Error) => void;
    },
  ) => ({
    trigger: async (payload: unknown) => {
      try {
        const data = await options?.mutationFn?.(payload);
        options?.onSuccess?.(data);
        return data;
      } catch (error) {
        options?.onError?.(error instanceof Error ? error : new Error(String(error)));
        throw error;
      }
    },
    isLoading: false,
    error: null,
    reset: vi.fn(),
    abort: vi.fn(),
  }),
}));

import { TagDefinitionCreateForm } from "../TagDefinitionCreateForm";

afterEach(() => {
  cleanup();
  createTagMock.mockReset();
});

describe("TagDefinitionCreateForm", () => {
  it("表示名からコードを自動生成し、ヒントと状態を表示する", () => {
    render(<TagDefinitionCreateForm onCreated={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("表示名"), { target: { value: "エリア 01" } });

    expect((screen.getByLabelText("コード") as HTMLInputElement).value).toBe("eria_01");
    expect(screen.getByText(/表示名から自動生成/)).toBeTruthy();
    expect(screen.getByText("自動生成中")).toBeTruthy();
    expect(screen.queryByText(/tag master API/)).toBeNull();
  });

  it("コードを手動編集した後は表示名変更で上書きしない", () => {
    render(<TagDefinitionCreateForm onCreated={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("表示名"), { target: { value: "エリア 01" } });
    fireEvent.change(screen.getByLabelText("コード"), { target: { value: "manual_code" } });
    fireEvent.change(screen.getByLabelText("表示名"), { target: { value: "地域 02" } });

    expect((screen.getByLabelText("コード") as HTMLInputElement).value).toBe("manual_code");
    expect(screen.queryByText("自動生成中")).toBeNull();
  });

  it("現在の code/label/category で既存 createTag shape を送信する", async () => {
    const onCreated = vi.fn();
    createTagMock.mockResolvedValue({
      tagId: "tag_new",
      code: "new_tag",
      label: "新規タグ",
      category: "role",
      active: true,
    });
    render(<TagDefinitionCreateForm onCreated={onCreated} />);

    fireEvent.change(screen.getByLabelText("表示名"), { target: { value: "新規タグ" } });
    fireEvent.change(screen.getByLabelText("コード"), { target: { value: "new_tag" } });
    fireEvent.change(screen.getByLabelText("カテゴリ"), { target: { value: "role" } });
    fireEvent.click(screen.getByRole("button", { name: "作成" }));

    await waitFor(() =>
      expect(createTagMock).toHaveBeenCalledWith({
        code: "new_tag",
        label: "新規タグ",
        category: "role",
      }),
    );
    expect(onCreated).toHaveBeenCalledWith(expect.objectContaining({ tagId: "tag_new" }));
  });
});
