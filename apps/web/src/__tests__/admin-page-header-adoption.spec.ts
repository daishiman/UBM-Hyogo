import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = resolve(__dirname, "../../../..");
const read = (path: string) => readFileSync(resolve(REPO_ROOT, path), "utf-8");

const TASK_C_ADMIN_PAGES = [
  "apps/web/app/(admin)/admin/tags/page.tsx",
  "apps/web/app/(admin)/admin/meetings/page.tsx",
  "apps/web/app/(admin)/admin/meetings/[id]/page.tsx",
  "apps/web/app/(admin)/admin/schema/page.tsx",
  "apps/web/app/(admin)/admin/schema/history/page.tsx",
  "apps/web/app/(admin)/admin/requests/page.tsx",
  "apps/web/app/(admin)/admin/identity-conflicts/page.tsx",
  "apps/web/app/(admin)/admin/audit/page.tsx",
  "apps/web/app/(admin)/admin/dashboard/attendance/page.tsx",
] as const;

describe("admin Task C page header adoption", () => {
  it.each(TASK_C_ADMIN_PAGES)("%s uses AdminPageHeader", (path) => {
    expect(read(path)).toContain("AdminPageHeader");
  });

  it.each(TASK_C_ADMIN_PAGES)("%s does not render Breadcrumb directly", (path) => {
    expect(read(path)).not.toMatch(/<Breadcrumb\b/);
    expect(read(path)).not.toMatch(/from ["']@\/components\/admin\/Breadcrumb["']/);
  });

  it("identity-conflicts page has no local main or Tailwind palette literals", () => {
    const source = read("apps/web/app/(admin)/admin/identity-conflicts/page.tsx");

    expect(source).not.toMatch(/<main\b/);
    expect(source).not.toMatch(/\b(?:text|bg|border|divide)-(?:zinc|blue)-\d{2,3}\b/);
    expect(source).toContain("var(--ubm-color-link-default)");
  });
});
