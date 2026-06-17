// serial-05-step-02: IdentityConflictRow unit tests
// useAdminMutation hook を mock し、payload / error 保持 / a11y を focused 検証する。
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor, act } from "@testing-library/react";

interface MockMutationState {
  trigger: ReturnType<typeof vi.fn>;
  isLoading: boolean;
  error: Error | null;
}

const mutationByEndpoint: Map<string, MockMutationState> = new Map();
const lastOptionsByEndpoint: Map<
  string,
  { onSuccess?: () => void | Promise<void>; successMessage?: string } | undefined
> = new Map();

vi.mock("../../../features/admin/hooks", () => ({
  useAdminMutation: (
    endpoint: string,
    _method: string,
    options?: {
      onSuccess?: () => void | Promise<void>;
      successMessage?: string;
    },
  ) => {
    lastOptionsByEndpoint.set(endpoint, options);
    let state = mutationByEndpoint.get(endpoint);
    if (!state) {
      state = { trigger: vi.fn(), isLoading: false, error: null };
      mutationByEndpoint.set(endpoint, state);
    }
    return {
      trigger: async (payload: unknown) => {
        const result = await state!.trigger(endpoint, payload);
        await options?.onSuccess?.();
        return result;
      },
      isLoading: state.isLoading,
      error: state.error,
    };
  },
}));

import { IdentityConflictRow } from "../IdentityConflictRow";
import { IdentityConflictAnnouncer } from "../IdentityConflictAnnouncer";
import { announcementFor } from "../identityConflictAnnouncements";
import type { IdentityConflictRow as Row } from "@ubm-hyogo/shared";
import { FetchAuthedError } from "../../../lib/fetch/errors";

const item: Row = {
  conflictId: "c_1",
  sourceMemberId: "m_src",
  candidateTargetMemberId: "m_dst",
  responseEmailMasked: "a***@example.com",
  matchedFields: ["name", "affiliation"],
  detectedAt: "2026-05-16T00:00:00.000Z",
  syncJobId: null,
};

const mergeEndpoint = "/api/admin/identity-conflicts/c_1/merge";
const dismissEndpoint = "/api/admin/identity-conflicts/c_1/dismiss";

beforeEach(() => {
  mutationByEndpoint.clear();
  lastOptionsByEndpoint.clear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

const setMutationState = (
  endpoint: string,
  state: Partial<MockMutationState>,
) => {
  const prev = mutationByEndpoint.get(endpoint) ?? {
    trigger: vi.fn(),
    isLoading: false,
    error: null,
  };
  mutationByEndpoint.set(endpoint, { ...prev, ...state });
};

const getRowRoot = () => screen.getByText("照合キー: c_1").closest("[data-state]");

const renderWithAnnouncer = () =>
  render(
    <IdentityConflictAnnouncer>
      <IdentityConflictRow item={item} />
    </IdentityConflictAnnouncer>,
  );

const dismissRollbackCases: Array<[string, Error, string]> = [
  [
    "403",
    new FetchAuthedError(403, JSON.stringify({ message: "権限がありません" })),
    "権限がありません",
  ],
  [
    "5xx",
    new FetchAuthedError(500, JSON.stringify({ message: "サーバーエラーです" })),
    "サーバーエラーです",
  ],
  ["network", new Error("network error"), "network error"],
];

describe("IdentityConflictRow", () => {
  it("idle 段階で日本語の操作ボタンと補助的な照合キーを表示する", () => {
    renderWithAnnouncer();
    expect(screen.getByText("照合キー: c_1")).toBeTruthy();
    expect(screen.getByRole("button", { name: "統合する" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "別人として確定" })).toBeTruthy();
    expect(screen.getByText("新しい登録")).toBeTruthy();
    expect(screen.getByText("まとめ先（以前の登録）")).toBeTruthy();
    expect(screen.getByText(/メール:/)).toBeTruthy();
    expect(screen.getByText("一致した項目: 氏名、職業")).toBeTruthy();
    expect(screen.getAllByText("氏名")).toHaveLength(1);
    expect(screen.getAllByText("職業")).toHaveLength(1);
    expect(screen.queryByText("conflict: c_1")).toBeNull();
    expect(screen.queryByText("matched: name, affiliation")).toBeNull();
  });

  it("merge → 確認1 → 次へ で確認2 (理由入力) に進み、空理由は実行不可", () => {
    renderWithAnnouncer();
    fireEvent.click(screen.getByRole("button", { name: "統合する" }));
    expect(screen.getByText(/確認 1\/2/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "次へ" }));
    expect(screen.getByText(/確認 2\/2/)).toBeTruthy();
    const exec = screen.getByRole("button", { name: "統合を実行" });
    expect((exec as HTMLButtonElement).disabled).toBe(true);
  });

  it("merge 実行直後に server 応答前でも row を exiting 相で DOM に残す", async () => {
    const trigger = vi.fn(() => new Promise(() => {}));
    setMutationState(mergeEndpoint, { trigger });

    renderWithAnnouncer();
    fireEvent.click(screen.getByRole("button", { name: "統合する" }));
    fireEvent.click(screen.getByRole("button", { name: "次へ" }));
    fireEvent.change(screen.getByLabelText("まとめる理由"), {
      target: { value: "本人確認済" },
    });
    fireEvent.click(screen.getByRole("button", { name: "統合を実行" }));

    expect(screen.getByText("照合キー: c_1")).toBeTruthy();
    expect(getRowRoot()?.getAttribute("data-state")).toBe("exiting");
    expect(getRowRoot()?.className).toContain("opacity-0");
    await waitFor(() =>
      expect(trigger).toHaveBeenCalledWith(mergeEndpoint, {
        targetMemberId: "m_dst",
        reason: "本人確認済",
      }),
    );
  });

  it("transitionend 後に row を removed 相へ移して DOM から除去する", async () => {
    const trigger = vi.fn(() => new Promise(() => {}));
    setMutationState(mergeEndpoint, { trigger });

    renderWithAnnouncer();
    fireEvent.click(screen.getByRole("button", { name: "統合する" }));
    fireEvent.click(screen.getByRole("button", { name: "次へ" }));
    fireEvent.change(screen.getByLabelText("まとめる理由"), {
      target: { value: "本人確認済" },
    });
    fireEvent.click(screen.getByRole("button", { name: "統合を実行" }));

    await waitFor(() => expect(trigger).toHaveBeenCalled());
    const rowRoot = getRowRoot();
    expect(rowRoot).toBeTruthy();
    fireEvent.transitionEnd(rowRoot!, { propertyName: "opacity" });

    await waitFor(() => expect(screen.queryByText("照合キー: c_1")).toBeNull());
  });

  it("transitionend が発火しない環境でも fallback timer で DOM から除去する", async () => {
    vi.useFakeTimers();
    const trigger = vi.fn(() => new Promise(() => {}));
    setMutationState(mergeEndpoint, { trigger });

    renderWithAnnouncer();
    fireEvent.click(screen.getByRole("button", { name: "統合する" }));
    fireEvent.click(screen.getByRole("button", { name: "次へ" }));
    fireEvent.change(screen.getByLabelText("まとめる理由"), {
      target: { value: "本人確認済" },
    });
    fireEvent.click(screen.getByRole("button", { name: "統合を実行" }));

    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });
    expect(screen.queryByText("照合キー: c_1")).toBeNull();
    vi.useRealTimers();
  });

  it("prefers-reduced-motion: reduce では delay 0 の timer で DOM から除去する", async () => {
    vi.useFakeTimers();
    vi.spyOn(window, "matchMedia").mockReturnValue({
      matches: true,
      media: "(prefers-reduced-motion: reduce)",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList);
    const trigger = vi.fn(() => new Promise(() => {}));
    setMutationState(mergeEndpoint, { trigger });

    renderWithAnnouncer();
    fireEvent.click(screen.getByRole("button", { name: "統合する" }));
    fireEvent.click(screen.getByRole("button", { name: "次へ" }));
    fireEvent.change(screen.getByLabelText("まとめる理由"), {
      target: { value: "本人確認済" },
    });
    fireEvent.click(screen.getByRole("button", { name: "統合を実行" }));

    expect(screen.getByText("照合キー: c_1")).toBeTruthy();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(screen.queryByText("照合キー: c_1")).toBeNull();
    vi.useRealTimers();
  });

  it("merge 成功後も row は非表示を維持する", async () => {
    const trigger = vi.fn().mockResolvedValue({
      mergedAt: "2026-05-16T00:00:00.000Z",
      targetMemberId: "m_dst",
      archivedSourceMemberId: "m_src",
      auditId: "a_1",
    });
    setMutationState(mergeEndpoint, { trigger });

    renderWithAnnouncer();
    fireEvent.click(screen.getByRole("button", { name: "統合する" }));
    fireEvent.click(screen.getByRole("button", { name: "次へ" }));
    fireEvent.change(screen.getByLabelText("まとめる理由"), {
      target: { value: "本人確認済" },
    });
    fireEvent.click(screen.getByRole("button", { name: "統合を実行" }));

    await waitFor(() =>
      expect(trigger).toHaveBeenCalledWith(mergeEndpoint, {
        targetMemberId: "m_dst",
        reason: "本人確認済",
      }),
    );
    fireEvent.transitionEnd(getRowRoot()!, { propertyName: "opacity" });
    await waitFor(() => expect(screen.queryByText("照合キー: c_1")).toBeNull());
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toContain(
        announcementFor("merge"),
      ),
    );
  });

  it("hook の successMessage は '✓ 統合しました'", () => {
    renderWithAnnouncer();
    fireEvent.click(screen.getByRole("button", { name: "統合する" }));
    fireEvent.click(screen.getByRole("button", { name: "次へ" }));
    expect(lastOptionsByEndpoint.get(mergeEndpoint)?.successMessage).toBe(
      "✓ 統合しました",
    );
  });

  it("merge 失敗 (409) で optimistic 非表示を rollback し、reason / error が残る", async () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
    const apiError = new FetchAuthedError(
      409,
      JSON.stringify({ message: "すでに統合済みです" }),
    );
    const trigger = vi.fn().mockRejectedValue(apiError);
    setMutationState(mergeEndpoint, {
      trigger,
      error: apiError,
    });

    renderWithAnnouncer();
    fireEvent.click(screen.getByRole("button", { name: "統合する" }));
    fireEvent.click(screen.getByRole("button", { name: "次へ" }));
    fireEvent.change(screen.getByLabelText("まとめる理由"), {
      target: { value: "本人確認済" },
    });
    fireEvent.click(screen.getByRole("button", { name: "統合を実行" }));

    await waitFor(() => expect(trigger).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText("照合キー: c_1")).toBeTruthy());
    expect(getRowRoot()?.getAttribute("data-state")).toBe("idle");
    // rollback 後も modal は閉じない: 確認2 が表示され、reason textarea が残存する
    expect(screen.getByText(/確認 2\/2/)).toBeTruthy();
    expect(
      (screen.getByLabelText("まとめる理由") as HTMLTextAreaElement).value,
    ).toBe("本人確認済");
    expect(screen.getByRole("alert").textContent).toContain("すでに統合済みです");
    expect(clearTimeoutSpy).toHaveBeenCalled();
    expect(getRowRoot()?.getAttribute("data-state")).toBe("idle");
  });

  it("merge 失敗 (400) でも modal は閉じず inline error 表示", async () => {
    const trigger = vi
      .fn()
      .mockRejectedValue(new Error("対象 ID が一致しません"));
    setMutationState(mergeEndpoint, {
      trigger,
      error: new Error("対象 ID が一致しません"),
    });

    renderWithAnnouncer();
    fireEvent.click(screen.getByRole("button", { name: "統合する" }));
    fireEvent.click(screen.getByRole("button", { name: "次へ" }));
    fireEvent.change(screen.getByLabelText("まとめる理由"), {
      target: { value: "本人確認済" },
    });
    fireEvent.click(screen.getByRole("button", { name: "統合を実行" }));

    await waitFor(() => expect(trigger).toHaveBeenCalled());
    expect(screen.getByRole("alert").textContent).toContain(
      "対象 ID が一致しません",
    );
  });

  it("dismiss で /dismiss endpoint に { reason } を送る", async () => {
    const trigger = vi.fn().mockResolvedValue({
      dismissedAt: "2026-05-16T00:00:00.000Z",
    });
    setMutationState(dismissEndpoint, { trigger });

    renderWithAnnouncer();
    fireEvent.click(screen.getByRole("button", { name: "別人として確定" }));
    fireEvent.change(screen.getByLabelText("別人と判断した理由"), {
      target: { value: "別組織で確認済" },
    });
    fireEvent.click(screen.getByRole("button", { name: "別人として確定" }));

    await waitFor(() =>
      expect(trigger).toHaveBeenCalledWith(dismissEndpoint, {
        reason: "別組織で確認済",
      }),
    );
  });

  it("dismiss 実行直後に row を optimistic に非表示にし、成功後に announce する", async () => {
    let resolveDismiss: (value: { dismissedAt: string }) => void = () => {};
    const trigger = vi.fn(
      () =>
        new Promise<{ dismissedAt: string }>((resolve) => {
          resolveDismiss = resolve;
        }),
    );
    setMutationState(dismissEndpoint, { trigger });

    renderWithAnnouncer();
    fireEvent.click(screen.getByRole("button", { name: "別人として確定" }));
    fireEvent.change(screen.getByLabelText("別人と判断した理由"), {
      target: { value: "別組織で確認済" },
    });
    fireEvent.click(screen.getByRole("button", { name: "別人として確定" }));

    await waitFor(() =>
      expect(trigger).toHaveBeenCalledWith(dismissEndpoint, {
        reason: "別組織で確認済",
      }),
    );
    await waitFor(() => expect(screen.queryByText("照合キー: c_1")).toBeNull());
    const status = screen.getByRole("status");
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(status.textContent).not.toContain(announcementFor("dismiss"));

    await act(async () => {
      resolveDismiss({ dismissedAt: "2026-05-16T00:00:00.000Z" });
    });

    await waitFor(() =>
      expect(status.textContent).toContain(announcementFor("dismiss")),
    );
    await waitFor(() => expect(document.activeElement).not.toBe(status));
  });

  it("dismiss 成功後も row は非表示を維持する", async () => {
    const trigger = vi.fn().mockResolvedValue({
      dismissedAt: "2026-05-16T00:00:00.000Z",
    });
    setMutationState(dismissEndpoint, { trigger });

    renderWithAnnouncer();
    fireEvent.click(screen.getByRole("button", { name: "別人として確定" }));
    fireEvent.change(screen.getByLabelText("別人と判断した理由"), {
      target: { value: "別組織で確認済" },
    });
    fireEvent.click(screen.getByRole("button", { name: "別人として確定" }));

    await waitFor(() => expect(trigger).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByText("照合キー: c_1")).toBeNull());
  });

  it("dismiss 失敗 (409) で optimistic 非表示を rollback し、reason / error が残る", async () => {
    const trigger = vi
      .fn()
      .mockRejectedValue(new Error("すでに別人として確定済みです"));
    setMutationState(dismissEndpoint, {
      trigger,
      error: new Error("すでに別人として確定済みです"),
    });

    renderWithAnnouncer();
    fireEvent.click(screen.getByRole("button", { name: "別人として確定" }));
    fireEvent.change(screen.getByLabelText("別人と判断した理由"), {
      target: { value: "別組織で確認済" },
    });
    fireEvent.click(screen.getByRole("button", { name: "別人として確定" }));

    await waitFor(() => expect(trigger).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText("照合キー: c_1")).toBeTruthy());
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain(
        "すでに別人として確定済みです",
      ),
    );
    expect(screen.getByRole("status").textContent).not.toContain(
      announcementFor("dismiss"),
    );
    expect(
      (screen.getByLabelText("別人と判断した理由") as HTMLTextAreaElement).value,
    ).toBe("別組織で確認済");
    expect(screen.getByRole("alert").textContent).toContain(
      "すでに別人として確定済みです",
    );
  });

  it.each(dismissRollbackCases)(
    "dismiss 失敗 (%s) で optimistic 非表示を rollback する",
    async (_label, error, expectedMessage) => {
      const trigger = vi.fn().mockRejectedValue(error);
      setMutationState(dismissEndpoint, {
        trigger,
        error,
      });

      renderWithAnnouncer();
      fireEvent.click(screen.getByRole("button", { name: "別人として確定" }));
      fireEvent.change(screen.getByLabelText("別人と判断した理由"), {
        target: { value: "別組織で確認済" },
      });
      fireEvent.click(screen.getByRole("button", { name: "別人として確定" }));

      await waitFor(() => expect(trigger).toHaveBeenCalled());
      await waitFor(() => expect(screen.getByText("照合キー: c_1")).toBeTruthy());
      expect(
        (screen.getByLabelText("別人と判断した理由") as HTMLTextAreaElement).value,
      ).toBe("別組織で確認済");
      expect(screen.getByRole("alert").textContent).toContain(expectedMessage);
    },
  );

  it("dismiss rollback 後に再度確定でき、2 回目の trigger が呼ばれる", async () => {
    const trigger = vi
      .fn()
      .mockRejectedValueOnce(new Error("一時的な競合です"))
      .mockResolvedValueOnce({
        dismissedAt: "2026-05-16T00:00:00.000Z",
      });
    setMutationState(dismissEndpoint, {
      trigger,
      error: new Error("一時的な競合です"),
    });

    renderWithAnnouncer();
    fireEvent.click(screen.getByRole("button", { name: "別人として確定" }));
    fireEvent.change(screen.getByLabelText("別人と判断した理由"), {
      target: { value: "別組織で確認済" },
    });
    fireEvent.click(screen.getByRole("button", { name: "別人として確定" }));

    await waitFor(() => expect(trigger).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByText("照合キー: c_1")).toBeTruthy());
    expect(
      (screen.getByLabelText("別人と判断した理由") as HTMLTextAreaElement).value,
    ).toBe("別組織で確認済");

    fireEvent.click(screen.getByRole("button", { name: "別人として確定" }));

    await waitFor(() => expect(trigger).toHaveBeenCalledTimes(2));
    expect(trigger).toHaveBeenLastCalledWith(dismissEndpoint, {
      reason: "別組織で確認済",
    });
    await waitFor(() => expect(screen.queryByText("照合キー: c_1")).toBeNull());
  });

  it("dismiss rollback は merge 経路に影響せず、merge optimistic hide が動作する", async () => {
    const dismissTrigger = vi
      .fn()
      .mockRejectedValue(new Error("一時的な競合です"));
    const mergeTrigger = vi.fn(() => new Promise(() => {}));
    setMutationState(dismissEndpoint, {
      trigger: dismissTrigger,
      error: new Error("一時的な競合です"),
    });
    setMutationState(mergeEndpoint, { trigger: mergeTrigger });

    renderWithAnnouncer();
    fireEvent.click(screen.getByRole("button", { name: "別人として確定" }));
    fireEvent.change(screen.getByLabelText("別人と判断した理由"), {
      target: { value: "別組織で確認済" },
    });
    fireEvent.click(screen.getByRole("button", { name: "別人として確定" }));

    await waitFor(() => expect(dismissTrigger).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByText("照合キー: c_1")).toBeTruthy());

    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));
    fireEvent.click(screen.getByRole("button", { name: "統合する" }));
    fireEvent.click(screen.getByRole("button", { name: "次へ" }));
    fireEvent.change(screen.getByLabelText("まとめる理由"), {
      target: { value: "本人確認済" },
    });
    fireEvent.click(screen.getByRole("button", { name: "統合を実行" }));

    await waitFor(() =>
      expect(mergeTrigger).toHaveBeenCalledWith(mergeEndpoint, {
        targetMemberId: "m_dst",
        reason: "本人確認済",
      }),
    );
    await waitFor(() => expect(screen.queryByText("照合キー: c_1")).toBeNull());
  });

  it("merge-confirm キャンセルで idle に戻り、reason はリセットされる", () => {
    renderWithAnnouncer();
    fireEvent.click(screen.getByRole("button", { name: "統合する" }));
    fireEvent.click(screen.getByRole("button", { name: "次へ" }));
    fireEvent.change(screen.getByLabelText("まとめる理由"), {
      target: { value: "draft" },
    });
    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));
    expect(screen.getByRole("button", { name: "統合する" })).toBeTruthy();
    // 再度開くと textarea は空
    fireEvent.click(screen.getByRole("button", { name: "統合する" }));
    fireEvent.click(screen.getByRole("button", { name: "次へ" }));
    expect(
      (screen.getByLabelText("まとめる理由") as HTMLTextAreaElement).value,
    ).toBe("");
  });
});
