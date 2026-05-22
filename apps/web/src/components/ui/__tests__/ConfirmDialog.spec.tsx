// serial-05 step-06: ConfirmDialog presentational component tests (Phase 4 C1-C10)
import { describe, it, expect, vi, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ConfirmDialog } from "../ConfirmDialog";

afterEach(() => {
  cleanup();
});

const baseProps = {
  open: true,
  title: "確認",
  confirmLabel: "実行",
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
};

describe("ConfirmDialog", () => {
  it("C1: open=false なら dialog を描画しない", () => {
    render(<ConfirmDialog {...baseProps} open={false} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("C2: open=true なら aria 属性つき dialog を描画", () => {
    render(<ConfirmDialog {...baseProps} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    const labelledBy = dialog.getAttribute("aria-labelledby");
    expect(labelledBy).toBeTruthy();
    expect(document.getElementById(labelledBy!)).toBeTruthy();
  });

  it("C3: description ありで aria-describedby が付く", () => {
    render(<ConfirmDialog {...baseProps} description="本当に？" />);
    const describedBy = screen.getByRole("dialog").getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)).toBeTruthy();
    expect(screen.getByText("本当に？")).toBeTruthy();
  });

  it("C4: キャンセル button で onCancel", () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog {...baseProps} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));
    expect(onCancel).toHaveBeenCalled();
  });

  it("C5: backdrop クリックで onCancel", () => {
    const onCancel = vi.fn();
    const { container } = render(
      <ConfirmDialog {...baseProps} onCancel={onCancel} />,
    );
    const backdrop = container.querySelector(".ubm-confirm-backdrop") as HTMLElement;
    fireEvent.click(backdrop);
    expect(onCancel).toHaveBeenCalled();
  });

  it("C6: dialog 内クリックは onCancel を呼ばない (stopPropagation)", () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog {...baseProps} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("dialog"));
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("C7: Escape キーで onCancel (submitting=false)", () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog {...baseProps} onCancel={onCancel} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onCancel).toHaveBeenCalled();
  });

  it("C7b: submitting=true の Escape は onCancel を呼ばない", () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog {...baseProps} submitting onCancel={onCancel} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("C8: submitting=true で両 button が disabled", () => {
    render(<ConfirmDialog {...baseProps} submitting />);
    expect((screen.getByRole("button", { name: "キャンセル" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "実行" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("C8b: Tab focus を dialog 内で循環させる", () => {
    render(<ConfirmDialog {...baseProps} />);
    const buttons = screen.getAllByRole("button");
    buttons[1].focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(buttons[0]);
  });

  it("C8c: Shift+Tab focus を dialog 内で循環させる", () => {
    render(<ConfirmDialog {...baseProps} />);
    const buttons = screen.getAllByRole("button");
    buttons[0].focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(buttons[1]);
  });

  it("C9: validationError があれば role=alert で表示", () => {
    render(<ConfirmDialog {...baseProps} validationError="入力してね" />);
    expect(screen.getByRole("alert").textContent).toBe("入力してね");
  });

  it("C10: noteRequired は『必須』ラベル / onNoteChange 経由で値が反映", () => {
    const onNoteChange = vi.fn();
    render(
      <ConfirmDialog
        {...baseProps}
        note=""
        noteRequired
        onNoteChange={onNoteChange}
      />,
    );
    expect(screen.getByText(/必須/)).toBeTruthy();
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "x" } });
    expect(onNoteChange).toHaveBeenCalledWith("x");
  });

  it("isDestructive で data-destructive 属性が付与", () => {
    render(<ConfirmDialog {...baseProps} isDestructive />);
    const btn = screen.getByRole("button", { name: "実行" });
    expect(btn.getAttribute("data-destructive")).toBe("true");
  });
});
