import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FetchAuthedError } from "../../../../../lib/fetch/errors";
import type { AdminTagRef } from "../../../api/tags";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));

type MutOptions = {
  mutationFn?: (payload: unknown, endpointOverride?: string) => Promise<AdminTagRef>;
  onSuccess?: (data: AdminTagRef) => void | Promise<void>;
  onError?: (error: Error) => void;
  successMessage?: string;
};

const mutation = {
  trigger: vi.fn(),
  options: null as MutOptions | null,
};

vi.mock("../../../hooks/useAdminMutation", async () => {
  const errors = await import("../../../../../lib/fetch/errors");
  return {
    FetchAuthedError: errors.FetchAuthedError,
    useAdminMutation: (_endpoint: string, _method: string, options: MutOptions) => {
      mutation.options = options;
      return {
        trigger: mutation.trigger,
        isLoading: false,
        error: null,
        reset: vi.fn(),
        abort: vi.fn(),
      };
    },
  };
});

import { TagMasterPanel } from "../TagMasterPanel";

const TAGS: AdminTagRef[] = [
  { tagId: "tag_mentor", code: "mentor", label: "メンター", category: "role" },
  { tagId: "tag_vip", code: "vip", label: "VIP会員", category: "membership" },
];

beforeEach(() => {
  mutation.trigger.mockReset();
  mutation.trigger.mockResolvedValue(TAGS[0]);
  mutation.options = null;
});

afterEach(() => {
  cleanup();
});

describe("TagMasterPanel", () => {
  it("一覧選択から編集フォームへ到達し expectedCode 付きで保存する", async () => {
    render(<TagMasterPanel initialTags={TAGS} total={2} />);

    fireEvent.click(screen.getByRole("button", { name: /VIP会員/ }));
    fireEvent.change(screen.getByLabelText("コード"), { target: { value: "vip_renamed" } });
    fireEvent.change(screen.getByLabelText("表示名"), { target: { value: "VIP" } });
    fireEvent.click(screen.getByRole("button", { name: "保存" }));

    expect(mutation.trigger).toHaveBeenCalledWith({
      code: "vip_renamed",
      label: "VIP",
      expectedCode: "vip",
    });

    await act(async () => {
      await mutation.options?.onSuccess?.({
        tagId: "tag_vip",
        code: "vip_renamed",
        label: "VIP",
        category: "membership",
      });
    });

    await waitFor(() => {
      expect(screen.getAllByText("vip_renamed").length).toBeGreaterThan(0);
    });
  });

  it("label/category 単独更新では expectedCode を送らない", () => {
    render(<TagMasterPanel initialTags={TAGS} total={2} />);

    fireEvent.change(screen.getByLabelText("表示名"), { target: { value: "メンター更新" } });
    fireEvent.click(screen.getByRole("button", { name: "保存" }));

    expect(mutation.trigger).toHaveBeenCalledWith({
      label: "メンター更新",
    });
  });

  it("ハイフン入り code は API 送信前に止める", () => {
    render(<TagMasterPanel initialTags={TAGS} total={2} />);

    fireEvent.change(screen.getByLabelText("コード"), { target: { value: "mentor-renamed" } });
    fireEvent.click(screen.getByRole("button", { name: "保存" }));

    expect(mutation.trigger).not.toHaveBeenCalled();
    expect(screen.getByText(/英小文字・数字・_/)).toBeDefined();
  });

  it("tag_code_conflict と tag_stale_conflict を別メッセージで表示する", async () => {
    render(<TagMasterPanel initialTags={TAGS} total={2} />);
    fireEvent.change(screen.getByLabelText("コード"), { target: { value: "vip" } });

    act(() => {
      mutation.options?.onError?.(
        new FetchAuthedError(409, '{"ok":false,"error":"tag_code_conflict"}'),
      );
    });
    expect(screen.getByRole("alert").textContent).toContain("同じコード");

    act(() => {
      mutation.options?.onError?.(
        new FetchAuthedError(409, '{"ok":false,"error":"tag_stale_conflict"}'),
      );
    });
    expect(screen.getByRole("alert").textContent).toContain("別の変更");
  });

  it("検索で code / label / category を絞り込む", () => {
    render(<TagMasterPanel initialTags={TAGS} total={2} />);

    fireEvent.change(screen.getByLabelText("タグ検索"), { target: { value: "membership" } });
    expect(screen.getByRole("button", { name: /VIP会員/ })).toBeDefined();
    expect(screen.queryByRole("button", { name: /メンター/ })).toBeNull();
  });
});
