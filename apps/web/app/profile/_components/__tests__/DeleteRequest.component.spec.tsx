// 06b-B U: DeleteRequest 確認モーダル + 二重申請 409 表示。

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";

const { mockRequest } = vi.hoisted(() => ({ mockRequest: vi.fn() }));

vi.mock("../../../../src/lib/api/me-requests-client", async () => {
  const actual = await vi.importActual<
    typeof import("../../../../src/lib/api/me-requests-client")
  >("../../../../src/lib/api/me-requests-client");
  return {
    ...actual,
    requestAccountDeletion: mockRequest,
  };
});

import { SelfRequestError } from "../../../../src/lib/api/me-requests-client";
import { DeleteRequest } from "../DeleteRequest.client";

afterEach(() => {
  cleanup();
  mockRequest.mockReset();
});

beforeEach(() => {
  mockRequest.mockReset();
});

describe("DeleteRequest", () => {
  it("退会申請を成功させ accepted 表示", async () => {
    mockRequest.mockResolvedValueOnce({
      queueId: "q_d",
      type: "delete_request",
      status: "pending",
      createdAt: "x",
    });
    render(<DeleteRequest />);
    fireEvent.click(screen.getByText("退会を申請する"));
    expect(screen.getByText("退会を申請しますか？")).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getAllByText("退会を申請する")[1]);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(mockRequest).toHaveBeenCalledOnce();
    expect(screen.getByRole("status").textContent).toMatch(/退会申請を受け付け/);
  });

  it("409 を二重申請メッセージで表示", async () => {
    mockRequest.mockRejectedValueOnce(
      new SelfRequestError(409, "DUPLICATE_PENDING_REQUEST"),
    );
    render(<DeleteRequest />);
    fireEvent.click(screen.getByText("退会を申請する"));
    await act(async () => {
      fireEvent.click(screen.getAllByText("退会を申請する")[1]);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(screen.getByRole("alert").textContent).toMatch(
      /既に退会申請を受け付け中/,
    );
  });

  it("確認モーダルでキャンセルできる", () => {
    render(<DeleteRequest />);
    fireEvent.click(screen.getByText("退会を申請する"));
    fireEvent.click(screen.getByText("キャンセル"));
    expect(screen.queryByText("退会を申請しますか？")).toBeNull();
  });
});
