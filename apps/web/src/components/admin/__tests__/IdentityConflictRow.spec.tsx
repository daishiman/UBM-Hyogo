// serial-05-step-02: IdentityConflictRow unit tests
// useAdminMutation hook を mock し、payload / error 保持 / a11y を focused 検証する。
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";

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
import type { IdentityConflictRow as Row } from "@ubm-hyogo/shared";

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

afterEach(() => cleanup());

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

describe("IdentityConflictRow", () => {
  it("idle 段階で merge / dismiss ボタンと conflict メタを表示する", () => {
    render(<IdentityConflictRow item={item} />);
    expect(screen.getByText("conflict: c_1")).toBeTruthy();
    expect(screen.getByRole("button", { name: "merge" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "別人マーク" })).toBeTruthy();
  });

  it("merge → 確認1 → 次へ で確認2 (理由入力) に進み、空理由は実行不可", () => {
    render(<IdentityConflictRow item={item} />);
    fireEvent.click(screen.getByRole("button", { name: "merge" }));
    expect(screen.getByText(/確認 1\/2/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "次へ" }));
    expect(screen.getByText(/確認 2\/2/)).toBeTruthy();
    const exec = screen.getByRole("button", { name: "merge 実行" });
    expect((exec as HTMLButtonElement).disabled).toBe(true);
  });

  it("merge 実行で trigger に { targetMemberId, reason } を送る (happy)", async () => {
    const trigger = vi.fn().mockResolvedValue({
      mergedAt: "2026-05-16T00:00:00.000Z",
      targetMemberId: "m_dst",
      archivedSourceMemberId: "m_src",
      auditId: "a_1",
    });
    setMutationState(mergeEndpoint, { trigger });

    render(<IdentityConflictRow item={item} />);
    fireEvent.click(screen.getByRole("button", { name: "merge" }));
    fireEvent.click(screen.getByRole("button", { name: "次へ" }));
    fireEvent.change(screen.getByLabelText("merge 理由"), {
      target: { value: "本人確認済" },
    });
    fireEvent.click(screen.getByRole("button", { name: "merge 実行" }));

    await waitFor(() =>
      expect(trigger).toHaveBeenCalledWith(mergeEndpoint, {
        targetMemberId: "m_dst",
        reason: "本人確認済",
      }),
    );
    // success path: onSuccess が走り idle に戻る
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "merge" })).toBeTruthy(),
    );
  });

  it("hook の successMessage は '✓ 統合しました'", () => {
    render(<IdentityConflictRow item={item} />);
    fireEvent.click(screen.getByRole("button", { name: "merge" }));
    fireEvent.click(screen.getByRole("button", { name: "次へ" }));
    expect(lastOptionsByEndpoint.get(mergeEndpoint)?.successMessage).toBe(
      "✓ 統合しました",
    );
  });

  it("merge 失敗 (409) で modal は閉じず、reason / error が残る", async () => {
    const trigger = vi.fn().mockRejectedValue(new Error("すでに統合済みです"));
    setMutationState(mergeEndpoint, {
      trigger,
      error: new Error("すでに統合済みです"),
    });

    render(<IdentityConflictRow item={item} />);
    fireEvent.click(screen.getByRole("button", { name: "merge" }));
    fireEvent.click(screen.getByRole("button", { name: "次へ" }));
    fireEvent.change(screen.getByLabelText("merge 理由"), {
      target: { value: "本人確認済" },
    });
    fireEvent.click(screen.getByRole("button", { name: "merge 実行" }));

    await waitFor(() => expect(trigger).toHaveBeenCalled());
    // modal は閉じない: 確認2 が表示され、reason textarea が残存する
    expect(screen.getByText(/確認 2\/2/)).toBeTruthy();
    expect(
      (screen.getByLabelText("merge 理由") as HTMLTextAreaElement).value,
    ).toBe("本人確認済");
    expect(screen.getByRole("alert").textContent).toContain("すでに統合済みです");
  });

  it("merge 失敗 (400) でも modal は閉じず inline error 表示", async () => {
    const trigger = vi
      .fn()
      .mockRejectedValue(new Error("対象 ID が一致しません"));
    setMutationState(mergeEndpoint, {
      trigger,
      error: new Error("対象 ID が一致しません"),
    });

    render(<IdentityConflictRow item={item} />);
    fireEvent.click(screen.getByRole("button", { name: "merge" }));
    fireEvent.click(screen.getByRole("button", { name: "次へ" }));
    fireEvent.change(screen.getByLabelText("merge 理由"), {
      target: { value: "本人確認済" },
    });
    fireEvent.click(screen.getByRole("button", { name: "merge 実行" }));

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

    render(<IdentityConflictRow item={item} />);
    fireEvent.click(screen.getByRole("button", { name: "別人マーク" }));
    fireEvent.change(screen.getByLabelText("別人マーク理由"), {
      target: { value: "別組織で確認済" },
    });
    fireEvent.click(screen.getByRole("button", { name: "別人として確定" }));

    await waitFor(() =>
      expect(trigger).toHaveBeenCalledWith(dismissEndpoint, {
        reason: "別組織で確認済",
      }),
    );
  });

  it("dismiss 失敗 (409) で alert が出て modal は残る", async () => {
    const trigger = vi
      .fn()
      .mockRejectedValue(new Error("すでに別人として確定済みです"));
    setMutationState(dismissEndpoint, {
      trigger,
      error: new Error("すでに別人として確定済みです"),
    });

    render(<IdentityConflictRow item={item} />);
    fireEvent.click(screen.getByRole("button", { name: "別人マーク" }));
    fireEvent.change(screen.getByLabelText("別人マーク理由"), {
      target: { value: "別組織で確認済" },
    });
    fireEvent.click(screen.getByRole("button", { name: "別人として確定" }));

    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain(
        "すでに別人として確定済みです",
      ),
    );
    expect(
      (screen.getByLabelText("別人マーク理由") as HTMLTextAreaElement).value,
    ).toBe("別組織で確認済");
  });

  it("merge-confirm キャンセルで idle に戻り、reason はリセットされる", () => {
    render(<IdentityConflictRow item={item} />);
    fireEvent.click(screen.getByRole("button", { name: "merge" }));
    fireEvent.click(screen.getByRole("button", { name: "次へ" }));
    fireEvent.change(screen.getByLabelText("merge 理由"), {
      target: { value: "draft" },
    });
    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));
    expect(screen.getByRole("button", { name: "merge" })).toBeTruthy();
    // 再度開くと textarea は空
    fireEvent.click(screen.getByRole("button", { name: "merge" }));
    fireEvent.click(screen.getByRole("button", { name: "次へ" }));
    expect(
      (screen.getByLabelText("merge 理由") as HTMLTextAreaElement).value,
    ).toBe("");
  });
});
