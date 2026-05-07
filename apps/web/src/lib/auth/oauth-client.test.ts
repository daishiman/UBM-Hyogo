// ut-web-cov-03 Phase 5: oauth-client.ts unit test。
// 観点: callbackUrl 正規化（内部 path / open redirect / 未指定）と signIn provider id。

import { describe, expect, it, vi, beforeEach } from "vitest";

const signInMock = vi.fn(async (..._args: unknown[]) => undefined);

vi.mock("next-auth/react", () => ({
  signIn: (provider: string, options?: Record<string, unknown>) =>
    signInMock(provider, options),
}));

import { signInWithGoogle } from "./oauth-client";

describe("signInWithGoogle", () => {
  beforeEach(() => {
    signInMock.mockClear();
  });

  it("内部 path をそのまま callbackUrl として渡す", async () => {
    await signInWithGoogle("/profile/edit");
    expect(signInMock).toHaveBeenCalledWith("google", {
      callbackUrl: "/profile/edit",
    });
  });

  it("redirect 未指定なら /profile を fallback として使う", async () => {
    await signInWithGoogle();
    expect(signInMock).toHaveBeenCalledWith("google", {
      callbackUrl: "/profile",
    });
  });

  it("// で始まる schemeless URL は open redirect 防止で fallback する", async () => {
    await signInWithGoogle("//evil.example.com/steal");
    expect(signInMock).toHaveBeenCalledWith("google", {
      callbackUrl: "/profile",
    });
  });

  it("外部 URL (http:) は fallback する", async () => {
    await signInWithGoogle("http://evil.example.com");
    expect(signInMock).toHaveBeenCalledWith("google", {
      callbackUrl: "/profile",
    });
  });

  it("空文字も fallback する", async () => {
    await signInWithGoogle("");
    expect(signInMock).toHaveBeenCalledWith("google", {
      callbackUrl: "/profile",
    });
  });
});
