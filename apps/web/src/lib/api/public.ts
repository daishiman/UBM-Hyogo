// task-11: public API wrapper for `/public/stats`, `/public/members`, `/public/members/[id]`, `/public/form-preview`
// 不変条件 #5 (D1 直接アクセス禁止) / 公開層 fetch は zod strict parse 経由で型安全化する。

import type { z } from "zod";

import {
  FormPreviewViewZ,
  PublicMemberListViewZ,
  PublicMemberProfileZ,
  PublicStatsViewZ,
} from "@ubm-hyogo/shared";

import {
  fetchPublic,
  fetchPublicOrNotFound,
  type FetchPublicOptions,
} from "../fetch/public";
import { toApiQuery, type MembersSearch } from "../url/members-search";

export type PublicStatsView = z.infer<typeof PublicStatsViewZ>;
export type PublicMemberListView = z.infer<typeof PublicMemberListViewZ>;
export type PublicMemberProfile = z.infer<typeof PublicMemberProfileZ>;
export type FormPreviewView = z.infer<typeof FormPreviewViewZ>;

export interface PublicApiOptions {
  revalidate?: number;
}

const STATS_REVALIDATE = 60;
const MEMBERS_REVALIDATE = 30;
const PROFILE_REVALIDATE = 30;
const FORM_PREVIEW_REVALIDATE = 300;

function withRevalidate(
  options: PublicApiOptions | undefined,
  fallback: number,
): FetchPublicOptions {
  return { revalidate: options?.revalidate ?? fallback };
}

export async function getStats(
  options?: PublicApiOptions,
): Promise<PublicStatsView> {
  const raw = await fetchPublic<unknown>(
    "/public/stats",
    withRevalidate(options, STATS_REVALIDATE),
  );
  return PublicStatsViewZ.parse(raw);
}

export async function listMembers(
  search: MembersSearch,
  options?: PublicApiOptions,
): Promise<PublicMemberListView> {
  const qs = toApiQuery(search).toString();
  const path = qs ? `/public/members?${qs}` : "/public/members";
  const raw = await fetchPublic<unknown>(
    path,
    withRevalidate(options, MEMBERS_REVALIDATE),
  );
  return PublicMemberListViewZ.parse(raw);
}

export async function listMembersRaw(
  query: string,
  options?: PublicApiOptions,
): Promise<PublicMemberListView> {
  const path = query ? `/public/members?${query}` : "/public/members";
  const raw = await fetchPublic<unknown>(
    path,
    withRevalidate(options, MEMBERS_REVALIDATE),
  );
  return PublicMemberListViewZ.parse(raw);
}

export async function getMemberProfile(
  memberId: string,
  options?: PublicApiOptions,
): Promise<PublicMemberProfile> {
  const raw = await fetchPublicOrNotFound<unknown>(
    `/public/members/${encodeURIComponent(memberId)}`,
    withRevalidate(options, PROFILE_REVALIDATE),
  );
  return PublicMemberProfileZ.parse(raw);
}

export async function getFormPreview(
  options?: PublicApiOptions,
): Promise<FormPreviewView> {
  const raw = await fetchPublic<unknown>(
    "/public/form-preview",
    withRevalidate(options, FORM_PREVIEW_REVALIDATE),
  );
  return FormPreviewViewZ.parse(raw);
}

export const PUBLIC_API_REVALIDATE = {
  stats: STATS_REVALIDATE,
  members: MEMBERS_REVALIDATE,
  profile: PROFILE_REVALIDATE,
  formPreview: FORM_PREVIEW_REVALIDATE,
} as const;
