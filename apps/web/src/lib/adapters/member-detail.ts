import type { z } from "zod";

import type { PublicMemberProfileZ } from "@ubm-hyogo/shared";

type PublicMemberProfile = z.infer<typeof PublicMemberProfileZ>;
type Section = PublicMemberProfile["publicSections"][number];
type Field = Section["fields"][number];

const DISPLAYABLE_KINDS = new Set<Field["kind"]>([
  "shortText",
  "paragraph",
  "date",
  "radio",
  "checkbox",
  "dropdown",
]);

export interface MemberDetailViewModel {
  detailSections: ReadonlyArray<Section>;
  allSections: ReadonlyArray<Section>;
}

function isDisplayableKind(kind: Field["kind"]): boolean {
  return DISPLAYABLE_KINDS.has(kind);
}

function filterVisibleFields(fields: ReadonlyArray<Field>): Field[] {
  return fields.filter(
    (field) =>
      field.visibility === "public" && isDisplayableKind(field.kind),
  );
}

export function buildMemberDetailViewModel(
  profile: PublicMemberProfile,
): MemberDetailViewModel {
  const allSections = profile.publicSections.map((section) => ({
    ...section,
    fields: section.fields.filter((field) => field.visibility === "public"),
  }));
  const detailSections = allSections
    .filter((section) => section.key !== "activity")
    .map((section) => ({
      ...section,
      fields: filterVisibleFields(section.fields),
    }))
    .filter((section) => section.fields.length > 0);

  return { detailSections, allSections };
}
