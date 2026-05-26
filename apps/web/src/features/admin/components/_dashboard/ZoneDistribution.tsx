// admin-dashboard-recovery-and-byZone:
// プロトタイプ `pages-admin.jsx` L70-107 準拠 / `var(--ubm-color-bg)` 上に `var(--ubm-color-${tone})` 塗り
import type { ZoneSlice } from "../../../../lib/admin/admin-dashboard-ui";

export interface ZoneDistributionProps {
  readonly slices: ReadonlyArray<ZoneSlice> | undefined;
}

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
          const widthPct = (s.count / denom) * 100;
          return (
            <li key={s.key}>
              <div className="row-between flex items-center justify-between">
                <div className="row flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
                    data-tone={s.tone}
                    style={{
                      background: `var(--ubm-color-${s.tone}-soft)`,
                      color: `var(--ubm-color-${s.tone})`,
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        display: "inline-block",
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: `var(--ubm-color-${s.tone})`,
                      }}
                    />
                    {s.label}
                  </span>
                  <span className="small text-xs text-[var(--ubm-color-text-secondary)]">
                    {s.hint}
                  </span>
                </div>
                <span className="mono text-xs tabular-nums text-[var(--ubm-color-text-primary)]">
                  {s.count}名
                </span>
              </div>
              <div
                aria-hidden="true"
                style={{
                  marginTop: 4,
                  height: 8,
                  background: "var(--ubm-color-bg)",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${widthPct}%`,
                    background: `var(--ubm-color-${s.tone})`,
                    borderRadius: 4,
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
