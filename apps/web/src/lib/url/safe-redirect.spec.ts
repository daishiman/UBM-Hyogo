import { describe, expect, it } from "vitest";

import { isSafeInternalRedirect, normalizeRedirectPath } from "./safe-redirect";

describe("isSafeInternalRedirect", () => {
  it("accepts a plain internal absolute path", () => {
    expect(isSafeInternalRedirect("/profile")).toBe(true);
    expect(isSafeInternalRedirect("/admin/members?q=1")).toBe(true);
  });

  it("rejects paths not starting with a single slash", () => {
    expect(isSafeInternalRedirect("profile")).toBe(false);
    expect(isSafeInternalRedirect("https://evil.example/")).toBe(false);
  });

  it("rejects protocol-relative URLs", () => {
    expect(isSafeInternalRedirect("//evil.example")).toBe(false);
  });

  it("rejects the login path to avoid redirect loops", () => {
    expect(isSafeInternalRedirect("/login")).toBe(false);
    expect(isSafeInternalRedirect("/login?next=/x")).toBe(false);
  });

  it("rejects backslash-containing paths", () => {
    expect(isSafeInternalRedirect("/foo\\bar")).toBe(false);
  });

  it("rejects paths containing control characters", () => {
    // U+0001 (制御文字) と U+007F (DEL) を含む内部パスを拒否する分岐
    expect(isSafeInternalRedirect(`/foo${String.fromCharCode(1)}bar`)).toBe(false);
    expect(isSafeInternalRedirect(`/foo${String.fromCharCode(127)}`)).toBe(false);
  });
});

describe("normalizeRedirectPath", () => {
  it("returns the value when it is a safe internal path", () => {
    expect(normalizeRedirectPath("/profile")).toBe("/profile");
  });

  it("falls back to /profile for unsafe or non-string values", () => {
    expect(normalizeRedirectPath("//evil.example")).toBe("/profile");
    expect(normalizeRedirectPath(123)).toBe("/profile");
    expect(normalizeRedirectPath(undefined)).toBe("/profile");
  });
});
