import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const webRoot = root.endsWith(join("apps", "web")) ? root : join(root, "apps", "web");
const repoRoot = webRoot.endsWith(join("apps", "web"))
  ? join(webRoot, "..", "..")
  : root;
const appPath = (...segments: string[]) => join(webRoot, "app", ...segments);
const specPath = (...segments: string[]) => join(repoRoot, "docs", ...segments);

const readAppFile = (...segments: string[]) =>
  readFileSync(appPath(...segments), "utf8");
const readSpecFile = (...segments: string[]) =>
  readFileSync(specPath(...segments), "utf8");

describe("sidebar shell route topology", () => {
  it("/login is owned by the bare auth route group", () => {
    expect(existsSync(appPath("(auth)", "login", "page.tsx"))).toBe(true);
    expect(existsSync(appPath("(public)", "login"))).toBe(false);
  });

  it("(auth) layout does not import sidebar shell primitives", () => {
    const source = readAppFile("(auth)", "layout.tsx");
    expect(source).not.toContain("SidebarShellServer");
    expect(source).not.toContain("SidebarMobileTrigger");
    expect(source).not.toContain("getSession");
    expect(source).not.toContain("next-auth");
  });

  it("shell route groups keep sidebar shell ownership", () => {
    for (const group of ["(public)", "(member)", "(admin)"]) {
      const source = readAppFile(group, "layout.tsx");
      expect(source).toContain("SidebarShellServer");
    }
  });

  it("admin active path is resolved from x-pathname instead of a hard-coded prop", () => {
    const source = readAppFile("(admin)", "layout.tsx");
    expect(source).toContain('get("x-pathname")');
    expect(source).not.toContain('activePath="/admin"');
  });

  it("09h shell spec stays synchronized with the current admin nav contract", () => {
    const source = readSpecFile(
      "00-getting-started-manual",
      "specs",
      "09h-shell-and-fixtures.md",
    );
    expect(source).toContain("PUBLIC + MEMBERS + ADMIN | 14");
    expect(source).toContain("admin 専用 10 item");
    expect(source).toContain("role 別件数: viewer 3 / member 4 / admin 14");
    expect(source).toContain("| ADMIN | 出席分析 | `/admin/dashboard/attendance` | admin |");
    expect(source).toContain("| ADMIN | 開催日 | `/admin/meetings` | admin |");
    expect(source).toContain(
      "| ADMIN | Form回答 | `FORM_RESPONSES_EDIT_URL`（Google Form edit URL） | admin（外部リンク） |",
    );
  });
});
