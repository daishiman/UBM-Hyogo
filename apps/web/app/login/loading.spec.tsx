import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import LoginLoading from "./loading";

afterEach(() => cleanup());

describe("LoginLoading", () => {
  it("renders an accessible loading status", () => {
    const { container } = render(<LoginLoading />);

    const status = screen.getByRole("status");
    expect(status.getAttribute("aria-busy")).toBe("true");
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(status.getAttribute("data-page")).toBe("login-loading");
    expect(screen.getByText("ログイン画面を読み込み中")).toBeTruthy();
    expect(container.innerHTML).toContain("bg-surface-2");
    expect(container.innerHTML).toContain("motion-safe:animate-pulse");
  });
});
