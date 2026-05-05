// URL query 正規化 schema for /members
// 不変条件: #1 (stableKey 互換 enum のみ), #6 (browser-storage 不採用), #8 (URL query 正本)
// AC-3, AC-4, AC-5, AC-6 の根拠実装。

import { z } from "zod";

const ZONE_VALUES = ["all", "0_to_1", "1_to_10", "10_to_100"] as const;
const STATUS_VALUES = ["all", "member", "non_member", "academy"] as const;
const SORT_VALUES = ["recent", "name"] as const;
const DENSITY_VALUES = ["comfy", "dense", "list"] as const;

const TAG_LIMIT = 5;
const Q_LIMIT = 200;

const QSchema = z
  .string()
  .transform((s) => s.trim().replace(/\s+/g, " ").slice(0, Q_LIMIT))
  .catch("");

const TagSchema = z
  .array(z.string().min(1))
  .transform((arr) => Array.from(new Set(arr)).slice(0, TAG_LIMIT))
  .catch([]);

export const membersSearchSchema = z.object({
  q: QSchema,
  zone: z.enum(ZONE_VALUES).catch("all"),
  status: z.enum(STATUS_VALUES).catch("all"),
  tag: TagSchema,
  sort: z.enum(SORT_VALUES).catch("recent"),
  density: z.enum(DENSITY_VALUES).catch("comfy"),
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
  return params;
}

export const MEMBERS_SEARCH_LIMITS = {
  TAG_LIMIT,
  Q_LIMIT,
} as const;
