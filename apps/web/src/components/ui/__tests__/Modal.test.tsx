import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Modal } from "../Modal";

afterEach(() => cleanup());

describe("Modal", () => {
  it("open=false のとき何も描画しない", () => {
    render(
      <Modal open={false} onClose={() => {}} title="T">
        <div />
      </Modal>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("open=true で dialog / aria-modal / title を描画する", () => {
    render(
      <Modal open={true} onClose={() => {}} title="タイトル">
        <button>ok</button>
      </Modal>,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("aria-labelledby")).toBe("modal-title");
    expect(screen.getByText("タイトル")).toBeTruthy();
  });

  it("Escape キーで onClose が呼ばれる", () => {
    const onClose = vi.fn();
    render(
      <Modal open={true} onClose={onClose} title="T">
        <button>ok</button>
      </Modal>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("Tab で last → first へ循環", () => {
    render(
      <Modal open={true} onClose={() => {}} title="T">
        <button>First</button>
        <button>Last</button>
      </Modal>,
    );
    const buttons = screen.getAllByRole("button");
    buttons[1].focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(buttons[0]);
  });

  it("Shift+Tab で first → last へ循環", () => {
    render(
      <Modal open={true} onClose={() => {}} title="T">
        <button>First</button>
        <button>Last</button>
      </Modal>,
    );
    const buttons = screen.getAllByRole("button");
    buttons[0].focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(buttons[1]);
  });

  it("focusable 要素なしの場合 Tab は preventDefault されエラーにならない", () => {
    render(
      <Modal open={true} onClose={() => {}} title="T">
        <span>nothing focusable</span>
      </Modal>,
    );
    expect(() => fireEvent.keyDown(document, { key: "Tab" })).not.toThrow();
  });

  it("Escape 以外の key は onClose を呼ばない", () => {
    const onClose = vi.fn();
    render(
      <Modal open={true} onClose={onClose} title="T">
        <button>ok</button>
      </Modal>,
    );
    fireEvent.keyDown(document, { key: "ArrowDown" });
    expect(onClose).not.toHaveBeenCalled();
  });
});
