// admin-layout-sidebar-shell-migration TECH-M-01: schemaDiffCount SSOT。
// 旧 (admin)/layout.tsx#loadSchemaDiffCount を移設し、Task A の SidebarShellServer と共有する。
// 算出: /admin/schema/diff の items のうち status === "queued" の件数。失敗時は 0。
import { safeServerFetch } from "./safe-server-fetch";
import type { SchemaDiffListView } from "../../components/admin/SchemaDiffPanel";

export function countQueuedDiffs(view: SchemaDiffListView): number {
  return view.items.filter((item) => item.status === "queued").length;
}

export async function loadSchemaDiffCount(): Promise<number> {
  const result = await safeServerFetch<SchemaDiffListView>("/admin/schema/diff");
  if (!result.ok) return 0;
  return countQueuedDiffs(result.data);
}
