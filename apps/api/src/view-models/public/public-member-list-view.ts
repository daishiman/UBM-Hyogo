// PublicMemberListView 組成 (04a)
// 不変条件 #2 / #3 / #11 — 入力は status filter を通った member のみを前提に組成し、
// converter 内でも summary 由来の system field (responseEmail / rulesConsent / adminNotes) を
// runtime delete し、最後に zod parse で fail close する。

import { z } from "zod";

import { PublicMemberListItemZ, PublicMemberListViewZ } from "@ubm-hyogo/shared";

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
  // 以下は意図的に含めない (forbidden keys)。
  // responseEmail / rulesConsent / adminNotes
}

export interface PublicMemberListSource {
  items: PublicMemberListItemSource[];
  pagination: PaginationMeta;
  appliedQuery: PublicMemberListResponse["appliedQuery"];
  generatedAt: string;
}

const FORBIDDEN_KEYS = ["responseEmail", "rulesConsent", "adminNotes"] as const;

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
    generatedAt: src.generatedAt,
  });
};
