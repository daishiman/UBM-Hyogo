// PublicMemberProfileView 組成 (04a)
// 不変条件 #1 (visibility), #2 (consent), #3 (responseEmail), #11 (adminNotes), #14 (schema 集約)
// SQL where + status 二重チェック + visibility filter + zod fail close。

import { z } from "zod";

import { PublicMemberProfileZ } from "@ubm-hyogo/shared";

import {
  isPublicStatus,
  type MemberStatusView,
} from "../../_shared/public-filter";
import {
  buildVisibilityIndex,
  type VisibilityIndexEntry,
} from "../../_shared/visibility-filter";
import { ApiError } from "@ubm-hyogo/shared/errors";

export const PublicMemberProfileResponseZ = PublicMemberProfileZ;
export type PublicMemberProfileResponse = z.infer<
  typeof PublicMemberProfileResponseZ
>;

export interface ProfileFieldSource {
  stableKey: string;
  value: unknown;
}

export interface ProfileTagSource {
  code: string;
  label: string;
  category: string;
}

export interface ProfileSource {
  member: { memberId: string };
  status: MemberStatusView;
  fields: ProfileFieldSource[];
  schemaFields: VisibilityIndexEntry[];
  tags: ProfileTagSource[];
}

const FORBIDDEN_KEYS = ["responseEmail", "rulesConsent", "adminNotes"] as const;

const FIELD_TO_SUMMARY: Record<string, keyof Summary> = {
  fullName: "fullName",
  nickname: "nickname",
  location: "location",
  occupation: "occupation",
  ubmZone: "ubmZone",
  ubmMembershipType: "ubmMembershipType",
};

interface Summary {
  fullName: string;
  nickname: string;
  location: string;
  occupation: string;
  ubmZone: string | null;
  ubmMembershipType: string | null;
}

const asString = (v: unknown): string => (typeof v === "string" ? v : "");
const asNullableString = (v: unknown): string | null =>
  typeof v === "string" && v.length > 0 ? v : null;

export const toPublicMemberProfile = (
  src: ProfileSource,
): PublicMemberProfileResponse => {
  // leak 二重チェック (R-1)。SQL where 漏れの最終防御。
  if (!isPublicStatus(src.status)) {
    throw new ApiError({ code: "UBM-1404" });
  }

  const visibilityIndex = buildVisibilityIndex(src.schemaFields);

  const summary: Summary = {
    fullName: "",
    nickname: "",
    location: "",
    occupation: "",
    ubmZone: null,
    ubmMembershipType: null,
  };

  const sectionMap = new Map<
    string,
    {
      key: string;
      title: string;
      fields: Array<{
        stableKey: string;
        label: string;
        value: unknown;
        kind: string;
        visibility: "public";
        source: "forms";
      }>;
    }
  >();

  for (const f of src.fields) {
    const meta = visibilityIndex.get(f.stableKey);
    // summary は visibility に関わらず本人公開項目から取り出す
    // (基本属性は public visibility 前提)
    const summaryKey = FIELD_TO_SUMMARY[f.stableKey];
    if (summaryKey) {
      if (summaryKey === "ubmZone" || summaryKey === "ubmMembershipType") {
        summary[summaryKey] = asNullableString(f.value);
      } else {
        summary[summaryKey] = asString(f.value);
      }
    }
    if (!meta) continue;
    if (meta.visibility !== "public") continue; // AC-3 / 不変条件 #1

    const key = meta.sectionKey;
    if (!sectionMap.has(key)) {
      sectionMap.set(key, {
        key,
        title: meta.sectionTitle,
        fields: [],
      });
    }
    sectionMap.get(key)!.fields.push({
      stableKey: meta.stableKey,
      label: meta.label,
      value: f.value,
      kind: meta.kind as string,
      visibility: "public",
      source: "forms",
    });
  }

  const publicSections = [...sectionMap.values()]
    .map((sec) => ({
      ...sec,
      fields: [...sec.fields].sort((a, b) => {
        const ai = visibilityIndex.get(a.stableKey)?.position ?? 0;
        const bi = visibilityIndex.get(b.stableKey)?.position ?? 0;
        return ai - bi;
      }),
    }))
    .filter((s) => s.fields.length > 0);

  const safe = {
    memberId: src.member.memberId,
    summary,
    publicSections,
    tags: src.tags.map((t) => ({
      code: t.code,
      label: t.label,
      category: t.category,
    })),
  } as Record<string, unknown>;

  for (const k of FORBIDDEN_KEYS) delete safe[k];

  return PublicMemberProfileResponseZ.parse(safe);
};
