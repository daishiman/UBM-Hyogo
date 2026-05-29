// issue-958 Track C: AllHiddenFallback の文言と CTA リンクを検証する。

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AllHiddenFallback } from "../AllHiddenFallback";

describe("AllHiddenFallback", () => {
  it("memberCount を本文に埋め込み、ログイン/admin CTA を提示する", () => {
    render(<AllHiddenFallback memberCount={42} />);
    expect(
      screen.getByText("現在、公開設定中のメンバーがいません"),
    ).toBeTruthy();
    expect(screen.getByText(/会員 42 名が在籍/)).toBeTruthy();
    const login = screen.getByTestId("all-hidden-login-cta") as HTMLAnchorElement;
    expect(login.getAttribute("href")).toBe("/login");
    const admin = screen.getByTestId("all-hidden-admin-cta") as HTMLAnchorElement;
    expect(admin.getAttribute("href")).toBe("/admin");
  });
});
