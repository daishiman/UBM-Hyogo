import type { ReactNode } from "react";
import { cn } from "../../../lib/cn";

export interface PageHeaderProps {
  /** 見出し上の小ラベル（任意） */
  eyebrow?: ReactNode;
  /** 見出し（h1, serif） */
  title: ReactNode;
  /** 補足リード文（任意） */
  lead?: ReactNode;
  /** 右側アクション（ボタン・トグル等の slot） */
  actions?: ReactNode;
  /** 寄せ。start（既定）/ center */
  align?: "start" | "center";
  className?: string;
}

/**
 * PageHeader — eyebrow + h1(serif) + lead + actions slot の正本。
 * 既存の `.page-head` ベタ書き div を置換する（presentational / stateless）。
 */
export function PageHeader({
  eyebrow,
  title,
  lead,
  actions,
  align = "start",
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("ui-page-header", className)} data-component="page-header" data-align={align}>
      <div className="ui-page-header__main">
        {eyebrow ? <p className="ui-page-header__eyebrow">{eyebrow}</p> : null}
        <h1 className="ui-page-header__title">{title}</h1>
        {lead ? <p className="ui-page-header__lead">{lead}</p> : null}
      </div>
      {actions ? <div className="ui-page-header__actions">{actions}</div> : null}
    </header>
  );
}
