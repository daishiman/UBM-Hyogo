// public-dashboard-prototype-alignment: Hero card-on-canvas variant
// プロトタイプ pages-public.jsx LandingPage の eyebrow + serif h1 + accent + 2 CTA を再現。
// 既存 panel variant は task-11 互換のため残置。
// Lane B: SectionCard(tone=accent) でラップ。CTA は ButtonLink 経由へ統一。

import { ButtonLink } from "@/components/ui";

import { SectionCard } from "../ui/layout/SectionCard";

export interface HeroProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  /** Hero variant。default: "card" (新)、"panel" は既存互換用 */
  variant?: "card" | "panel";
}

export function Hero({
  title,
  subtitle,
  eyebrow,
  primaryCta,
  secondaryCta,
  variant = "card",
}: HeroProps) {
  if (variant === "panel") {
    return (
      <SectionCard as="section" tone="accent" data-component="hero" data-variant="panel" className="ui-hero">
        {eyebrow ? <p data-role="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {subtitle ? <p data-role="subtitle">{subtitle}</p> : null}
        <div data-role="cta">
          {primaryCta ? (
            <ButtonLink href={primaryCta.href} variant="primary">
              {primaryCta.label}
            </ButtonLink>
          ) : null}
          {secondaryCta ? (
            <ButtonLink href={secondaryCta.href} variant="secondary">
              {secondaryCta.label}
            </ButtonLink>
          ) : null}
        </div>
      </SectionCard>
    );
  }
  return (
    <SectionCard as="section" tone="accent" data-component="hero" data-variant="card" className="ui-hero">
      <div data-role="accent" aria-hidden="true" />
      <div data-role="body">
        {eyebrow ? <p data-role="eyebrow">{eyebrow}</p> : null}
        <h1 data-role="title-serif">{title}</h1>
        {subtitle ? <p data-role="subtitle">{subtitle}</p> : null}
        <div data-role="cta">
          {primaryCta ? (
            <ButtonLink href={primaryCta.href} variant="primary">
              {primaryCta.label}
            </ButtonLink>
          ) : null}
          {secondaryCta ? (
            <ButtonLink href={secondaryCta.href} variant="secondary">
              {secondaryCta.label}
            </ButtonLink>
          ) : null}
        </div>
      </div>
    </SectionCard>
  );
}
