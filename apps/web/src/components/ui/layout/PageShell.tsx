import type { ReactNode } from "react";
import { cn } from "../../../lib/cn";

export interface PageShellProps {
  /** 縦に積むセクション群 */
  children: ReactNode;
  /** 最大幅。narrow=640 / default=960 / wide=1200（CSS 側で解決） */
  maxWidth?: "narrow" | "default" | "wide";
  /** 背景。base=surface-bg / subtle=surface-bg-2 / bare=透明（auth等） */
  background?: "base" | "subtle" | "bare";
  /** セクション間の縦リズム。sm/md/lg（gap） */
  gap?: "sm" | "md" | "lg";
  /** 追加クラス（拡張用、原則不要） */
  className?: string;
}

/**
 * PageShell — 背景・最大幅・縦リズム余白の正本。
 * 公開層/会員層の各ページ枠をこのコンポーネントへ集約する（presentational / stateless）。
 */
export function PageShell({
  children,
  maxWidth = "default",
  background = "base",
  gap = "lg",
  className,
}: PageShellProps) {
  return (
    <div
      className={cn("ui-page-shell", className)}
      data-component="page-shell"
      data-max-width={maxWidth}
      data-bg={background}
      data-gap={gap}
    >
      {children}
    </div>
  );
}
