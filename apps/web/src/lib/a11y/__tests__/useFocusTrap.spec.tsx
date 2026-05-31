import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { useRef } from "react";
import * as isBrowser from "../../is-browser";
import { useFocusTrap } from "../useFocusTrap";

function Harness({
  open,
  onClose,
  empty = false,
}: {
  open: boolean;
  onClose: () => void;
  empty?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(open, onClose, ref);
  if (!open) return null;
  return (
    <div ref={ref}>
      {empty ? null : (
        <>
          <a href="/a">first</a>
          <a href="/b">last</a>
        </>
      )}
    </div>
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("useFocusTrap (trap の単一 source・全 branch)", () => {
  it("open で ref 内最初の focusable へ初期 focus (AC-E6)", () => {
    const { getByText } = render(<Harness open onClose={vi.fn()} />);
    expect(document.activeElement).toBe(getByText("first"));
  });

  it("Tab で末尾→先頭、Shift+Tab で先頭→末尾にループ (AC-E6)", () => {
    const { getByText } = render(<Harness open onClose={vi.fn()} />);
    getByText("last").focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(getByText("first"));

    getByText("first").focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(getByText("last"));
  });

  it("Escape で onClose を呼ぶ (AC-E4)", () => {
    const onClose = vi.fn();
    render(<Harness open onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("focusables 0 件で Tab は preventDefault され例外を投げない", () => {
    render(<Harness open onClose={vi.fn()} empty />);
    expect(() => fireEvent.keyDown(document, { key: "Tab" })).not.toThrow();
  });

  it("browserDocument()=undefined（SSR 相当）で effect 全体が no-op", () => {
    const spy = vi.spyOn(isBrowser, "browserDocument").mockReturnValue(undefined);
    const onClose = vi.fn();
    render(<Harness open onClose={onClose} />);
    // listener が張られないため Escape でも onClose は呼ばれない
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("close（unmount）で previousFocus を復帰する", () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();
    const { rerender } = render(<Harness open onClose={vi.fn()} />);
    expect(document.activeElement).not.toBe(trigger);
    rerender(<Harness open={false} onClose={vi.fn()} />);
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });
});
