// task-15: zone / status / publishState / q の Filter Bar
"use client";
import { useState, useEffect } from "react";

export type MembersFilterValue = {
  q: string;
  zone: string;
  filter: "" | "published" | "hidden" | "deleted";
  sort: "recent" | "name" | "publish_state";
};

export interface MembersFiltersProps {
  readonly value: MembersFilterValue;
  readonly onChange: (patch: Partial<MembersFilterValue>) => void;
  readonly loading?: boolean;
  readonly zoneOptions?: ReadonlyArray<{ value: string; label: string }>;
}

const DEFAULT_ZONE_OPTIONS = [
  { value: "all", label: "全てのゾーン" },
  { value: "zone_0_1", label: "Zone 0-1" },
  { value: "zone_0_2", label: "Zone 0-2" },
];

export function MembersFilters({
  value,
  onChange,
  loading,
  zoneOptions = DEFAULT_ZONE_OPTIONS,
}: MembersFiltersProps) {
  const [qLocal, setQLocal] = useState(value.q);
  useEffect(() => setQLocal(value.q), [value.q]);

  return (
    <div className="ui-card flex flex-wrap items-end gap-3 rounded-[var(--ubm-radius-md)] border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface-panel)] p-3">
      <label className="flex flex-col gap-1 text-xs text-[var(--ubm-color-text-secondary)]">
        <span>検索</span>
        <input
          type="search"
          aria-label="会員検索"
          className="ui-input w-56"
          value={qLocal}
          onChange={(e) => setQLocal(e.currentTarget.value)}
          onBlur={() => {
            if (qLocal !== value.q) onChange({ q: qLocal });
          }}
          placeholder="氏名・メール"
        />
      </label>

      <label className="flex flex-col gap-1 text-xs text-[var(--ubm-color-text-secondary)]">
        <span>ゾーン</span>
        <select
          aria-label="ゾーン"
          className="ui-input"
          value={value.zone}
          onChange={(e) => onChange({ zone: e.currentTarget.value })}
        >
          {zoneOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-[var(--ubm-color-text-secondary)]">
        <span>状態</span>
        <select
          aria-label="状態"
          className="ui-input"
          value={value.filter}
          onChange={(e) => onChange({ filter: e.currentTarget.value as MembersFilterValue["filter"] })}
        >
          <option value="">全て</option>
          <option value="published">公開のみ</option>
          <option value="hidden">非公開のみ</option>
          <option value="deleted">削除済み</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs text-[var(--ubm-color-text-secondary)]">
        <span>並び順</span>
        <select
          aria-label="並び順"
          className="ui-input"
          value={value.sort}
          onChange={(e) => onChange({ sort: e.currentTarget.value as MembersFilterValue["sort"] })}
        >
          <option value="recent">最新順</option>
          <option value="name">氏名順</option>
          <option value="publish_state">公開状態順</option>
        </select>
      </label>

      {loading ? (
        <span role="status" className="text-xs text-[var(--ubm-color-text-muted)]">
          更新中…
        </span>
      ) : null}
    </div>
  );
}
