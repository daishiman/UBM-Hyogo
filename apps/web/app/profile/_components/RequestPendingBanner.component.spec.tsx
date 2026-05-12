// TC-U-12 / TC-A-05
import { afterEach, describe, it, expect } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

afterEach(() => cleanup());
import { RequestPendingBanner } from "./RequestPendingBanner";

describe("RequestPendingBanner", () => {
  it("visibility_request 文言 + role=status + aria-live=polite", () => {
    render(<RequestPendingBanner type="visibility_request" />);
    const status = screen.getByRole("status");
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(status.textContent).toContain("公開状態の変更申請");
  });

  it("delete_request 文言切替", () => {
    render(<RequestPendingBanner type="delete_request" />);
    expect(screen.getByRole("status").textContent).toContain("退会申請");
  });

  it("createdAt が表示される", () => {
    render(
      <RequestPendingBanner
        type="delete_request"
        createdAt="2026-05-02T01:23:45.000Z"
      />,
    );
    expect(screen.getByRole("status").textContent).toContain(
      "2026-05-02T01:23:45.000Z",
    );
  });
});
