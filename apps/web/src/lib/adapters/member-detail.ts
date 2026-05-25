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

type KindRoute = "detail" | "links" | "excluded";

const KIND_ROUTE = {
  shortText: "detail",
  paragraph: "detail",
  date: "detail",
  radio: "detail",
  checkbox: "detail",
  dropdown: "detail",
  url: "links",
  consent: "excluded",
  system: "excluded",
  unknown: "excluded",
} as const satisfies Record<FieldKind, KindRoute>;

const DETAIL_KINDS: ReadonlySet<FieldKind> = new Set(
  (Object.keys(KIND_ROUTE) as FieldKind[]).filter(
    (kind) => KIND_ROUTE[kind] === "detail",
  ),
);
const LINK_KINDS: ReadonlySet<FieldKind> = new Set(
  (Object.keys(KIND_ROUTE) as FieldKind[]).filter(
    (kind) => KIND_ROUTE[kind] === "links",
  ),
);

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
  linkSections: ReadonlyArray<NormalizedSection>;
  attendance: PublicMemberProfile["attendance"];
  tags: PublicMemberProfile["tags"];
}

function normalizeField(
  field: RawField,
  routeKinds: ReadonlySet<FieldKind>,
): NormalizedField | null {
  if (field.visibility !== "public") return null;
  const parsed = FieldKindZ.safeParse(field.kind);
  if (!parsed.success) return null;
  if (!routeKinds.has(parsed.data)) return null;
  return {
    stableKey: field.stableKey,
    label: field.label,
    value: field.value,
    kind: parsed.data,
  };
}

function normalizeSection(
  section: RawSection,
  routeKinds: ReadonlySet<FieldKind>,
): NormalizedSection | null {
  const fields = section.fields
    .map((field) => normalizeField(field, routeKinds))
    .filter((f): f is NormalizedField => f !== null);
  if (fields.length === 0) return null;
  return { key: section.key, title: section.title, fields };
}

export function toMemberDetailProps(
  profile: PublicMemberProfile,
): MemberDetailProps {
  const sections = profile.publicSections
    .map((section) => normalizeSection(section, DETAIL_KINDS))
    .filter((s): s is NormalizedSection => s !== null);
  const linkSections = profile.publicSections
    .map((section) => normalizeSection(section, LINK_KINDS))
    .filter((s): s is NormalizedSection => s !== null);
  return {
    memberId: profile.memberId,
    summary: profile.summary,
    sections,
    linkSections,
    attendance: profile.attendance,
    tags: profile.tags,
  };
}

export const __testInternals = { DETAIL_KINDS, KIND_ROUTE, LINK_KINDS } as const;
