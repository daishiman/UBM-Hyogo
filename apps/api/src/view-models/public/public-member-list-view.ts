// PublicMemberListView 組成 (04a)
// 不変条件 #2 / #3 / #11 — 入力は status filter を通った member のみを前提に組成し、
// converter 内でも summary 由来の system field (responseEmail / rulesConsent / adminNotes) を
// runtime delete し、最後に zod parse で fail close する。

import { z } from "zod";

import { PublicMemberListItemZ, PublicMemberListViewZ, STABLE_KEY } from "@ubm-hyogo/shared";

import type { PaginationMeta } from "../../_shared/pagination";

export const PublicMemberListResponseZ = PublicMemberListViewZ;

export type PublicMemberListResponse = z.infer<typeof PublicMemberListResponseZ>;

export interface PublicMemberListItemSource {
  memberId: string;
  fullName: string;
  nickname: string;
  occupation: string;
  location: string;
  ubmZone: string | null;
  ubmMembershipType: string | null;
  // issue-1029: route 層 resolver が presign した public-safe photoUrl（無ければ undefined）。
  // R2 への依存は持たない（presign は route 層 / view-model は値を parse へ通すのみ）。
  photoUrl?: string | undefined;
  // issue-224: expand=tags 指定時のみ use-case が付与。stripForbidden は素通し。
  tags?: ReadonlyArray<{ code: string; label: string; category: string }>;
  // public-home-member-card-info-and-tag-clarity: businessOverview 先頭行の公開一覧用要約。
  businessSummary?: string;
  // 以下は意図的に含めない (forbidden keys)。
  // responseEmail / rulesConsent / adminNotes
}

export interface PublicMemberListSource {
  items: PublicMemberListItemSource[];
  pagination: PaginationMeta;
  appliedQuery: PublicMemberListResponse["appliedQuery"];
  topTags: PublicMemberListResponse["topTags"];
  generatedAt: string;
}

const FORBIDDEN_KEYS = ["responseEmail", STABLE_KEY.rulesConsent, "adminNotes"] as const;

const stripForbidden = (obj: Record<string, unknown>): Record<string, unknown> => {
  const clone = { ...obj };
  for (const key of FORBIDDEN_KEYS) delete clone[key];
  return clone;
};

export const toPublicMemberListView = (
  src: PublicMemberListSource,
): PublicMemberListResponse => {
  const items = src.items.map((item) =>
    stripForbidden(item as unknown as Record<string, unknown>),
  );
  return PublicMemberListResponseZ.parse({
    items,
    pagination: src.pagination,
    appliedQuery: src.appliedQuery,
    topTags: src.topTags,
    generatedAt: src.generatedAt,
  });
};
