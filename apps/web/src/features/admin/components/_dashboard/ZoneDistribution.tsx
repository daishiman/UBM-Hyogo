// admin-dashboard-recovery-and-byZone:
// Prototype `pages-admin.jsx` L70-107 alignment with token-only colors.
import type { ZoneSlice } from "../../../../lib/admin/admin-dashboard-ui";

export interface ZoneDistributionProps {
  readonly slices: ReadonlyArray<ZoneSlice> | undefined;
}

const TONE_CLASS: Record<
  ZoneSlice["tone"],
  {
    readonly badge: string;
    readonly dot: string;
    readonly bar: string;
  }
> = {
  info: {
    badge: "bg-[var(--ubm-color-info-soft)] text-[var(--ubm-color-info)]",
    dot: "bg-[var(--ubm-color-info)]",
    bar: "fill-[var(--ubm-color-info)]",
  },
  accent: {
    badge: "bg-[var(--ubm-color-accent-soft)] text-[var(--ubm-color-accent)]",
    dot: "bg-[var(--ubm-color-accent)]",
    bar: "fill-[var(--ubm-color-accent)]",
  },
  ok: {
    badge: "bg-[var(--ubm-color-ok-soft)] text-[var(--ubm-color-ok)]",
    dot: "bg-[var(--ubm-color-ok)]",
    bar: "fill-[var(--ubm-color-ok)]",
  },
};

export function ZoneDistribution({ slices }: ZoneDistributionProps) {
  if (!slices || slices.length === 0) {
    return (
      <section className="ui-card rounded-[var(--ubm-radius-lg)] border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface-panel)] p-4">
        <div className="row-between flex items-start justify-between">
          <div>
            <div className="eyebrow text-xs uppercase tracking-wider text-[var(--ubm-color-text-muted)]">
              DISTRIBUTION
            </div>
            <h2 className="h-section text-sm font-semibold text-[var(--ubm-color-text-primary)]">
              UBM区画の分布
            </h2>
          </div>
        </div>
        <p role="status" className="mt-2 text-sm text-[var(--ubm-color-text-muted)]">
          分布データは現在集計対象外です
        </p>
      </section>
    );
  }

  const totalCount = slices.reduce((sum, s) => sum + s.count, 0);

  return (
    <section
      className="ui-card rounded-[var(--ubm-radius-lg)] border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface-panel)] p-4"
      role="img"
      aria-label={`zone 別人数 全 ${totalCount} 件`}
    >
      <div className="row-between flex items-start justify-between">
        <div>
          <div className="eyebrow text-xs uppercase tracking-wider text-[var(--ubm-color-text-muted)]">
            DISTRIBUTION
          </div>
          <h2 className="h-section text-sm font-semibold text-[var(--ubm-color-text-primary)]">
            UBM区画の分布
          </h2>
        </div>
      </div>
      <ul className="mt-3 space-y-3">
        {slices.map((s) => {
          const denom = Math.max(s.total, 1);
          const widthPct = Math.min(100, Math.max(0, (s.count / denom) * 100));
          const tone = TONE_CLASS[s.tone];

          return (
            <li key={s.key}>
              <div className="row-between flex items-center justify-between gap-3">
                <div className="row flex min-w-0 items-center gap-2">
                  <span
                    aria-hidden="true"
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs ${tone.badge}`}
                    data-tone={s.tone}
                  >
                    <span
                      aria-hidden="true"
                      className={`inline-block h-1.5 w-1.5 rounded-full ${tone.dot}`}
                    />
                    {s.label}
                  </span>
                  <span className="small min-w-0 truncate text-xs text-[var(--ubm-color-text-secondary)]">
                    {s.hint}
                  </span>
                </div>
                <span className="mono shrink-0 text-xs tabular-nums text-[var(--ubm-color-text-primary)]">
                  {s.count}名
                </span>
              </div>
              <svg
                className="mt-1 h-2 w-full overflow-hidden rounded fill-[var(--ubm-color-bg)]"
                viewBox="0 0 100 8"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <rect width="100" height="8" rx="4" />
                <rect className={tone.bar} width={widthPct} height="8" rx="4" />
              </svg>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
