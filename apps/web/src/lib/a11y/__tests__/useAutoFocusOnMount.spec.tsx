import { render } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useAutoFocusOnMount } from "../useAutoFocusOnMount";

function TestHarness({ withElement }: { withElement: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useAutoFocusOnMount(ref);
  return withElement ? <div ref={ref} tabIndex={-1} data-testid="target" /> : null;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useAutoFocusOnMount", () => {
  it("calls focus with preventScroll on mount", () => {
    const focusSpy = vi.spyOn(HTMLElement.prototype, "focus");

    render(<TestHarness withElement />);

    expect(focusSpy).toHaveBeenCalledTimes(1);
    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
  });

  it("does not throw when ref.current is null", () => {
    const focusSpy = vi.spyOn(HTMLElement.prototype, "focus");

    expect(() => render(<TestHarness withElement={false} />)).not.toThrow();

    expect(focusSpy).not.toHaveBeenCalled();
  });

  it("does not refocus on rerender", () => {
    const focusSpy = vi.spyOn(HTMLElement.prototype, "focus");
    const { rerender } = render(<TestHarness withElement />);

    rerender(<TestHarness withElement />);

    expect(focusSpy).toHaveBeenCalledTimes(1);
  });
});
