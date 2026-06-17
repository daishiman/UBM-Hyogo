import type { ReactNode } from "react";
import { cn } from "../../../lib/cn";

export interface ContentCardProps {
  /** カード見出し（任意） */
  heading?: ReactNode;
  /** メディア（Avatar・アイコン等の slot、任意） */
  media?: ReactNode;
  /** 本文 */
  children: ReactNode;
  /** フッタ（メタ情報・リンク等） */
  footer?: ReactNode;
  /** クリック可能カードにする場合のリンク先（指定時 <a> でラップ） */
  href?: string;
  /** href 指定時の interactive ホバー演出 */
  interactive?: boolean;
  tone?: "default" | "subtle" | "accent";
  padding?: "sm" | "md" | "lg";
  className?: string;
  id?: string;
}

/**
 * ContentCard — 情報1かたまり = 1カードの最小単位（MemberCard 等の基盤）。
 * href 指定で <a> ラップ（クリック可能カード）、未指定で <article>（presentational / stateless）。
 */
export function ContentCard({
  heading,
  media,
  children,
  footer,
  href,
  interactive,
  tone = "default",
  padding = "md",
  className,
  id,
}: ContentCardProps) {
  const common = {
    id,
    className: cn("ui-content-card", className),
    "data-component": "content-card",
    "data-tone": tone,
    "data-padding": padding,
    ...(href && interactive ? { "data-interactive": "true" as const } : {}),
  };
  const body = (
    <>
      {media ? <div className="ui-content-card__media">{media}</div> : null}
      {heading ? <div className="ui-content-card__heading">{heading}</div> : null}
      <div className="ui-content-card__body">{children}</div>
      {footer ? <div className="ui-content-card__footer">{footer}</div> : null}
    </>
  );
  return href ? (
    <a href={href} {...common}>
      {body}
    </a>
  ) : (
    <article {...common}>{body}</article>
  );
}
