"use client";

// task-11: 公開メンバー一覧の検索フィルタ。
// URL query を正本とし state は持たない (不変条件 #8)。
// AC-3 / AC-4 / AC-5 を担保。

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { FormField } from "../ui/FormField";
import { Search } from "../ui/Search";
import { Select } from "../ui/Select";
import {
  MEMBERS_SEARCH_LIMITS,
  type MembersSearch,
} from "../../lib/url/members-search";

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
  { value: "recent", label: "並び替え: 新着順" },
  { value: "name", label: "並び替え: 名前順" },
];

export interface MemberFiltersProps {
  initial: MembersSearch;
}

export function MemberFilters({ initial }: MemberFiltersProps) {
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

  const hasFilters =
    initial.q !== "" ||
    initial.zone !== "all" ||
    initial.status !== "all" ||
    initial.tag.length > 0 ||
    initial.sort !== "recent";

  const onClear = () => {
    router.replace("/members");
  };

  return (
    <form
      role="search"
      aria-label="メンバー絞り込み"
      data-component="member-filters"
      onSubmit={(e) => e.preventDefault()}
    >
      <div data-role="filter-grid">
        <FormField name="member-search" label="キーワード検索">
          <Search
            value={initial.q}
            onChange={(v) => update({ q: v })}
            placeholder="名前・職業・地域で検索"
          />
        </FormField>
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
        <button
          type="button"
          data-role="clear"
          disabled={!hasFilters}
          onClick={onClear}
        >
          クリア
        </button>
      </div>
      {initial.tag.length > 0 ? (
        <ul data-role="active-tags">
          {initial.tag.map((t) => (
            <li key={t}>
              <button
                type="button"
                data-component="tag-pill"
                aria-selected="true"
                onClick={() => onTagToggle(t)}
              >
                #{t} ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </form>
  );
}
