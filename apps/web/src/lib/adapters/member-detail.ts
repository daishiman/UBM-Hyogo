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
  STABLE_KEY,
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

export type MemberDetailHero = PublicMemberProfile["summary"] & {
  hometown: string;
};

export interface MemberDetailBusiness {
  businessOverview: string;
  skills: string;
  canProvide: string;
}

export interface MemberDetailLink {
  stableKey: string;
  label: string;
  href: string;
}

export interface MemberDetailProps {
  memberId: string;
  summary: PublicMemberProfile["summary"];
  hero: MemberDetailHero;
  business: MemberDetailBusiness;
  personal: ReadonlyArray<NormalizedField>;
  message: string;
  sections: ReadonlyArray<NormalizedSection>;
  linkSections: ReadonlyArray<NormalizedSection>;
  links: ReadonlyArray<MemberDetailLink>;
  other: ReadonlyArray<NormalizedSection>;
  attendance: PublicMemberProfile["attendance"];
  tags: PublicMemberProfile["tags"];
  // issue-1029: public-safe presigned photo URL（API 正本から写し取る）。
  photoUrl?: string | undefined;
}

const HERO_KEYS = new Set<string>([
  STABLE_KEY.fullName,
  STABLE_KEY.nickname,
  STABLE_KEY.location,
  STABLE_KEY.occupation,
  STABLE_KEY.hometown,
  STABLE_KEY.ubmZone,
  STABLE_KEY.ubmMembershipType,
]);

const BUSINESS_KEYS = [
  STABLE_KEY.businessOverview,
  STABLE_KEY.skills,
  STABLE_KEY.canProvide,
] as const;

const PERSONAL_KEYS = [
  STABLE_KEY.hobbies,
  STABLE_KEY.recentInterest,
  STABLE_KEY.motto,
  STABLE_KEY.otherActivities,
] as const;

const MESSAGE_KEYS = new Set<string>([STABLE_KEY.selfIntroduction]);

const ASSIGNED_DETAIL_KEYS = new Set<string>([
  ...HERO_KEYS,
  ...BUSINESS_KEYS,
  ...PERSONAL_KEYS,
  ...MESSAGE_KEYS,
]);

const FALLBACK_LABELS = {
  [STABLE_KEY.hobbies]: "趣味",
  [STABLE_KEY.recentInterest]: "最近の関心",
  [STABLE_KEY.motto]: "座右の銘",
  [STABLE_KEY.otherActivities]: "その他の活動",
} as const satisfies Record<(typeof PERSONAL_KEYS)[number], string>;

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

function renderValue(value: RawField["value"]): string {
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function fieldByStableKey(
  sections: ReadonlyArray<NormalizedSection>,
): ReadonlyMap<string, NormalizedField> {
  const fields = new Map<string, NormalizedField>();
  for (const field of sections.flatMap((section) => section.fields)) {
    if (!fields.has(field.stableKey)) fields.set(field.stableKey, field);
  }
  return fields;
}

function valueFor(
  fields: ReadonlyMap<string, NormalizedField>,
  stableKey: string,
): string {
  const field = fields.get(stableKey);
  return field ? renderValue(field.value) : "";
}

function buildOtherSections(
  sections: ReadonlyArray<NormalizedSection>,
): ReadonlyArray<NormalizedSection> {
  return sections
    .map((section) => ({
      ...section,
      fields: section.fields.filter(
        (field) => !ASSIGNED_DETAIL_KEYS.has(field.stableKey),
      ),
    }))
    .filter((section) => section.fields.length > 0);
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
  const fields = fieldByStableKey(sections);
  const links = linkSections
    .flatMap((section) => section.fields)
    .map((field) => ({
      stableKey: field.stableKey,
      label: field.label,
      href: renderValue(field.value),
    }))
    .filter((link) => link.href.length > 0);
  return {
    memberId: profile.memberId,
    summary: profile.summary,
    hero: {
      ...profile.summary,
      hometown: valueFor(fields, STABLE_KEY.hometown),
    },
    business: {
      businessOverview: valueFor(fields, STABLE_KEY.businessOverview),
      skills: valueFor(fields, STABLE_KEY.skills),
      canProvide: valueFor(fields, STABLE_KEY.canProvide),
    },
    personal: PERSONAL_KEYS.map((stableKey) => {
      const field = fields.get(stableKey);
      return (
        field ?? {
          stableKey,
          label: FALLBACK_LABELS[stableKey],
          value: null,
          kind: "shortText" as const,
        }
      );
    }),
    message: valueFor(fields, STABLE_KEY.selfIntroduction),
    sections,
    linkSections,
    links,
    other: buildOtherSections(sections),
    attendance: profile.attendance,
    tags: profile.tags,
    photoUrl: profile.photoUrl,
  };
}

export const __testInternals = {
  BUSINESS_KEYS,
  DETAIL_KINDS,
  HERO_KEYS,
  KIND_ROUTE,
  LINK_KINDS,
  PERSONAL_KEYS,
} as const;
