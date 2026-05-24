// serial-06-form-response-binding: PublicMemberProfile → MemberDetail props 正規化 adapter
// - visibility filter: visibility === "public" 以外は除外（UI 側の二重防御 / 正本は API 側）
// - unknown kind: FieldKindZ 不適合は silent skip（production console を汚さない）
// - immutability: 入力 mutate 禁止（pure function）
import type { z } from "zod";

import {
  FieldKindZ,
  type PublicMemberProfileZ,
} from "@ubm-hyogo/shared";

export type PublicMemberProfile = z.infer<typeof PublicMemberProfileZ>;
type RawSection = PublicMemberProfile["publicSections"][number];
type RawField = RawSection["fields"][number];
export type FieldKind = z.infer<typeof FieldKindZ>;

export interface NormalizedField {
  stableKey: string;
  label: string;
  value: RawField["value"];
  kind: FieldKind;
}

export interface NormalizedSection {
  key: string;
  title: string;
  fields: ReadonlyArray<NormalizedField>;
}

export interface MemberDetailProps {
  memberId: string;
  summary: PublicMemberProfile["summary"];
  sections: ReadonlyArray<NormalizedSection>;
  attendance: PublicMemberProfile["attendance"];
  tags: PublicMemberProfile["tags"];
}

function normalizeField(field: RawField): NormalizedField | null {
  if (field.visibility !== "public") return null;
  const parsed = FieldKindZ.safeParse(field.kind);
  if (!parsed.success) return null;
  return {
    stableKey: field.stableKey,
    label: field.label,
    value: field.value,
    kind: parsed.data,
  };
}

function normalizeSection(section: RawSection): NormalizedSection | null {
  const fields = section.fields
    .map(normalizeField)
    .filter((f): f is NormalizedField => f !== null);
  if (fields.length === 0) return null;
  return { key: section.key, title: section.title, fields };
}

export function toMemberDetailProps(
  profile: PublicMemberProfile,
): MemberDetailProps {
  const sections = profile.publicSections
    .map(normalizeSection)
    .filter((s): s is NormalizedSection => s !== null);
  return {
    memberId: profile.memberId,
    summary: profile.summary,
    sections,
    attendance: profile.attendance,
    tags: profile.tags,
  };
}
