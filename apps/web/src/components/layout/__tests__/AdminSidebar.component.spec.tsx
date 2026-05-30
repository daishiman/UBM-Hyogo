// admin-shell-topbar-sidebar-integration: 旧 props-less AdminSidebar の spec は
// AdminSidebar.spec.tsx に置き換えられた。3 group + props 化のため互換性なし。
import { describe, expect, it } from "vitest";

describe("AdminSidebar (legacy spec superseded by AdminSidebar.spec.tsx)", () => {
  it("keeps the legacy spec file active as a supersession pointer", () => {
    expect("AdminSidebar.spec.tsx").toBe("AdminSidebar.spec.tsx");
  });
});
