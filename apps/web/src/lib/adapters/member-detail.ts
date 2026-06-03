// serial-06-form-response-binding: PublicMemberProfile → MemberDetail props 正規化 adapter
// - visibility filter: visibility === "public" 以外は除外（UI 側の二重防御 / 正本は API 側）
// - unknown kind: FieldKindZ 不適合は silent skip（production console を汚さない）
//   観測したい呼び出し側のために onUnknownKind callback を option として公開する（issue-883）
// - exhaustiveness: FieldKind 拡張時の silent-skip を防ぐため KIND_ROUTE を
//   `satisfies Record<FieldKind, KindRoute>` で型強制（issue-891）
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
  linkSections: ReadonlyArray<NormalizedSection>;
  attendance: PublicMemberProfile["attendance"];
  tags: PublicMemberProfile["tags"];
  // issue-1029: public-safe presigned photo URL（API 正本から写し取る）。
  photoUrl?: string | undefined;
}

function normalizeField(
  field: RawField,
  routeKinds: ReadonlySet<FieldKind>,
  onUnknownKind?: (field: RawField) => void,
): NormalizedField | null {
  if (field.visibility !== "public") return null;
  const parsed = FieldKindZ.safeParse(field.kind);
  if (!parsed.success) {
    onUnknownKind?.(field);
    return null;
  }
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
  onUnknownKind?: (field: RawField) => void,
): NormalizedSection | null {
  const fields = section.fields
    .map((field) => normalizeField(field, routeKinds, onUnknownKind))
    .filter((f): f is NormalizedField => f !== null);
  if (fields.length === 0) return null;
  return { key: section.key, title: section.title, fields };
}

export function toMemberDetailProps(
  profile: PublicMemberProfile,
  options: ToMemberDetailPropsOptions = {},
): MemberDetailProps {
  // unknown kind は profile 全体で 1 回だけ通知（detail / links 2-pass で同一 field を二重発火させない）
  const reportedUnknown = new WeakSet<RawField>();
  const onUnknownKindOnce = options.onUnknownKind
    ? (field: RawField) => {
        if (reportedUnknown.has(field)) return;
        reportedUnknown.add(field);
        options.onUnknownKind?.(field);
      }
    : undefined;
  const sections = profile.publicSections
    .map((section) => normalizeSection(section, DETAIL_KINDS, onUnknownKindOnce))
    .filter((s): s is NormalizedSection => s !== null);
  const linkSections = profile.publicSections
    .map((section) => normalizeSection(section, LINK_KINDS, onUnknownKindOnce))
    .filter((s): s is NormalizedSection => s !== null);
  return {
    memberId: profile.memberId,
    summary: profile.summary,
    sections,
    linkSections,
    attendance: profile.attendance,
    tags: profile.tags,
    photoUrl: profile.photoUrl,
  };
}

export const __testInternals = { DETAIL_KINDS, KIND_ROUTE, LINK_KINDS } as const;
