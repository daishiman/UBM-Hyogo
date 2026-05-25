// serial-06-form-response-binding: PublicMemberProfile → MemberDetail props 正規化 adapter
// - visibility filter: visibility === "public" 以外は除外（UI 側の二重防御 / 正本は API 側）
// - unknown kind: FieldKindZ 不適合は silent skip（production console を汚さない）
// - immutability: 入力 mutate 禁止（pure function）
import { z } from "zod";

import {
  AnswerValueZ,
  FieldKindZ,
  FieldSourceZ,
  FieldVisibilityZ,
  PublicMemberProfileZ,
  StableKeyZ,
} from "@ubm-hyogo/shared";

const SectionFieldWithUnknownKindZ = z.object({
  stableKey: StableKeyZ,
  label: z.string(),
  value: AnswerValueZ,
  kind: z.string(),
  visibility: FieldVisibilityZ,
  source: FieldSourceZ,
});

const SectionWithUnknownKindZ = z.object({
  key: z.string(),
  title: z.string(),
  fields: z.array(SectionFieldWithUnknownKindZ),
});

export const PublicMemberProfileWithUnknownKindZ = PublicMemberProfileZ.extend({
  publicSections: z.array(SectionWithUnknownKindZ),
});

export type PublicMemberProfile = z.infer<
  typeof PublicMemberProfileWithUnknownKindZ
>;
type RawSection = PublicMemberProfile["publicSections"][number];
export type RawField = z.infer<typeof SectionFieldWithUnknownKindZ>;
export type FieldKind = z.infer<typeof FieldKindZ>;

export interface ToMemberDetailPropsOptions {
  onUnknownKind?: ((field: RawField) => void) | undefined;
}

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

function normalizeField(
  field: RawField,
  onUnknownKind?: (field: RawField) => void,
): NormalizedField | null {
  if (field.visibility !== "public") return null;
  const parsed = FieldKindZ.safeParse(field.kind);
  if (!parsed.success) {
    onUnknownKind?.(field);
    return null;
  }
  return {
    stableKey: field.stableKey,
    label: field.label,
    value: field.value,
    kind: parsed.data,
  };
}

function normalizeSection(
  section: RawSection,
  onUnknownKind?: (field: RawField) => void,
): NormalizedSection | null {
  const fields = section.fields
    .map((field) => normalizeField(field, onUnknownKind))
    .filter((f): f is NormalizedField => f !== null);
  if (fields.length === 0) return null;
  return { key: section.key, title: section.title, fields };
}

export function toMemberDetailProps(
  profile: PublicMemberProfile,
  options: ToMemberDetailPropsOptions = {},
): MemberDetailProps {
  const sections = profile.publicSections
    .map((section) => normalizeSection(section, options.onUnknownKind))
    .filter((s): s is NormalizedSection => s !== null);
  return {
    memberId: profile.memberId,
    summary: profile.summary,
    sections,
    attendance: profile.attendance,
    tags: profile.tags,
  };
}
