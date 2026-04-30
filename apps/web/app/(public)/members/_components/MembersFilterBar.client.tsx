"use client";

// Client Component. URL query を正本として state を保持しない。
// AC-3 / AC-4 / AC-5 を担保: Filter 操作で `router.replace` のみ呼び、
// reload で復元される（不変条件 #8）。

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { Search } from "../../../../src/components/ui/Search";
import { Segmented } from "../../../../src/components/ui/Segmented";
import { Select } from "../../../../src/components/ui/Select";
import {
  MEMBERS_SEARCH_LIMITS,
  type MembersSearch,
} from "../../../../src/lib/url/members-search";

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
  { value: "recent", label: "新着順" },
  { value: "name", label: "名前順" },
];

const DENSITY_OPTIONS = [
  { value: "comfy", label: "ゆったり" },
  { value: "dense", label: "詰め込み" },
  { value: "list", label: "リスト" },
];

export interface MembersFilterBarProps {
  initial: MembersSearch;
}

export function MembersFilterBar({ initial }: MembersFilterBarProps) {
  const router = useRouter();
  const sp = useSearchParams();

  const update = useCallback(
    (patch: Patch) => {
      const next = new URLSearchParams(sp ? sp.toString() : "");

      for (const [key, value] of Object.entries(patch)) {
        if (Array.isArray(value)) {
          next.delete(key);
          for (const v of value.slice(0, MEMBERS_SEARCH_LIMITS.TAG_LIMIT)) {
            next.append(key, v);
          }
        } else if (value === undefined || value === null || value === "") {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      }

      const qs = next.toString();
      // history を汚染しないため replace を採用 (Phase 3 Q1)
      router.replace(qs ? `/members?${qs}` : "/members");
    },
    [router, sp],
  );

  const onTagToggle = (tag: string) => {
    const has = initial.tag.includes(tag);
    const nextTags = has
      ? initial.tag.filter((t) => t !== tag)
      : [...initial.tag, tag].slice(0, MEMBERS_SEARCH_LIMITS.TAG_LIMIT);
    update({ tag: nextTags });
  };

  return (
    <div data-component="members-filter-bar">
      <Search
        value={initial.q}
        onChange={(v) => update({ q: v })}
        placeholder="名前・職業・地域で検索"
      />
      <Select
        options={ZONE_OPTIONS}
        value={initial.zone}
        onChange={(e) => update({ zone: e.target.value as MembersSearch["zone"] })}
        aria-label="ゾーンで絞り込み"
      />
      <Select
        options={STATUS_OPTIONS}
        value={initial.status}
        onChange={(e) =>
          update({ status: e.target.value as MembersSearch["status"] })
        }
        aria-label="種別で絞り込み"
      />
      <Segmented
        options={SORT_OPTIONS}
        value={initial.sort}
        onChange={(v) => update({ sort: v as MembersSearch["sort"] })}
      />
      <Segmented
        options={DENSITY_OPTIONS}
        value={initial.density}
        onChange={(v) => update({ density: v as MembersSearch["density"] })}
      />
      {initial.tag.length > 0 ? (
        <ul data-role="active-tags">
          {initial.tag.map((t) => (
            <li key={t}>
              <button type="button" onClick={() => onTagToggle(t)}>
                #{t} ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
