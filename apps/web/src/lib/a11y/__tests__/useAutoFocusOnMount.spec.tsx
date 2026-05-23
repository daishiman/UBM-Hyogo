import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useRef } from "react";
import { useAutoFocusOnMount } from "../useAutoFocusOnMount";

afterEach(() => {
  vi.restoreAllMocks();
});

function FocusHarness({ options }: { readonly options?: FocusOptions }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useAutoFocusOnMount(headingRef, options);

  return (
    <h1 ref={headingRef} tabIndex={-1}>
      Error heading
    </h1>
  );
}

describe("useAutoFocusOnMount", () => {
  it("mount 時に ref 対象へ focus を移す", () => {
    const { getByRole } = render(<FocusHarness />);
    expect(document.activeElement).toBe(getByRole("heading", { level: 1 }));
  });

  it("preventScroll=true を default で渡す", () => {
    const focusSpy = vi.spyOn(HTMLElement.prototype, "focus");
    render(<FocusHarness />);
    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
  });

  it("options で preventScroll を明示的に opt-out できる", () => {
    const focusSpy = vi.spyOn(HTMLElement.prototype, "focus");
    render(<FocusHarness options={{ preventScroll: false }} />);
    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: false });
  });
});
