import { describe, expect, it, vi } from "vitest";
import { replaceLoginState } from "./login-state";

describe("replaceLoginState", () => {
  it("email を含めず state と safe redirect だけを URL に反映する", () => {
    const replaceState = vi.fn();
    replaceLoginState("sent", "/profile", {
      historyImpl: { replaceState },
    });
    expect(replaceState).toHaveBeenCalledWith(
      null,
      "",
      "/login?state=sent&redirect=%2Fprofile",
    );
  });

  it("unsafe redirect は /profile に正規化する", () => {
    const replaceState = vi.fn();
    replaceLoginState("sent", "//evil.example/x", {
      historyImpl: { replaceState },
    });
    expect(replaceState).toHaveBeenCalledWith(
      null,
      "",
      "/login?state=sent&redirect=%2Fprofile",
    );
  });
});
