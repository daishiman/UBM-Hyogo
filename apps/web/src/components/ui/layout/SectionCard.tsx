import type { ReactNode } from "react";
import { cn } from "../../../lib/cn";

export interface SectionCardProps {
  /** カード見出し（任意。無い場合は枠のみ） */
  title?: ReactNode;
  /** 見出し補足 */
  description?: ReactNode;
  /** 見出し右のアクション slot */
  actions?: ReactNode;
  /** トーン。default / subtle / accent */
  tone?: "default" | "subtle" | "accent";
  /** 内側余白。sm / md（既定）/ lg */
  padding?: "sm" | "md" | "lg";
  /** カード本体 */
  children: ReactNode;
  /** ルート要素タグ（既定 section） */
  as?: "section" | "article" | "div";
  /** 機械可読 ID 維持・追加属性のための透過 props */
  id?: string;
  className?: string;
  /** I-7: 既存 data-testid / data-component / data-state を透過 */
  "data-testid"?: string;
  "data-component"?: string;
  "data-state"?: string;
  "data-section"?: string;
  "data-region"?: string;
  "data-tone"?: string;
  "data-public-consent"?: string;
  /** アクセシビリティ属性の透過（aria-label 等） */
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  /** その他の data-* / aria-* 属性を透過するための index signature */
  [key: `data-${string}`]: string | undefined;
}

/**
 * SectionCard — 見出し付きカード枠の正本（情報グループ単位）。
 * 既存 Card 群の上位ラッパとして padding/tone/radius を強制する（presentational / stateless）。
 * I-7: 既存の data-testid / data-component / data-state / id は透過して機械可読 ID を保全する。
 */
export function SectionCard({
  title,
  description,
  actions,
  tone = "default",
  padding = "md",
  children,
  as: As = "section",
  id,
  className,
  ...rest
}: SectionCardProps) {
  return (
    <As
      {...rest}
      id={id}
      className={cn("ui-section-card", className)}
      data-component={rest["data-component"] ?? "section-card"}
      data-tone={tone}
      data-padding={padding}
    >
      {title ? (
        <header className="ui-section-card__head">
          <div className="ui-section-card__heading">
            <h2 className="ui-section-card__title">{title}</h2>
            {description ? <p className="ui-section-card__description">{description}</p> : null}
          </div>
          {actions ? <div className="ui-section-card__actions">{actions}</div> : null}
        </header>
      ) : null}
      <div className="ui-section-card__body">{children}</div>
    </As>
  );
}
