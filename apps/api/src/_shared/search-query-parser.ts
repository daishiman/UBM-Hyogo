// search query parser (04a)
// q / zone / status / tag (repeated) / sort / density / page / limit を zod でパース。
// 不正値は黙って default に fallback (AC-6)。limit 上限 100 で clamp (AC-11)。

import { z } from "zod";

export const SortZ = z.enum(["recent", "name"]);
export const DensityZ = z.enum(["comfy", "dense", "list"]);

export const DEFAULT_PUBLIC_MEMBER_QUERY: ParsedPublicMemberQuery = {
  q: "",
  zone: "all",
  status: "all",
  tags: [],
  sort: "recent",
  density: "comfy",
  page: 1,
  limit: 24,
};

const RawZ = z.object({
  q: z.string().default(""),
  zone: z.string().default("all"),
  status: z.string().default("all"),
  tags: z.array(z.string()).default([]),
  sort: SortZ.catch("recent"),
  density: DensityZ.catch("comfy"),
  page: z.coerce.number().int().catch(1),
  limit: z.coerce.number().int().catch(24),
});

export type ParsedPublicMemberQuery = {
  q: string;
  zone: string;
  status: string;
  tags: string[];
  sort: z.infer<typeof SortZ>;
  density: z.infer<typeof DensityZ>;
  page: number;
  limit: number;
};

const LIMIT_MAX = 100;
const LIMIT_MIN = 1;
const TAG_LIMIT = 5;
const Q_LIMIT = 200;
const VALID_ZONES = new Set(["all", "0_to_1", "1_to_10", "10_to_100"]);
const VALID_STATUSES = new Set(["all", "member", "non_member", "academy"]);

const clampLimit = (n: number): number =>
  Math.min(Math.max(Math.trunc(n), LIMIT_MIN), LIMIT_MAX);

const normalizeQ = (q: string): string =>
  q.trim().replace(/\s+/g, " ").slice(0, Q_LIMIT);

const dedup = (arr: string[]): string[] => Array.from(new Set(arr));

const normalizeEnumLike = (value: string, valid: Set<string>): string =>
  valid.has(value) ? value : "all";

export const parsePublicMemberQuery = (
  raw: Record<string, string | string[] | undefined>,
): ParsedPublicMemberQuery => {
  const tagRaw = raw.tag ?? raw.tags;
  const tags = Array.isArray(tagRaw)
    ? tagRaw
    : tagRaw
      ? [tagRaw]
      : [];
  const result = RawZ.safeParse({
    q: typeof raw.q === "string" ? raw.q : "",
    zone: typeof raw.zone === "string" ? raw.zone : "all",
    status: typeof raw.status === "string" ? raw.status : "all",
    tags: tags.filter((t): t is string => typeof t === "string"),
    sort: typeof raw.sort === "string" ? raw.sort : "recent",
    density: typeof raw.density === "string" ? raw.density : "comfy",
    page: raw.page ?? 1,
    limit: raw.limit ?? 24,
  });
  const data = result.success ? result.data : DEFAULT_PUBLIC_MEMBER_QUERY;
  return {
    q: normalizeQ(data.q),
    zone: normalizeEnumLike(data.zone || "all", VALID_ZONES),
    status: normalizeEnumLike(data.status || "all", VALID_STATUSES),
    tags: dedup(data.tags.filter((tag) => tag.length > 0)).slice(0, TAG_LIMIT),
    sort: data.sort,
    density: data.density,
    page: Math.max(1, Math.trunc(data.page)),
    limit: clampLimit(data.limit),
  };
};
