export interface HeroProps {
  title: string;
  subtitle?: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}

export function Hero({ title, subtitle, primaryCta, secondaryCta }: HeroProps) {
  return (
    <section data-component="hero">
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
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
