import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export type CardProps = HTMLAttributes<HTMLDivElement>;
export type CardHeaderProps = HTMLAttributes<HTMLDivElement>;
export type CardTitleProps = HTMLAttributes<HTMLHeadingElement>;
export type CardDescriptionProps = HTMLAttributes<HTMLParagraphElement>;
export type CardContentProps = HTMLAttributes<HTMLDivElement>;
export type CardFooterProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return <div {...props} className={cn("ui-card", className)} />;
}

export function CardHeader({ className, ...props }: CardHeaderProps) {
  return <div {...props} className={cn("ui-card-header", className)} />;
}

export function CardTitle({ className, ...props }: CardTitleProps) {
  return <h3 {...props} className={cn("ui-card-title", className)} />;
}

export function CardDescription({ className, ...props }: CardDescriptionProps) {
  return <p {...props} className={cn("ui-card-description", className)} />;
}

export function CardContent({ className, ...props }: CardContentProps) {
  return <div {...props} className={cn("ui-card-content", className)} />;
}

export function CardFooter({ className, ...props }: CardFooterProps) {
  return <div {...props} className={cn("ui-card-footer", className)} />;
}
