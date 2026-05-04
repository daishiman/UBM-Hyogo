import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Drawer } from "../Drawer";

afterEach(() => cleanup());

describe("Drawer", () => {
  it("open=false のとき何も描画しない", () => {
    render(
      <Drawer open={false} onClose={() => {}} title="T">
        <div />
      </Drawer>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("open=true で aria-labelledby='drawer-title' を持つ", () => {
    render(
      <Drawer open={true} onClose={() => {}} title="ドロワー">
        <button>ok</button>
      </Drawer>,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-labelledby")).toBe("drawer-title");
    expect(document.getElementById("drawer-title")?.textContent).toBe("ドロワー");
  });

  it("Escape で onClose が呼ばれる", () => {
    const onClose = vi.fn();
    render(
      <Drawer open={true} onClose={onClose} title="T">
        <button>ok</button>
      </Drawer>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("Tab で last → first 循環", () => {
    render(
      <Drawer open={true} onClose={() => {}} title="T">
        <button>First</button>
        <button>Last</button>
      </Drawer>,
    );
    const buttons = screen.getAllByRole("button");
    buttons[1].focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(buttons[0]);
  });

  it("Shift+Tab で first → last 循環", () => {
    render(
      <Drawer open={true} onClose={() => {}} title="T">
        <button>First</button>
        <button>Last</button>
      </Drawer>,
    );
    const buttons = screen.getAllByRole("button");
    buttons[0].focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(buttons[1]);
  });

  it("focusable 要素 0 件で Tab を吸収しても throw しない", () => {
    render(
      <Drawer open={true} onClose={() => {}} title="T">
        <span>x</span>
      </Drawer>,
    );
    expect(() => fireEvent.keyDown(document, { key: "Tab" })).not.toThrow();
  });

  it("Escape 以外 / Tab 以外の key では onClose は呼ばれない", () => {
    const onClose = vi.fn();
    render(
      <Drawer open={true} onClose={onClose} title="T">
        <button>x</button>
      </Drawer>,
    );
    fireEvent.keyDown(document, { key: "Enter" });
    expect(onClose).not.toHaveBeenCalled();
  });
});
