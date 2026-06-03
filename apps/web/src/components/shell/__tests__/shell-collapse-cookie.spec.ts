import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  parseShellCollapsedCookie,
  readCollapsedFromDocument,
  serializeShellCollapsedCookie,
  writeShellCollapsedCookie,
} from "../shell-collapse-cookie";

beforeEach(() => {
  document.cookie = "ubm_shell_collapsed=; Path=/; Max-Age=0; SameSite=Lax";
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("shell-collapse-cookie", () => {
  it("cookie value を boolean に parse する", () => {
    expect(parseShellCollapsedCookie("true")).toBe(true);
    expect(parseShellCollapsedCookie("false")).toBe(false);
    expect(parseShellCollapsedCookie("unexpected")).toBeNull();
    expect(parseShellCollapsedCookie(null)).toBeNull();
  });

  it("client writable な sidebar cookie を serialize する", () => {
    expect(serializeShellCollapsedCookie(true)).toContain("ubm_shell_collapsed=true");
    expect(serializeShellCollapsedCookie(false)).toContain("ubm_shell_collapsed=false");
    expect(serializeShellCollapsedCookie(true)).toContain("Path=/");
    expect(serializeShellCollapsedCookie(true)).toContain("SameSite=Lax");
    expect(serializeShellCollapsedCookie(true)).toContain("Max-Age=31536000");
  });

  it("Secure 属性を production HTTPS 向けに付与できる", () => {
    expect(serializeShellCollapsedCookie(true, true)).toBe(
      "ubm_shell_collapsed=true; Path=/; Max-Age=31536000; SameSite=Lax; Secure",
    );
  });

  it("Secure 属性付きでも既存属性を維持し末尾に付与する", () => {
    const serialized = serializeShellCollapsedCookie(true, true);
    expect(serialized).toContain("ubm_shell_collapsed=true");
    expect(serialized).toContain("Path=/");
    expect(serialized).toContain("Max-Age=31536000");
    expect(serialized).toContain("SameSite=Lax");
    expect(serialized).not.toContain("HttpOnly");
    expect(serialized.endsWith("; Secure")).toBe(true);
  });

  it("localhost / http 向けには Secure 属性を付与しない", () => {
    expect(serializeShellCollapsedCookie(false, false)).toBe(
      "ubm_shell_collapsed=false; Path=/; Max-Age=31536000; SameSite=Lax",
    );
  });

  it("jsdom 既定の http runtime では Secure 属性を付与しない", () => {
    expect(serializeShellCollapsedCookie(true)).not.toContain("; Secure");
  });

  it("HTTPS runtime では secure 引数省略時にも Secure 属性を付与する", () => {
    vi.stubGlobal("document", { location: { protocol: "https:" } });

    expect(serializeShellCollapsedCookie(true)).toBe(
      "ubm_shell_collapsed=true; Path=/; Max-Age=31536000; SameSite=Lax; Secure",
    );
  });

  it("document.cookie に collapse 状態を書き込む", () => {
    writeShellCollapsedCookie(true);
    expect(document.cookie).toContain("ubm_shell_collapsed=true");
  });

  it("document.cookie から collapse 状態を読み取る", () => {
    document.cookie = "other=value; Path=/; SameSite=Lax";
    document.cookie = "ubm_shell_collapsed=true; Path=/; SameSite=Lax";
    expect(readCollapsedFromDocument()).toBe(true);
  });

  it("Secure 属性付きで発行された既存 cookie value を後方互換で parse する", () => {
    expect(parseShellCollapsedCookie("true")).toBe(true);
    expect(parseShellCollapsedCookie("false")).toBe(false);
  });
});
