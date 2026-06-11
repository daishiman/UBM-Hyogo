// URL query 正規化 schema for /members
// 不変条件: #1 (stableKey 互換 enum のみ), #6 (browser-storage 不採用), #8 (URL query 正本)
// AC-3, AC-4, AC-5, AC-6 の根拠実装。

import {
  PUBLIC_MEMBER_DENSITY_VALUES,
  PUBLIC_MEMBER_SEARCH_LIMITS,
  PUBLIC_MEMBER_SORT_VALUES,
  PUBLIC_MEMBER_STATUS_VALUES,
  PUBLIC_MEMBER_ZONE_VALUES,
  normalizePublicMemberQ,
  normalizePublicMemberTags,
} from "@ubm-hyogo/shared/public-search";
import { z } from "zod";

const QSchema = z
  .string()
  .transform((s) => normalizePublicMemberQ(s))
  .catch("");

const TagSchema = z
  .array(z.string().min(1))
  .transform((arr) => normalizePublicMemberTags(arr))
  .catch([]);

export const membersSearchSchema = z.object({
  q: QSchema,
  zone: z.enum(PUBLIC_MEMBER_ZONE_VALUES).catch("all"),
  status: z.enum(PUBLIC_MEMBER_STATUS_VALUES).catch("all"),
  tag: TagSchema,
  sort: z.enum(PUBLIC_MEMBER_SORT_VALUES).catch("recent"),
  density: z.enum(PUBLIC_MEMBER_DENSITY_VALUES).catch("comfy"),
});

export type MembersSearch = z.infer<typeof membersSearchSchema>;

/**
 * Next.js App Router の searchParams を正規化された MembersSearch に変換する。
 * 不正値は zod の `catch` で初期値にフォールバック (AC-6)。
 */
export function parseSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): MembersSearch {
  const tagRaw = searchParams.tag;
  const tag = Array.isArray(tagRaw)
    ? tagRaw.filter((s): s is string => typeof s === "string" && s.length > 0)
    : typeof tagRaw === "string" && tagRaw.length > 0
      ? [tagRaw]
      : [];

  return membersSearchSchema.parse({
    q: typeof searchParams.q === "string" ? searchParams.q : "",
    zone: typeof searchParams.zone === "string" ? searchParams.zone : "all",
    status:
      typeof searchParams.status === "string" ? searchParams.status : "all",
    tag,
    sort: typeof searchParams.sort === "string" ? searchParams.sort : "recent",
    density:
      typeof searchParams.density === "string" ? searchParams.density : "comfy",
  });
}

/**
 * 04a public API 呼び出し用の URLSearchParams を組み立てる。
 * 初期値 (all / empty / recent / comfy) は省略する。tag は repeated で AND 検索 (AC-5)。
 */
export function toApiQuery(search: MembersSearch): URLSearchParams {
  const params = new URLSearchParams();
  if (search.q) params.set("q", search.q);
  if (search.zone !== "all") params.set("zone", search.zone);
  if (search.status !== "all") params.set("status", search.status);
  for (const t of search.tag) params.append("tag", t);
  if (search.sort !== "recent") params.set("sort", search.sort);
  if (search.density !== "comfy") params.set("density", search.density);
  params.set("expand", "tags");
  return params;
}

export const MEMBERS_SEARCH_LIMITS = {
  TAG_LIMIT: PUBLIC_MEMBER_SEARCH_LIMITS.TAG_LIMIT,
  Q_LIMIT: PUBLIC_MEMBER_SEARCH_LIMITS.Q_LIMIT,
} as const;
