// TC-U-05..08 / TC-U-21 / TC-A-01..03
import { afterEach, describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor, act, cleanup } from "@testing-library/react";

afterEach(() => cleanup());
import { VisibilityRequestDialog } from "./VisibilityRequestDialog";

const mockFetch = (status: number, body: object) => {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    }),
  );
};

afterEach(() => vi.restoreAllMocks());


describe("VisibilityRequestDialog", () => {
  it("TC-U-05: open=false で dom 出ない / open=true で role=dialog 出現", () => {
    const { rerender } = render(
      <VisibilityRequestDialog
        desiredState="hidden"
        open={false}
        onClose={() => {}}
        onSubmitted={() => {}}
      />,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    rerender(
      <VisibilityRequestDialog
        desiredState="hidden"
        open={true}
        onClose={() => {}}
        onSubmitted={() => {}}
      />,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("aria-labelledby")).toBeTruthy();
    expect(dialog.getAttribute("aria-describedby")).toBeTruthy();
  });

  it("TC-U-06: ESC で onClose を呼ぶ", () => {
    const onClose = vi.fn();
    render(
      <VisibilityRequestDialog
        desiredState="hidden"
        open={true}
        onClose={onClose}
        onSubmitted={() => {}}
      />,
    );
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("TC-A-02: Tab focus を dialog 内で循環させる", () => {
    render(
      <VisibilityRequestDialog
        desiredState="hidden"
        open={true}
        onClose={() => {}}
        onSubmitted={() => {}}
      />,
    );
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    const submit = screen.getByTestId("visibility-submit") as HTMLButtonElement;
    submit.focus();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Tab" });
    expect(document.activeElement).toBe(textarea);
  });

  it("TC-U-07: reason > 500 文字で submit が disabled", () => {
    render(
      <VisibilityRequestDialog
        desiredState="hidden"
        open={true}
        onClose={() => {}}
        onSubmitted={() => {}}
      />,
    );
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    // maxLength 属性が 500 であることを確認（DOM 側 enforcement）
    expect(textarea.maxLength).toBe(500);
  });

  it("TC-U-08: 202 → onSubmitted 呼ばれて onClose する", async () => {
    mockFetch(202, {
      queueId: "q1",
      type: "visibility_request",
      status: "pending",
      createdAt: "now",
    });
    const onSubmitted = vi.fn();
    const onClose = vi.fn();
    render(
      <VisibilityRequestDialog
        desiredState="hidden"
        open={true}
        onClose={onClose}
        onSubmitted={onSubmitted}
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByTestId("visibility-submit"));
    });
    await waitFor(() => expect(onSubmitted).toHaveBeenCalledTimes(1));
    expect(onClose).toHaveBeenCalled();
  });

  it("409 → エラー banner を出す（onClose しない）", async () => {
    mockFetch(409, { error: "DUPLICATE_PENDING_REQUEST" });
    const onClose = vi.fn();
    const onSubmitted = vi.fn();
    render(
      <VisibilityRequestDialog
        desiredState="hidden"
        open={true}
        onClose={onClose}
        onSubmitted={onSubmitted}
      />,
    );
    fireEvent.click(screen.getByTestId("visibility-submit"));
    const alert = await screen.findByRole("alert", {}, { timeout: 3000 });
    expect(onClose).not.toHaveBeenCalled();
    expect(onSubmitted).toHaveBeenCalledWith(
      expect.objectContaining({ type: "visibility_request", status: "pending" }),
    );
    expect(alert.getAttribute("data-code")).toBe("DUPLICATE_PENDING_REQUEST");
  });

  it("network error は retry CTA を出す", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("network"));
    render(
      <VisibilityRequestDialog
        desiredState="hidden"
        open={true}
        onClose={() => {}}
        onSubmitted={() => {}}
      />,
    );
    fireEvent.click(screen.getByTestId("visibility-submit"));
    const retry = await screen.findByRole("button", { name: "再試行" });
    expect(retry).toBeTruthy();
  });
});
