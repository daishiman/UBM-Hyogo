// TC-U-09 / TC-U-10 / TC-A-06
import { afterEach, describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor, act, cleanup } from "@testing-library/react";

const routerMock = vi.hoisted(() => ({
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: routerMock.refresh }),
}));

import { DeleteRequestDialog } from "./DeleteRequestDialog";

const mockFetch = (status: number, body: object) => {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    }),
  );
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  routerMock.refresh.mockClear();
});

describe("DeleteRequestDialog", () => {
  it("TC-U-09: チェック未入力で submit が disabled", () => {
    render(
      <DeleteRequestDialog
        open={true}
        onClose={() => {}}
        onSubmitted={() => {}}
      />,
    );
    const submit = screen.getByTestId("delete-submit") as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
  });

  it("TC-U-10: 不可逆性文言が出ている / submit が aria-describedby で説明される", () => {
    render(
      <DeleteRequestDialog
        open={true}
        onClose={() => {}}
        onSubmitted={() => {}}
      />,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog.textContent).toContain("不可逆");
    const submit = screen.getByTestId("delete-submit");
    const describedBy = submit.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    const desc = document.getElementById(describedBy!);
    expect(desc?.getAttribute("data-irreversible")).toBe("true");
  });

  it("TC-A-02: Tab focus を dialog 内で循環させる", () => {
    render(
      <DeleteRequestDialog
        open={true}
        onClose={() => {}}
        onSubmitted={() => {}}
      />,
    );
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    const cancel = screen.getByRole("button", { name: "キャンセル" });
    cancel.focus();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Tab" });
    expect(document.activeElement).toBe(textarea);
  });

  it("チェック後に submit 有効化 → 202 で onSubmitted", async () => {
    mockFetch(202, {
      queueId: "q1",
      type: "delete_request",
      status: "pending",
      createdAt: "now",
    });
    const onSubmitted = vi.fn();
    render(
      <DeleteRequestDialog
        open={true}
        onClose={() => {}}
        onSubmitted={onSubmitted}
      />,
    );
    fireEvent.click(screen.getByTestId("delete-confirm-checkbox"));
    await act(async () => {
      fireEvent.click(screen.getByTestId("delete-submit"));
    });
    await waitFor(() => expect(onSubmitted).toHaveBeenCalledTimes(1));
  });

  it("TC-RR-03: 202 → router.refresh を onSubmitted / onClose より先に呼ぶ", async () => {
    mockFetch(202, {
      queueId: "q1",
      type: "delete_request",
      status: "pending",
      createdAt: "now",
    });
    const onSubmitted = vi.fn();
    const onClose = vi.fn();
    render(
      <DeleteRequestDialog
        open={true}
        onClose={onClose}
        onSubmitted={onSubmitted}
      />,
    );
    fireEvent.click(screen.getByTestId("delete-confirm-checkbox"));
    await act(async () => {
      fireEvent.click(screen.getByTestId("delete-submit"));
    });
    await waitFor(() => expect(routerMock.refresh).toHaveBeenCalledTimes(1));
    expect(routerMock.refresh.mock.invocationCallOrder[0]).toBeLessThan(
      onSubmitted.mock.invocationCallOrder[0],
    );
    expect(onSubmitted.mock.invocationCallOrder[0]).toBeLessThan(
      onClose.mock.invocationCallOrder[0],
    );
  });

  it("TC-RR-04: 409 → router.refresh を呼ばない", async () => {
    mockFetch(409, { error: "DUPLICATE_PENDING_REQUEST" });
    const onSubmitted = vi.fn();
    render(
      <DeleteRequestDialog
        open={true}
        onClose={() => {}}
        onSubmitted={onSubmitted}
      />,
    );
    fireEvent.click(screen.getByTestId("delete-confirm-checkbox"));
    fireEvent.click(screen.getByTestId("delete-submit"));
    const alert = await screen.findByRole("alert", {}, { timeout: 3000 });
    expect(onSubmitted).toHaveBeenCalledWith(
      expect.objectContaining({ type: "delete_request", status: "pending" }),
    );
    expect(alert.getAttribute("data-code")).toBe("DUPLICATE_PENDING_REQUEST");
    expect(routerMock.refresh).not.toHaveBeenCalled();
  });
});
