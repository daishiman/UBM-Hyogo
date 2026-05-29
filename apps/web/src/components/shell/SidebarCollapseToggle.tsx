"use client";

import { useSidebarShellContext } from "./SidebarShellContext";
import { CollapseIcon, ExpandIcon } from "./icons";

/**
 * sidebar の expand / collapse トグル。state は持たず context の toggleCollapsed を呼ぶ（I-E2）。
 * md+ の sidebar 内でのみ意味を持つため、呼び出し側で配置する。
 */
export function SidebarCollapseToggle() {
  const { mode, toggleCollapsed } = useSidebarShellContext();
  const collapsed = mode === "collapsed";
  return (
    <button
      type="button"
      data-component="shell-collapse-toggle"
      aria-expanded={collapsed ? "false" : "true"}
      aria-label={collapsed ? "サイドバーを展開" : "サイドバーを折り畳む"}
      onClick={toggleCollapsed}
      className="inline-flex h-9 w-9 items-center justify-center rounded-sm text-[var(--shell-fg)] hover:bg-[var(--ubm-color-surface-hover,var(--ubm-color-surface-bg-2))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ubm-color-accent)]"
    >
      {collapsed ? <ExpandIcon aria-hidden="true" /> : <CollapseIcon aria-hidden="true" />}
    </button>
  );
}
