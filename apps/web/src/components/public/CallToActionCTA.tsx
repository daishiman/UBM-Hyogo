// parallel-06: HomePage 末尾の FOR MEMBERS ダーク CTA セクション。
// prototype: docs/00-getting-started-manual/claude-design-prototype/pages-public.jsx 136-149。
// 不変条件: HEX 直書き禁止・OKLch token 経由・外部リンクは rel="noopener noreferrer"。

export interface CallToActionCTAProps {
  responderUrl: string;
  eyebrow?: string;
  heading?: string;
  body?: string;
  ctaLabel?: string;
}

const DEFAULT_EYEBROW = "FOR MEMBERS";
const DEFAULT_HEADING = "メンバー情報の掲載をお願いします";
const DEFAULT_BODY =
  "最新のGoogleフォームから回答するだけで、このページに自動で反映されます。表記の修正は管理者が編集できます。";
const DEFAULT_CTA = "回答フォームを開く";

export function CallToActionCTA({
  responderUrl,
  eyebrow = DEFAULT_EYEBROW,
  heading = DEFAULT_HEADING,
  body = DEFAULT_BODY,
  ctaLabel = DEFAULT_CTA,
}: CallToActionCTAProps) {
  return (
    <section
      data-component="call-to-action-cta"
      style={{
        background: "var(--ubm-color-text-primary)",
        color: "var(--ubm-color-surface-panel)",
        padding: "var(--ubm-space-16) var(--ubm-space-6)",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          marginInline: "auto",
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--ubm-space-6)",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ maxWidth: 520 }}>
          <p
            style={{
              margin: 0,
              color: "color-mix(in oklch, white 60%, transparent)",
              fontSize: "var(--ubm-text-sm)",
              fontWeight: 700,
              letterSpacing: 0,
            }}
          >
            {eyebrow}
          </p>
          <h2
            style={{
              fontSize: "var(--ubm-text-2xl)",
              lineHeight: 1.3,
              margin: "var(--ubm-space-3) 0 0 0",
              color: "inherit",
            }}
          >
            {heading}
          </h2>
          <p
            style={{
              margin: "var(--ubm-space-3) 0 0 0",
              color: "var(--ubm-color-surface-panel)",
              opacity: 0.85,
              lineHeight: 1.7,
            }}
          >
            {body}
          </p>
        </div>
        <div>
          <a
            href={responderUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-variant="accent"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--ubm-color-accent)",
              color: "var(--ubm-color-surface-panel)",
              padding: "var(--ubm-space-3) var(--ubm-space-6)",
              borderRadius: "var(--ubm-radius-md)",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            {ctaLabel}
          </a>
        </div>
      </div>
    </section>
  );
}
