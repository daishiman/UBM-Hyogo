// 06b-B U: VisibilityRequest 確認モーダル + 二重申請 409 表示。

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
    requestVisibilityChange: mockRequest,
  };
});

import { SelfRequestError } from "../../../../src/lib/api/me-requests-client";
import { VisibilityRequest } from "../VisibilityRequest.client";

afterEach(() => {
  cleanup();
  mockRequest.mockReset();
});

beforeEach(() => {
  mockRequest.mockReset();
});

describe("VisibilityRequest", () => {
  it("public → 公開停止申請を成功させる", async () => {
    mockRequest.mockResolvedValueOnce({
      queueId: "q",
      type: "visibility_request",
      status: "pending",
      createdAt: "x",
    });
    render(<VisibilityRequest publishState="public" />);
    fireEvent.click(screen.getByText("公開停止を申請する"));
    expect(screen.getByText(/公開停止を申請しますか/)).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByText("申請する"));
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(mockRequest).toHaveBeenCalledWith({ desiredState: "hidden" });
    expect(screen.getByRole("status").textContent).toMatch(
      /公開停止の申請を受け付け/,
    );
  });

  it("hidden → 再公開申請として送る", async () => {
    mockRequest.mockResolvedValueOnce({
      queueId: "q",
      type: "visibility_request",
      status: "pending",
      createdAt: "x",
    });
    render(<VisibilityRequest publishState="hidden" />);
    fireEvent.click(screen.getByText("再公開を申請する"));
    await act(async () => {
      fireEvent.click(screen.getByText("申請する"));
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(mockRequest).toHaveBeenCalledWith({ desiredState: "public" });
  });

  it("409 二重申請を分かるメッセージで表示する", async () => {
    mockRequest.mockRejectedValueOnce(
      new SelfRequestError(409, "DUPLICATE_PENDING_REQUEST"),
    );
    render(<VisibilityRequest publishState="public" />);
    fireEvent.click(screen.getByText("公開停止を申請する"));
    await act(async () => {
      fireEvent.click(screen.getByText("申請する"));
      await Promise.resolve();
      await Promise.resolve();
    });
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toMatch(/同じ申請を受け付け中/);
  });

  it("disabled の時は trigger 押下で modal が開かない", () => {
    render(<VisibilityRequest publishState="public" disabled />);
    const btn = screen.getByText("公開停止を申請する") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });
});
