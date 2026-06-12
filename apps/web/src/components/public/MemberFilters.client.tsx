"use client";

// task-11 + issue-276: 公開メンバー一覧の検索フィルタ。
// URL query を正本とし state は持たない (不変条件 #8) が、
// mobile 折りたたみの展開状態 (`expanded`) のみ React state で管理する。
// AC-1 〜 AC-6 (issue-276) と AC-3 / AC-4 / AC-5 (task-11) を担保。

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { FormField } from "../ui/FormField";
import { Search } from "../ui/Search";
import { Select } from "../ui/Select";
import {
  MEMBERS_SEARCH_LIMITS,
  type MembersSearch,
} from "../../lib/url/members-search";
import { isBrowser } from "../../lib/is-browser";
import { TagPicker, type TagPickerOption } from "./TagPicker.client";
import { SelectedFiltersBar } from "./SelectedFiltersBar.client";
import { FiltersSummaryMobile } from "./FiltersSummaryMobile.client";

type Patch = Partial<MembersSearch>;

const ZONE_OPTIONS = [
  { value: "all", label: "ゾーン: すべて" },
  { value: "0_to_1", label: "0→1" },
  { value: "1_to_10", label: "1→10" },
  { value: "10_to_100", label: "10→100" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "種別: すべて" },
  { value: "member", label: "正会員" },
  { value: "non_member", label: "非会員" },
  { value: "academy", label: "アカデミー" },
];

const SORT_OPTIONS = [
  { value: "recent", label: "新しい順" },
  { value: "oldest", label: "古い順" },
  { value: "name", label: "名前順" },
  { value: "name_desc", label: "名前の逆順" },
];

export interface MemberFiltersProps {
  initial: MembersSearch;
  topTags?: TagPickerOption[];
  totalCount?: number | undefined;
  displayedCount?: number | undefined;
}

export function MemberFilters({
  initial,
  topTags = [],
  totalCount,
  displayedCount,
}: MemberFiltersProps) {
  const router = useRouter();
  const sp = useSearchParams();
  const [expanded, setExpanded] = useState(false);
  const tagLabels = useMemo(
    () =>
      Object.fromEntries(topTags.map((tag) => [tag.code, tag.label])) as Record<
        string,
        string
      >,
    [topTags],
  );

  const update = useCallback(
    (patch: Patch) => {
      const next = new URLSearchParams(sp ? sp.toString() : "");
      for (const [key, value] of Object.entries(patch)) {
        if (Array.isArray(value)) {
          next.delete(key);
          for (const v of value.slice(0, MEMBERS_SEARCH_LIMITS.TAG_LIMIT)) {
            next.append(key, v);
          }
        } else if (
          value === undefined ||
          value === null ||
          value === "" ||
          (key === "zone" && value === "all") ||
          (key === "status" && value === "all") ||
          (key === "sort" && value === "recent") ||
          (key === "density" && value === "comfy")
        ) {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      }
      const qs = next.toString();
      router.replace(qs ? `/members?${qs}` : "/members");
    },
    [router, sp],
  );

  const onTagToggle = (tag: string) => {
    const has = initial.tag.includes(tag);
    if (!has && initial.tag.length >= MEMBERS_SEARCH_LIMITS.TAG_LIMIT) {
      return;
    }
    const nextTags = has
      ? initial.tag.filter((t) => t !== tag)
      : [...initial.tag, tag];
    update({ tag: nextTags });
  };

  const hasFilters =
    initial.q !== "" ||
    initial.zone !== "all" ||
    initial.status !== "all" ||
    initial.tag.length > 0;

  const onClear = () => {
    router.replace("/members");
  };

  const resultLabel =
    typeof totalCount === "number" && typeof displayedCount === "number"
      ? `${totalCount} 件中 ${displayedCount} 件を表示しています`
      : "条件を変更すると結果が即時に更新されます";

  return (
    <form
      role="search"
      aria-label="メンバー絞り込み"
      aria-describedby="member-search-live-hint member-result-count"
      data-component="member-filters"
      data-expanded={expanded ? "true" : "false"}
      onSubmit={(e) => e.preventDefault()}
    >
      <FiltersSummaryMobile
        q={initial.q}
        zone={initial.zone}
        status={initial.status}
        tagCount={initial.tag.length}
        expanded={expanded}
        onToggle={() => setExpanded((v) => !v)}
      />
      <div data-role="filters-body">
        <div data-role="filter-group" data-group="inputs">
          <div data-role="filter-grid">
            <FormField name="member-search" label="キーワード検索">
              <Search
                id="member-search-input"
                name="member-search"
                value={initial.q}
                onChange={(v) => update({ q: v })}
                placeholder="名前・職業・地域で検索"
              />
            </FormField>
            <span data-role="live-filter-hint" id="member-search-live-hint">
              入力すると即反映されます
            </span>
            <FormField name="member-zone" label="UBM区画">
              <Select
                options={ZONE_OPTIONS}
                value={initial.zone}
                onChange={(e) =>
                  update({ zone: e.target.value as MembersSearch["zone"] })
                }
                aria-label="ゾーンで絞り込み"
              />
            </FormField>
            <FormField name="member-status" label="参加ステータス">
              <Select
                options={STATUS_OPTIONS}
                value={initial.status}
                onChange={(e) =>
                  update({ status: e.target.value as MembersSearch["status"] })
                }
                aria-label="種別で絞り込み"
              />
            </FormField>
            <FormField name="member-sort" label="並び替え">
              <Select
                options={SORT_OPTIONS}
                value={initial.sort}
                onChange={(e) =>
                  update({ sort: e.target.value as MembersSearch["sort"] })
                }
                aria-label="並び替え"
              />
            </FormField>
          </div>
          <output
            id="member-result-count"
            data-role="result-count"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {resultLabel}
          </output>
        </div>
        <TagPicker
          options={topTags}
          selected={initial.tag}
          max={MEMBERS_SEARCH_LIMITS.TAG_LIMIT}
          onToggle={onTagToggle}
          heading="タグで絞り込み"
        />
        {hasFilters ? (
          <SelectedFiltersBar
            search={initial}
            onPatch={update}
            onClearAll={onClear}
            tagLabels={tagLabels}
            onEmpty={() => {
              if (!isBrowser()) return;
              // eslint-disable-next-line no-restricted-globals -- isBrowser() guard above ensures document is defined.
              document.getElementById("member-search-input")?.focus();
            }}
          />
        ) : null}
      </div>
    </form>
  );
}
