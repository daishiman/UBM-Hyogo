import { z } from "zod";

export const PUBLIC_MEMBER_ZONE_VALUES = [
  "all",
  "0_to_1",
  "1_to_10",
  "10_to_100",
] as const;
export const PUBLIC_MEMBER_STATUS_VALUES = [
  "all",
  "member",
  "non_member",
  "academy",
] as const;
export const PUBLIC_MEMBER_SORT_VALUES = ["recent", "name"] as const;
export const PUBLIC_MEMBER_DENSITY_VALUES = [
  "comfy",
  "dense",
  "list",
] as const;

export type PublicMemberZone = (typeof PUBLIC_MEMBER_ZONE_VALUES)[number];
export type PublicMemberStatus = (typeof PUBLIC_MEMBER_STATUS_VALUES)[number];
export type PublicMemberSort = (typeof PUBLIC_MEMBER_SORT_VALUES)[number];
export type PublicMemberDensity =
  (typeof PUBLIC_MEMBER_DENSITY_VALUES)[number];

export const PublicMemberSortZ = z.enum(PUBLIC_MEMBER_SORT_VALUES);
export const PublicMemberDensityZ = z.enum(PUBLIC_MEMBER_DENSITY_VALUES);

export const PUBLIC_MEMBER_SEARCH_LIMITS = {
  TAG_LIMIT: 5,
  Q_LIMIT: 200,
  LIMIT_MIN: 1,
  LIMIT_MAX: 100,
  LIMIT_DEFAULT: 24,
} as const;

export const normalizePublicMemberQ = (q: string): string =>
  q
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, PUBLIC_MEMBER_SEARCH_LIMITS.Q_LIMIT);

export const normalizePublicMemberTags = (tags: string[]): string[] =>
  Array.from(new Set(tags.filter((tag) => tag.length > 0))).slice(
    0,
    PUBLIC_MEMBER_SEARCH_LIMITS.TAG_LIMIT,
  );

export const clampPublicMemberLimit = (n: number): number =>
  Math.min(
    Math.max(Math.trunc(n), PUBLIC_MEMBER_SEARCH_LIMITS.LIMIT_MIN),
    PUBLIC_MEMBER_SEARCH_LIMITS.LIMIT_MAX,
  );

export const isPublicMemberZone = (value: string): value is PublicMemberZone =>
  (PUBLIC_MEMBER_ZONE_VALUES as readonly string[]).includes(value);

export const isPublicMemberStatus = (
  value: string,
): value is PublicMemberStatus =>
  (PUBLIC_MEMBER_STATUS_VALUES as readonly string[]).includes(value);

export const normalizePublicMemberZone = (
  value: string,
): PublicMemberZone => (isPublicMemberZone(value) ? value : "all");

export const normalizePublicMemberStatus = (
  value: string,
): PublicMemberStatus => (isPublicMemberStatus(value) ? value : "all");
