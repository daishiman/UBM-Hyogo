// search query parser (04a)
// q / zone / status / tag (repeated) / sort / density / page / limit を zod でパース。
// 不正値は黙って default に fallback (AC-6)。limit 上限 100 で clamp (AC-11)。

import {
  PublicMemberDensityZ,
  PublicMemberSortZ,
  clampPublicMemberLimit,
  normalizePublicMemberQ,
  normalizePublicMemberStatus,
  normalizePublicMemberTags,
  normalizePublicMemberZone,
} from "@ubm-hyogo/shared/public-search";
import { z } from "zod";

export const SortZ = PublicMemberSortZ;
export const DensityZ = PublicMemberDensityZ;

// expand whitelist。現時点で受理する値は "tags" のみ。未知値は黙って除外する。
const EXPAND_WHITELIST = ["tags"] as const;
type ExpandKey = (typeof EXPAND_WHITELIST)[number];

export const DEFAULT_PUBLIC_MEMBER_QUERY: ParsedPublicMemberQuery = {
  q: "",
  zone: "all",
  status: "all",
  tags: [],
  sort: "recent",
  density: "comfy",
  page: 1,
  limit: 24,
  expand: [],
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
  expand: z.array(z.string()).default([]),
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
  expand: ExpandKey[];
};

export const parsePublicMemberQuery = (
  raw: Record<string, string | string[] | undefined>,
): ParsedPublicMemberQuery => {
  const tagRaw = raw.tag ?? raw.tags;
  const tags = Array.isArray(tagRaw)
    ? tagRaw
    : tagRaw
      ? [tagRaw]
      : [];
  // expand は tags と同じ流儀（repeated param / カンマ区切り両対応）で前処理し、
  // whitelist filter 済みの値だけを RawZ に渡す（未知値・空文字は黙って除外）。
  const expandRaw = raw.expand;
  const expandList = (
    Array.isArray(expandRaw) ? expandRaw : expandRaw ? [expandRaw] : []
  )
    .filter((e): e is string => typeof e === "string")
    .flatMap((e) => e.split(","))
    .map((e) => e.trim())
    .filter((e): e is ExpandKey =>
      (EXPAND_WHITELIST as readonly string[]).includes(e),
    );
  const result = RawZ.safeParse({
    q: typeof raw.q === "string" ? raw.q : "",
    zone: typeof raw.zone === "string" ? raw.zone : "all",
    status: typeof raw.status === "string" ? raw.status : "all",
    tags: tags.filter((t): t is string => typeof t === "string"),
    sort: typeof raw.sort === "string" ? raw.sort : "recent",
    density: typeof raw.density === "string" ? raw.density : "comfy",
    page: raw.page ?? 1,
    limit: raw.limit ?? 24,
    expand: expandList,
  });
  const data = result.success ? result.data : DEFAULT_PUBLIC_MEMBER_QUERY;
  return {
    q: normalizePublicMemberQ(data.q),
    zone: normalizePublicMemberZone(data.zone || "all"),
    status: normalizePublicMemberStatus(data.status || "all"),
    tags: normalizePublicMemberTags(data.tags),
    sort: data.sort,
    density: data.density,
    page: Math.max(1, Math.trunc(data.page)),
    limit: clampPublicMemberLimit(data.limit),
    expand: Array.from(new Set(data.expand as ExpandKey[])),
  };
};
