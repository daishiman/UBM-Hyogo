// task-11: 公開トップ Hero。eyebrow + h1 + subtitle + 2 CTA + token グラデ背景。
// AC-1 (data-component="hero" + h1 1 個) を担保。

export interface HeroProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}

export function Hero({
  title,
  subtitle,
  eyebrow,
  primaryCta,
  secondaryCta,
}: HeroProps) {
  return (
    <section
      data-component="hero"
      style={{
        // OKLch token から生成されるグラデ。HEX 直書きを避ける (AC-8)。
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
