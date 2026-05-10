// task-13 Phase 6: LoginCard の Props 契約テスト。

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { LoginCard } from "../LoginCard";

afterEach(() => cleanup());

describe("LoginCard", () => {
  it("title prop を h1 として描画する", () => {
    render(
      <LoginCard state="input" title="ログインしてね">
        <span>body</span>
      </LoginCard>,
    );
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "ログインしてね",
    );
  });

  it("data-testid / data-component / data-state が root に付与される", () => {
    render(
      <LoginCard state="sent" title="t">
        <span>body</span>
      </LoginCard>,
    );
    const root = screen.getByTestId("login-card");
    expect(root.getAttribute("data-component")).toBe("login-card");
    expect(root.getAttribute("data-state")).toBe("sent");
  });

  it("ロゴ alt が UBM 兵庫支部会", () => {
    render(
      <LoginCard state="input" title="t">
        <span>body</span>
      </LoginCard>,
    );
    expect(screen.getByRole("img", { name: "UBM 兵庫支部会" })).toBeTruthy();
  });

  it("footerSlot が描画される", () => {
    render(
      <LoginCard state="input" title="t" footerSlot={<a href="/r">footer</a>}>
        <span>body</span>
      </LoginCard>,
    );
    expect(screen.getByText("footer")).toBeTruthy();
  });

  it("children を描画する", () => {
    render(
      <LoginCard state="input" title="t">
        <span data-testid="body">body</span>
      </LoginCard>,
    );
    expect(screen.getByTestId("body").textContent).toBe("body");
  });
});
