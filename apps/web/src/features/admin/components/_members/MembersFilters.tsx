// followup-001 T-5.4: pill-nav + 検索 + 件数 バッジに刷新（プロトタイプ準拠）。
// 旧 select 3 種（zone / filter / sort）は削除。zone/sort は URL は維持するが UI からは外す
// （プロトタイプには無いため）。filter (公開/非公開/退会) のみ pill-nav で操作する。
"use client";
import { useEffect, useRef, useState } from "react";
import { PillNav } from "../../../../components/ui/PillNav";

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
  readonly count?: number;
  /** debounce ms。test では 0 を渡して同期更新できるようにする。 */
  readonly debounceMs?: number;
}

const PILL_OPTIONS: ReadonlyArray<{ value: MembersFilterValue["filter"]; label: string }> = [
  { value: "", label: "すべて" },
  { value: "published", label: "公開中" },
  { value: "hidden", label: "非公開" },
  { value: "deleted", label: "退会済み" },
];

export function MembersFilters({
  value,
  onChange,
  loading,
  count,
  debounceMs = 300,
}: MembersFiltersProps) {
  const [qLocal, setQLocal] = useState(value.q);
  useEffect(() => setQLocal(value.q), [value.q]);

  // debounce search
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (qLocal === value.q) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onChange({ q: qLocal });
    }, debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [qLocal, debounceMs, onChange, value.q]);

  return (
    <div
      className="ui-card flex flex-wrap items-end gap-4 rounded-[var(--ubm-radius-md)] border border-[var(--ubm-color-border-default)] bg-[var(--ubm-color-surface-panel)] p-3"
      data-component="members-filter-card"
    >
      <label className="flex flex-1 min-w-[14rem] flex-col gap-1 text-xs text-[var(--ubm-color-text-secondary)]">
        <span>検索</span>
        <input
          type="search"
          aria-label="会員検索"
          className="ui-input"
          value={qLocal}
          onChange={(e) => setQLocal(e.currentTarget.value)}
          placeholder="名前・メール・職業..."
        />
      </label>

      <div className="flex flex-col gap-1 text-xs text-[var(--ubm-color-text-secondary)]">
        <span>状態</span>
        <PillNav
          ariaLabel="公開状態フィルター"
          options={PILL_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          value={value.filter}
          onChange={(v) => onChange({ filter: v as MembersFilterValue["filter"] })}
        />
      </div>

      <div
        className="pb-2 text-xs text-[var(--ubm-color-text-muted)]"
        data-component="members-count"
        aria-live="polite"
      >
        {typeof count === "number" ? `${count} 件` : null}
      </div>

      {loading ? (
        <span role="status" className="pb-2 text-xs text-[var(--ubm-color-text-muted)]">
          更新中…
        </span>
      ) : null}
    </div>
  );
}
