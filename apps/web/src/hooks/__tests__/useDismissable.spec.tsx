import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { useRef } from "react";

import * as browserEnv from "../../lib/is-browser";
import { useDismissable, type DismissReason } from "../useDismissable";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

interface FixtureProps {
  readonly enabled?: boolean;
  readonly onClose: (reason: DismissReason) => void;
}

function Fixture({ enabled, onClose }: FixtureProps) {
  const ref = useRef<HTMLDivElement>(null);
  useDismissable(ref, onClose, { enabled });
  return (
    <div>
      <div ref={ref} data-testid="inside">
        inside
      </div>
      <button type="button" data-testid="outside">
        outside
      </button>
    </div>
  );
}

function NullRefFixture({ onClose }: Pick<FixtureProps, "onClose">) {
  const ref = useRef<HTMLDivElement>(null);
  useDismissable(ref, onClose);
  return <button type="button">outside</button>;
}

function MultiFixture({
  onCloseA,
  onCloseB,
}: {
  readonly onCloseA: (reason: DismissReason) => void;
  readonly onCloseB: (reason: DismissReason) => void;
}) {
  const refA = useRef<HTMLDivElement>(null);
  const refB = useRef<HTMLDivElement>(null);
  useDismissable(refA, onCloseA);
  useDismissable(refB, onCloseB);
  return (
    <div>
      <div ref={refA} data-testid="inside-a">
        inside A
      </div>
      <div ref={refB} data-testid="inside-b">
        inside B
      </div>
    </div>
  );
}

describe("useDismissable", () => {
  it("外側 pointerdown で pointerdown-outside を通知する", () => {
    const onClose = vi.fn();
    const { getByTestId } = render(<Fixture onClose={onClose} />);

    fireEvent.pointerDown(getByTestId("outside"));

    expect(onClose).toHaveBeenCalledWith("pointerdown-outside");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("内側 pointerdown では通知しない", () => {
    const onClose = vi.fn();
    const { getByTestId } = render(<Fixture onClose={onClose} />);

    fireEvent.pointerDown(getByTestId("inside"));

    expect(onClose).not.toHaveBeenCalled();
  });

  it("Escape で escape を通知し、Escape 以外は無視する", () => {
    const onClose = vi.fn();
    render(<Fixture onClose={onClose} />);

    fireEvent.keyDown(document, { key: "Tab" });
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledWith("escape");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("enabled=false では listener を張らない", () => {
    const onClose = vi.fn();
    const { getByTestId } = render(<Fixture enabled={false} onClose={onClose} />);

    fireEvent.pointerDown(getByTestId("outside"));
    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).not.toHaveBeenCalled();
  });

  it("unmount で listener を解除する", () => {
    const onClose = vi.fn();
    const { unmount } = render(<Fixture onClose={onClose} />);

    unmount();
    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).not.toHaveBeenCalled();
  });

  it("browserDocument が undefined の環境では no-op", () => {
    vi.spyOn(browserEnv, "browserDocument").mockReturnValue(undefined);
    const onClose = vi.fn();

    function NoDocFixture() {
      const ref = useRef<HTMLDivElement>(null);
      useDismissable(ref, onClose);
      return <div ref={ref}>inside</div>;
    }

    expect(() => render(<NoDocFixture />)).not.toThrow();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("document.defaultView がない環境でも pointerdown を安全に扱う", () => {
    const listeners = new Map<string, EventListener>();
    const fakeDocument = {
      defaultView: undefined,
      addEventListener: vi.fn((type: string, listener: EventListener) => {
        listeners.set(type, listener);
      }),
      removeEventListener: vi.fn(),
    } as unknown as Document;
    vi.spyOn(browserEnv, "browserDocument").mockReturnValue(fakeDocument);
    const onClose = vi.fn();

    render(<Fixture onClose={onClose} />);
    const onPointerDown = listeners.get("pointerdown");
    expect(onPointerDown).toBeDefined();

    onPointerDown?.({ target: document.body } as unknown as PointerEvent);

    expect(onClose).toHaveBeenCalledWith("pointerdown-outside");
  });

  it("enabled 切替で listener を再構成する", () => {
    const onClose = vi.fn();
    const { rerender } = render(<Fixture enabled={false} onClose={onClose} />);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();

    rerender(<Fixture enabled={true} onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledWith("escape");

    onClose.mockClear();
    rerender(<Fixture enabled={false} onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("onClose 参照変化後は最新 callback を呼ぶ", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(<Fixture onClose={first} />);

    rerender(<Fixture onClose={second} />);
    fireEvent.keyDown(document, { key: "Escape" });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith("escape");
  });

  it("複数 instance の ref 判定が独立する", () => {
    const onCloseA = vi.fn();
    const onCloseB = vi.fn();
    const { getByTestId } = render(
      <MultiFixture onCloseA={onCloseA} onCloseB={onCloseB} />,
    );

    fireEvent.pointerDown(getByTestId("inside-a"));

    expect(onCloseA).not.toHaveBeenCalled();
    expect(onCloseB).toHaveBeenCalledWith("pointerdown-outside");
  });

  it("ref.current が null のとき throw せず通知しない", () => {
    const onClose = vi.fn();
    render(<NullRefFixture onClose={onClose} />);

    expect(() => fireEvent.pointerDown(document.body)).not.toThrow();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("callback 内で reason の網羅分岐を扱える", () => {
    const handled: string[] = [];
    const onClose = vi.fn((reason: DismissReason) => {
      switch (reason) {
        case "pointerdown-outside":
          handled.push("outside");
          return;
        case "escape":
          handled.push("escape");
          return;
      }
    });
    const { getByTestId } = render(<Fixture onClose={onClose} />);

    fireEvent.pointerDown(getByTestId("outside"));
    fireEvent.keyDown(document, { key: "Escape" });

    expect(handled).toEqual(["outside", "escape"]);
  });
});
