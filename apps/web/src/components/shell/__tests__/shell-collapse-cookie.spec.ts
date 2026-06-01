import { describe, expect, it, beforeEach } from "vitest";

import {
  parseShellCollapsedCookie,
  readCollapsedFromDocument,
  serializeShellCollapsedCookie,
  writeShellCollapsedCookie,
} from "../shell-collapse-cookie";

beforeEach(() => {
  document.cookie = "ubm_shell_collapsed=; Path=/; Max-Age=0; SameSite=Lax";
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

  it("document.cookie に collapse 状態を書き込む", () => {
    writeShellCollapsedCookie(true);
    expect(document.cookie).toContain("ubm_shell_collapsed=true");
  });

  it("document.cookie から collapse 状態を読み取る", () => {
    document.cookie = "other=value; Path=/; SameSite=Lax";
    document.cookie = "ubm_shell_collapsed=true; Path=/; SameSite=Lax";
    expect(readCollapsedFromDocument()).toBe(true);
  });
});
