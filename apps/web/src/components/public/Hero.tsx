// public-dashboard-prototype-alignment: Hero card-on-canvas variant
// プロトタイプ pages-public.jsx LandingPage の eyebrow + serif h1 + accent + 2 CTA を再現。
// 既存 panel variant は task-11 互換のため残置。

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
      <section
        data-component="hero"
        data-variant="panel"
        style={{
          backgroundImage:
            "linear-gradient(135deg, var(--ubm-color-zone-a) 0%, var(--ubm-color-zone-c) 100%)",
        }}
      >
        {eyebrow ? <p data-role="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {subtitle ? <p data-role="subtitle">{subtitle}</p> : null}
        <div data-role="cta">
          {primaryCta ? (
            <a href={primaryCta.href} data-variant="primary">
              {primaryCta.label}
            </a>
          ) : null}
          {secondaryCta ? (
            <a href={secondaryCta.href} data-variant="secondary">
              {secondaryCta.label}
            </a>
          ) : null}
        </div>
      </section>
    );
  }
  return (
    <section data-component="hero" data-variant="card">
      <div data-role="accent" aria-hidden="true" />
      <div data-role="body">
        {eyebrow ? <p data-role="eyebrow">{eyebrow}</p> : null}
        <h1 data-role="title-serif">{title}</h1>
        {subtitle ? <p data-role="subtitle">{subtitle}</p> : null}
        <div data-role="cta">
          {primaryCta ? (
            <a href={primaryCta.href} data-variant="primary">
              {primaryCta.label}
            </a>
          ) : null}
          {secondaryCta ? (
            <a href={secondaryCta.href} data-variant="secondary">
              {secondaryCta.label}
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
