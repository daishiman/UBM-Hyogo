import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

import { IdentityConflictRow } from "../IdentityConflictRow";
import type { IdentityConflictRow as Row } from "@ubm-hyogo/shared";

const item: Row = {
  conflictId: "c_1",
  sourceMemberId: "m_src",
  candidateTargetMemberId: "m_dst",
  responseEmailMasked: "a***@example.com",
  matchedFields: ["email", "name"],
} as Row;

const fetchMock = vi.fn();

beforeEach(() => {
  refreshMock.mockClear();
  fetchMock.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => cleanup());

describe("IdentityConflictRow", () => {
  it("idle 段階で merge / dismiss ボタンと concflict メタを表示する", () => {
    render(<IdentityConflictRow item={item} />);
    expect(screen.getByText("conflict: c_1")).toBeTruthy();
    expect(screen.getByRole("button", { name: "merge" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "別人マーク" })).toBeTruthy();
  });

  it("merge ボタン → 確認1 → 次へ で確認2 (理由入力) に進む", () => {
    render(<IdentityConflictRow item={item} />);
    fireEvent.click(screen.getByRole("button", { name: "merge" }));
    expect(screen.getByText(/確認 1\/2/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "次へ" }));
    expect(screen.getByText(/確認 2\/2/)).toBeTruthy();
    const exec = screen.getByRole("button", { name: "merge 実行" });
    expect((exec as HTMLButtonElement).disabled).toBe(true);
  });

  it("merge 確認2 で理由入力 → 実行で fetch が呼ばれ refresh される (happy)", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    });
    render(<IdentityConflictRow item={item} />);
    fireEvent.click(screen.getByRole("button", { name: "merge" }));
    fireEvent.click(screen.getByRole("button", { name: "次へ" }));
    fireEvent.change(screen.getByLabelText("merge 理由"), {
      target: { value: "本人確認済" },
    });
    fireEvent.click(screen.getByRole("button", { name: "merge 実行" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const callUrl = fetchMock.mock.calls[0]?.[0] as string;
    expect(callUrl).toContain("/api/admin/identity-conflicts/c_1/merge");
    await waitFor(() => expect(refreshMock).toHaveBeenCalled());
  });

  it("dismiss ボタンで理由入力 UI を表示し、エラー時は alert を出す", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({ error: "ALREADY_DISMISSED" }),
    });
    render(<IdentityConflictRow item={item} />);
    fireEvent.click(screen.getByRole("button", { name: "別人マーク" }));
    fireEvent.change(screen.getByLabelText("別人マーク理由"), {
      target: { value: "別組織で確認済" },
    });
    fireEvent.click(screen.getByRole("button", { name: "別人として確定" }));
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain(
        "409: ALREADY_DISMISSED",
      ),
    );
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
