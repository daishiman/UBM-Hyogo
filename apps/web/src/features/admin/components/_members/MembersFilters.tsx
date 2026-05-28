// followup-003 Lane C: プロトタイプ準拠 (pages-admin.jsx L204-221)
"use client";
import { useState, useEffect } from "react";
import { PillNav } from "../_shared/PillNav";

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
  readonly totalCount?: number;
}

type PillValue = "" | "published" | "hidden" | "deleted";

const PILL_OPTIONS: ReadonlyArray<{ value: PillValue; label: string }> = [
  { value: "", label: "全て" },
  { value: "published", label: "公開" },
  { value: "hidden", label: "非公開" },
  { value: "deleted", label: "退会" },
];

export function MembersFilters({
  value,
  onChange,
  loading,
  totalCount,
}: MembersFiltersProps) {
  const [qLocal, setQLocal] = useState(value.q);
  useEffect(() => setQLocal(value.q), [value.q]);

  return (
    <div className="ui-card flex flex-col gap-3 rounded-[var(--ubm-radius-md)] border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface-panel)] p-3 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-3">
        <label className="flex flex-1 flex-col gap-1 text-xs text-[var(--ubm-color-text-secondary)] md:max-w-sm">
          <span className="sr-only">検索</span>
          <input
            type="search"
            aria-label="会員検索"
            className="ui-input w-full"
            value={qLocal}
            onChange={(e) => setQLocal(e.currentTarget.value)}
            onBlur={() => {
              if (qLocal !== value.q) onChange({ q: qLocal });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (qLocal !== value.q) onChange({ q: qLocal });
              }
            }}
            placeholder="氏名・メールで検索"
          />
        </label>

        <PillNav
          options={PILL_OPTIONS}
          value={value.filter}
          onChange={(v) => onChange({ filter: v })}
          ariaLabel="公開状態フィルター"
        />

        <label className="flex flex-col gap-1 text-xs text-[var(--ubm-color-text-secondary)]">
          <span className="sr-only">並び順</span>
          <select
            aria-label="並び順"
            className="ui-input"
            value={value.sort}
            onChange={(e) =>
              onChange({ sort: e.currentTarget.value as MembersFilterValue["sort"] })
            }
          >
            <option value="recent">最新順</option>
            <option value="name">氏名順</option>
            <option value="publish_state">公開状態順</option>
          </select>
        </label>
      </div>

      <div className="flex items-center gap-2 text-xs text-[var(--ubm-color-text-muted)]">
        {typeof totalCount === "number" ? (
          <span>{totalCount.toLocaleString()} 件</span>
        ) : null}
        {loading ? <span role="status">更新中…</span> : null}
      </div>
    </div>
  );
}
