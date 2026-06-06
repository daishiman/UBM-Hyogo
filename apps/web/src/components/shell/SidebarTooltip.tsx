"use client";

import { cloneElement, useId, type ReactElement } from "react";

type DescribedElement = ReactElement<{ readonly "aria-describedby"?: string }>;

export interface SidebarTooltipProps {
  readonly label: string;
  readonly collapsed: boolean;
  readonly children: DescribedElement;
}

export function SidebarTooltip({ label, collapsed, children }: SidebarTooltipProps) {
  const reactId = useId();
  const tooltipId = `shell-tooltip-${reactId.replace(/:/g, "")}`;

  if (!collapsed) return children;

  const describedBy = [children.props["aria-describedby"], tooltipId].filter(Boolean).join(" ");

  return (
    <span className="ubm-shell-tooltip-wrap" data-shell-block="tooltip-wrap">
      {cloneElement(children, { "aria-describedby": describedBy })}
      <span id={tooltipId} role="tooltip" className="ubm-shell-tooltip">
        {label}
      </span>
    </span>
  );
}
