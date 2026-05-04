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

  it("error / gate オプションをクエリに付与する", () => {
    const replaceState = vi.fn();
    replaceLoginState("sent", "/admin", {
      historyImpl: { replaceState },
      error: "expired",
      gate: "admin",
    });
    expect(replaceState).toHaveBeenCalledWith(
      null,
      "",
      "/login?state=sent&redirect=%2Fadmin&error=expired&gate=admin",
    );
  });

  it("historyImpl 省略時は window.history.replaceState を呼ぶ", () => {
    const original = window.history.replaceState.bind(window.history);
    const spy = vi.fn();
    window.history.replaceState = spy as unknown as typeof window.history.replaceState;
    try {
      replaceLoginState("sent", "/profile");
      expect(spy).toHaveBeenCalledWith(null, "", "/login?state=sent&redirect=%2Fprofile");
    } finally {
      window.history.replaceState = original;
    }
  });

  it("window 未定義 (SSR) かつ historyImpl 未指定なら no-op", () => {
    const originalWindow = globalThis.window;
    // @ts-expect-error 一時的に SSR を模擬する
    delete globalThis.window;
    try {
      expect(() => replaceLoginState("sent", "/profile")).not.toThrow();
    } finally {
      globalThis.window = originalWindow;
    }
  });
});
