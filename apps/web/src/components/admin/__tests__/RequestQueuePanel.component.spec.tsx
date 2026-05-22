// 04b-followup-004: RequestQueuePanel UI tests
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

afterEach(() => cleanup());
import {
  RequestQueuePanel,
  type RequestQueueListView,
} from "../RequestQueuePanel";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

const mockResolve = vi.fn();
vi.mock("../../../lib/admin/api", () => ({
  resolveAdminRequest: (...args: unknown[]) => mockResolve(...args),
}));

const baseView: RequestQueueListView = {
  appliedFilters: { status: "pending", type: "visibility_request" },
  nextCursor: null,
  items: [
    {
      noteId: "note_v_1",
      memberId: "m_alice",
      noteType: "visibility_request",
      requestStatus: "pending",
      requestedAt: "2026-04-30T00:00:00Z",
      requestedReason: "一時停止したい",
      requestedPayload: { desiredState: "hidden" },
      memberSummary: {
        memberId: "m_alice",
        publicHandle: null,
        publishState: "public",
        isDeleted: false,
      },
    },
  ],
};

describe("RequestQueuePanel", () => {
  beforeEach(() => {
    mockResolve.mockReset();
    mockPush.mockReset();
    mockRefresh.mockReset();
  });

  it("TC-21: 初期表示で pending 一覧と type タブを描画", () => {
    render(<RequestQueuePanel initial={baseView} type="visibility_request" />);
    expect(screen.getByText("依頼キュー")).toBeDefined();
    expect(screen.getAllByText(/m_alice/).length).toBeGreaterThan(0);
    expect(screen.getByText(/desiredState: hidden/)).toBeDefined();
  });

  it("TC-22: 承認ボタンで confirmation modal が開く", () => {
    render(<RequestQueuePanel initial={baseView} type="visibility_request" />);
    fireEvent.click(screen.getByText("承認する"));
    expect(screen.getByRole("dialog")).toBeDefined();
    expect(screen.getByText("依頼を承認します")).toBeDefined();
  });

  it("TC-23: delete_request 承認で破壊的操作の警告が出る", () => {
    const view: RequestQueueListView = {
      ...baseView,
      items: [
        {
          ...baseView.items[0]!,
          noteId: "note_d_1",
          noteType: "delete_request",
          requestedPayload: {},
        },
      ],
    };
    render(<RequestQueuePanel initial={view} type="delete_request" />);
    fireEvent.click(screen.getByText("承認する"));
    expect(screen.getByRole("alert").textContent).toContain("論理削除");
  });

  it("TC-25: 409 エラー時は他 admin 処理済メッセージを表示", async () => {
    mockResolve.mockResolvedValue({
      ok: false,
      status: 409,
      error: "already_resolved",
    });
    render(<RequestQueuePanel initial={baseView} type="visibility_request" />);
    fireEvent.click(screen.getByText("承認する"));
    fireEvent.click(screen.getByText("承認を実行"));
    await waitFor(() => {
      expect(screen.getByRole("status").textContent).toContain(
        "他の管理者が既に処理済み",
      );
    });
  });

  it("PII raw 値が DOM に出ない（生 email を渡しても表示されない）", () => {
    const view: RequestQueueListView = {
      ...baseView,
      items: [
        {
          ...baseView.items[0]!,
          requestedPayload: {
            desiredState: "hidden",
            // 万一 PII が来ても表示文字列には現れない
            email: "raw@example.com",
          },
        },
      ],
    };
    render(<RequestQueuePanel initial={view} type="visibility_request" />);
    expect(screen.queryByText(/raw@example\.com/)).toBeNull();
  });

  it("TC-26: nextCursor があれば次ページへ遷移できる", () => {
    render(
      <RequestQueuePanel
        initial={{ ...baseView, nextCursor: "cursor+/=" }}
        type="visibility_request"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "次の依頼ページ" }));
    expect(mockPush).toHaveBeenCalledWith(
      "/admin/requests?type=visibility_request&cursor=cursor%2B%2F%3D",
    );
  });
});
