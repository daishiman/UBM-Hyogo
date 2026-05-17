import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Issue #749 — primitive adoption import-tree assertions.
// 等価な grep gate を実行時にも担保するため、各 panel ファイルが共有
// primitive entrypoint を import していることを文字列レベルで検査する。

const REPO_ROOT = resolve(__dirname, "../../../../../..");
const read = (p: string) => readFileSync(resolve(REPO_ROOT, p), "utf-8");

const MUTATING_PANELS = [
  "apps/web/src/components/admin/MeetingPanel.tsx",
  "apps/web/src/components/admin/TagQueuePanel.tsx",
  "apps/web/src/components/admin/SchemaDiffPanel.tsx",
  "apps/web/src/components/admin/RequestQueuePanel.tsx",
];

const ADMIN_PAGES = [
  "apps/web/app/(admin)/admin/page.tsx",
  "apps/web/app/(admin)/admin/members/page.tsx",
  "apps/web/app/(admin)/admin/tags/page.tsx",
  "apps/web/app/(admin)/admin/meetings/page.tsx",
  "apps/web/app/(admin)/admin/schema/page.tsx",
  "apps/web/app/(admin)/admin/requests/page.tsx",
  "apps/web/app/(admin)/admin/identity-conflicts/page.tsx",
  "apps/web/app/(admin)/admin/audit/page.tsx",
];

const EMPTY_STATE_SURFACES = [
  "apps/web/src/features/admin/components/_members/MembersTable.tsx",
  "apps/web/src/components/admin/MeetingPanel.tsx",
  "apps/web/src/components/admin/TagQueuePanel.tsx",
  "apps/web/src/components/admin/SchemaDiffPanel.tsx",
  "apps/web/src/components/admin/RequestQueuePanel.tsx",
  "apps/web/src/components/admin/AuditLogPanel.tsx",
  "apps/web/app/(admin)/admin/identity-conflicts/page.tsx",
];

const PAGED_SURFACES = [
  "apps/web/src/features/admin/components/_members/MembersTable.tsx",
  "apps/web/src/components/admin/RequestQueuePanel.tsx",
  "apps/web/src/components/admin/AuditLogPanel.tsx",
];

describe("Issue #749 — primitive adoption", () => {
  it.each(MUTATING_PANELS)(
    "%s uses useAdminMutation trigger from features/admin/hooks (C2)",
    (panel) => {
      const src = read(panel);
      expect(src).toContain("features/admin/hooks/useAdminMutation");
      expect(src).toContain(".trigger(");
      expect(src).not.toMatch(/void _.*Mutation/);
    },
  );

  it.each(ADMIN_PAGES)(
    "%s renders Breadcrumb primitive directly or through AdminPageHeader (C3)",
    (page) => {
      const src = read(page);
      expect(src).toMatch(/<Breadcrumb|<AdminPageHeader/);
      expect(src).not.toContain("void Breadcrumb");
    },
  );

  it("admin/ + DensityToggle contain no raw <input element (C1)", () => {
    for (const p of [
      ...MUTATING_PANELS,
      "apps/web/src/components/admin/AuditLogPanel.tsx",
      "apps/web/src/components/admin/Breadcrumb.tsx",
      "apps/web/src/components/admin/IdentityConflictRow.tsx",
      "apps/web/src/components/public/DensityToggle.client.tsx",
    ]) {
      const src = read(p);
      expect(src).not.toMatch(/<input[\s/>]/);
    }
  });

  it.each(EMPTY_STATE_SURFACES)("%s renders EmptyState primitive (C5)", (surface) => {
    expect(read(surface)).toMatch(/<EmptyState/);
  });

  it.each(PAGED_SURFACES)("%s renders Pagination primitive (C6)", (surface) => {
    expect(read(surface)).toMatch(/<Pagination/);
  });
});
