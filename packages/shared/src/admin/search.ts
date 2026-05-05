// 06c-B / 12-search-tags: admin members 検索パラメータの schema
// public 一覧の MembersSearch と語彙を揃え、admin 側でも repeated tag を AND で扱う。
// 不変条件: 12-search-tags の `q / zone / tag / sort / density` を正本語彙とする。
import { z } from "zod";

const ZONE_VALUES = ["all", "0_to_1", "1_to_10", "10_to_100"] as const;
const SORT_VALUES = ["recent", "name"] as const;
const DENSITY_VALUES = ["comfy", "dense", "list"] as const;
const FILTER_VALUES = ["", "published", "hidden", "deleted"] as const;

export const ADMIN_SEARCH_LIMITS = {
  Q_LIMIT: 200,
  TAG_LIMIT: 5,
  PAGE_SIZE: 50,
} as const;

export const AdminMemberSearchZ = z.object({
  filter: z.enum(FILTER_VALUES).default(""),
  q: z
    .string()
    .transform((s) => s.trim().replace(/\s+/g, " "))
    .pipe(z.string().max(ADMIN_SEARCH_LIMITS.Q_LIMIT))
    .default(""),
  zone: z.enum(ZONE_VALUES).default("all"),
  tag: z.array(z.string().min(1)).max(ADMIN_SEARCH_LIMITS.TAG_LIMIT).default([]),
  sort: z.enum(SORT_VALUES).default("recent"),
  density: z.enum(DENSITY_VALUES).default("comfy"),
  page: z.number().int().positive().default(1),
});

export type AdminMemberSearch = z.infer<typeof AdminMemberSearchZ>;

export type AdminFilter = "published" | "hidden" | "deleted";
export type AdminSort = (typeof SORT_VALUES)[number];
export type AdminDensity = (typeof DENSITY_VALUES)[number];
export type AdminZone = (typeof ZONE_VALUES)[number];

export const ADMIN_SORT_VALUES = SORT_VALUES;
export const ADMIN_DENSITY_VALUES = DENSITY_VALUES;
export const ADMIN_ZONE_VALUES = ZONE_VALUES;
export const ADMIN_FILTER_VALUES = FILTER_VALUES;

/**
 * admin members 一覧用の URLSearchParams を組み立てる（既定値は省略）。
 */
export function toAdminApiQuery(s: Partial<AdminMemberSearch>): URLSearchParams {
  const params = new URLSearchParams();
  if (s.filter) params.set("filter", s.filter);
  if (s.q && s.q.length > 0) params.set("q", s.q);
  if (s.zone && s.zone !== "all") params.set("zone", s.zone);
  if (s.tag) for (const t of s.tag) params.append("tag", t);
  if (s.sort && s.sort !== "recent") params.set("sort", s.sort);
  if (s.density && s.density !== "comfy") params.set("density", s.density);
  if (s.page && s.page > 1) params.set("page", String(s.page));
  return params;
}
