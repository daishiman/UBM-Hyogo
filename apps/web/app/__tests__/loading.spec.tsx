import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import Loading from "../loading";

afterEach(() => {
  cleanup();
});

describe("Loading", () => {
  it("has role=status / aria-busy / aria-live attributes on the main landmark", () => {
    const { container } = render(<Loading />);
    const main = container.querySelector("main");
    expect(main).not.toBeNull();
    expect(main?.getAttribute("role")).toBe("status");
    expect(main?.getAttribute("aria-busy")).toBe("true");
    expect(main?.getAttribute("aria-live")).toBe("polite");
    expect(main?.getAttribute("data-page")).toBe("loading");
  });

  it("renders sr-only 読み込み中 text for assistive tech", () => {
    render(<Loading />);
    expect(screen.getByText("読み込み中")).toBeTruthy();
  });

  it("renders four skeleton blocks with bg-surface-2 + motion-safe pulse", () => {
    const { container } = render(<Loading />);
    const skeletons = container.querySelectorAll("div.bg-surface-2.motion-safe\\:animate-pulse");
    expect(skeletons.length).toBe(4);
  });

  it("wraps skeletons in a Card primitive", () => {
    const { container } = render(<Loading />);
    const html = container.innerHTML;
    expect(html).toContain("ui-card");
    expect(html).toContain("ui-card-content");
  });
});
