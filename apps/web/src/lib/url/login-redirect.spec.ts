// 06b: toLoginRedirect の encode / open redirect 防止テスト。

import { describe, expect, it } from "vitest";
import { toLoginRedirect } from "./login-redirect";

describe("toLoginRedirect", () => {
  it("/profile を encodeURIComponent してクエリに付与する", () => {
    expect(toLoginRedirect("/profile")).toBe("/login?redirect=%2Fprofile");
  });

  it("ネスト path も全て encode される", () => {
    expect(toLoginRedirect("/profile/edit")).toBe(
      "/login?redirect=%2Fprofile%2Fedit",
    );
  });

  it("'/' 始まりでない値は /profile fallback", () => {
    expect(toLoginRedirect("https://evil.example")).toBe(
      "/login?redirect=%2Fprofile",
    );
  });

  it("http URL は /profile fallback", () => {
    expect(toLoginRedirect("http://evil.example")).toBe(
      "/login?redirect=%2Fprofile",
    );
  });

  it("protocol-relative '//evil' も /profile fallback", () => {
    expect(toLoginRedirect("//evil.example/x")).toBe(
      "/login?redirect=%2Fprofile",
    );
  });

  it("backslash を含む path も /profile fallback", () => {
    expect(toLoginRedirect("/\\evil")).toBe("/login?redirect=%2Fprofile");
  });

  it("backslash を含む nested path も /profile fallback", () => {
    expect(toLoginRedirect("/admin\\..\\evil")).toBe(
      "/login?redirect=%2Fprofile",
    );
  });

  it("/login への redirect loop は /profile fallback", () => {
    expect(toLoginRedirect("/login?redirect=%2Fadmin")).toBe(
      "/login?redirect=%2Fprofile",
    );
  });
});
