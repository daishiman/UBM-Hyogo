// issue-958 Track B: BulkRepublishDrawer の選択 / 実行 / 完了 callback を検証する。

import { afterEach, describe, expect, it, vi, beforeEach } from "vitest";
import { cleanup, render, screen, act, fireEvent } from "@testing-library/react";

afterEach(cleanup);

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("../../../components/ui/Toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

import { BulkRepublishDrawer } from "../BulkRepublishDrawer";

const mockFetch = vi.fn();

const CANDIDATES = [
  {
    memberId: "m1",
    displayName: "Alice",
    publishState: "hidden" as const,
    hiddenReason: null,
  },
  {
    memberId: "m2",
    displayName: "Bob",
    publishState: "member_only" as const,
    hiddenReason: null,
  },
];

beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal("fetch", mockFetch as unknown as typeof fetch);
});

describe("BulkRepublishDrawer", () => {
  it("open=false で render しない", () => {
    render(
      <BulkRepublishDrawer
        open={false}
        onClose={() => {}}
        candidates={CANDIDATES}
        onCompleted={() => {}}
      />,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("候補を選択して実行 → 全成功で onCompleted + onClose", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });
    const onClose = vi.fn();
    const onCompleted = vi.fn();
    render(
      <BulkRepublishDrawer
        open
        onClose={onClose}
        candidates={CANDIDATES}
        onCompleted={onCompleted}
      />,
    );
    fireEvent.click(screen.getByTestId("bulk-republish-row-m1"));
    await act(async () => {
      fireEvent.click(screen.getByTestId("bulk-republish-start"));
    });
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/admin/members/m1/status",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ publishState: "public" }),
      }),
    );
    expect(onCompleted).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("候補ゼロのとき start ボタンは表示されず、空メッセージが出る", () => {
    render(
      <BulkRepublishDrawer
        open
        onClose={() => {}}
        candidates={[]}
        onCompleted={() => {}}
      />,
    );
    expect(screen.getByText("対象会員はいません。")).toBeTruthy();
    expect(screen.queryByTestId("bulk-republish-start")).toBeNull();
  });
});
