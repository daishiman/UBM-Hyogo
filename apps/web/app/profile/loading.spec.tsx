import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import ProfileLoading from "./loading";

afterEach(() => {
  cleanup();
});

describe("ProfileLoading", () => {
  it("renders an accessible loading status", () => {
    render(<ProfileLoading />);

    const status = screen.getByRole("status");
    expect(status.getAttribute("aria-busy")).toBe("true");
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(status.getAttribute("data-page")).toBe("profile-loading");
  });

  it("announces the profile loading state to screen readers", () => {
    render(<ProfileLoading />);

    expect(screen.getByText("マイページを読み込み中")).toBeTruthy();
  });

  it("renders the avatar, heading, and four key-value skeleton blocks", () => {
    const { container } = render(<ProfileLoading />);

    expect(container.querySelectorAll(".bg-surface-2")).toHaveLength(6);
    expect(container.querySelectorAll(".motion-safe\\:animate-pulse")).toHaveLength(
      6,
    );
  });
});
