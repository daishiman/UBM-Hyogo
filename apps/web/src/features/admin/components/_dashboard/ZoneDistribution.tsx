// task-15: Zone 分布バーチャート（軽量 SVG / 自前実装）
import type { ZoneSlice } from "../../../../lib/admin/admin-dashboard-ui";

export interface ZoneDistributionProps {
  readonly slices: ReadonlyArray<ZoneSlice> | undefined;
}

export function ZoneDistribution({ slices }: ZoneDistributionProps) {
  if (!slices || slices.length === 0) {
    return (
      <section className="ui-card rounded-[var(--ubm-radius-lg)] border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface-panel)] p-4">
        <h2 className="text-sm font-semibold text-[var(--ubm-color-text-primary)]">Zone 分布</h2>
        <p role="status" className="mt-2 text-sm text-[var(--ubm-color-text-muted)]">
          分布データは現在集計対象外です
        </p>
      </section>
    );
  }

  const max = slices.reduce((m, s) => Math.max(m, s.count), 0) || 1;
  const total = slices.reduce((sum, s) => sum + s.count, 0);
  const top = slices.reduce((acc, s) => (s.count > acc.count ? s : acc), slices[0]!);

  return (
    <section
      className="ui-card rounded-[var(--ubm-radius-lg)] border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface-panel)] p-4"
      role="img"
      aria-label={`zone 別人数 全 ${total} 件、最大は ${top.zone} ${top.count} 件`}
    >
      <h2 className="text-sm font-semibold text-[var(--ubm-color-text-primary)]">Zone 分布</h2>
      <ul className="mt-3 space-y-2">
        {slices.map((s) => (
          <li key={s.zone} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-xs text-[var(--ubm-color-text-secondary)]">{s.zone}</span>
            <span
              className="h-2 flex-1 rounded-full"
              style={{
                background: `linear-gradient(90deg, var(--ubm-color-accent) ${(s.count / max) * 100}%, var(--ubm-color-border-default) ${(s.count / max) * 100}%)`,
              }}
              aria-hidden="true"
            />
            <span className="w-12 shrink-0 text-right text-xs tabular-nums text-[var(--ubm-color-text-primary)]">
              {s.count}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
