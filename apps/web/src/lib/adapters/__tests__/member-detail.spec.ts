import { describe, expect, it } from "vitest";

import { buildMemberDetailViewModel } from "../member-detail";

type Profile = Parameters<typeof buildMemberDetailViewModel>[0];
type Section = Profile["publicSections"][number];
type Field = Section["fields"][number];

function makeField(overrides: Partial<Field> = {}): Field {
  return {
    stableKey: "basic:fullName",
    label: "氏名",
    value: "山田 太郎",
    kind: "shortText",
    visibility: "public",
    source: "forms",
    ...overrides,
  } as Field;
}

function makeSection(overrides: Partial<Section> = {}): Section {
  return {
    key: "basic",
    title: "基本情報",
    fields: [makeField()],
    ...overrides,
  } as Section;
}

function makeProfile(sections: Section[]): Profile {
  return {
    memberId: "member-1",
    summary: {
      fullName: "山田 太郎",
      nickname: "",
      location: "",
      occupation: "",
      ubmZone: null,
      ubmMembershipType: null,
    },
    publicSections: sections,
    attendance: [],
    tags: [],
  };
}

describe("buildMemberDetailViewModel", () => {
  it("keeps activity only in allSections after public visibility filtering (TC-A-01)", () => {
    const activity = makeSection({
      key: "activity",
      title: "活動",
      fields: [
        makeField({ stableKey: "activity:public" }),
        makeField({ stableKey: "activity:admin", visibility: "admin" }),
      ],
    });
    const profile = makeProfile([makeSection(), activity]);

    const viewModel = buildMemberDetailViewModel(profile);

    expect(viewModel.detailSections.map((section) => section.key)).toEqual([
      "basic",
    ]);
    expect(viewModel.allSections.map((section) => section.key)).toEqual([
      "basic",
      "activity",
    ]);
    expect(viewModel.allSections[1]?.fields.map((field) => field.stableKey)).toEqual([
      "activity:public",
    ]);
  });

  it("filters non-public fields defensively (TC-A-02)", () => {
    const profile = makeProfile([
      makeSection({
        fields: [
          makeField({ stableKey: "public", visibility: "public" }),
          makeField({ stableKey: "member", visibility: "member" }),
          makeField({ stableKey: "admin", visibility: "admin" }),
        ],
      }),
    ]);

    expect(
      buildMemberDetailViewModel(profile).detailSections[0]?.fields.map(
        (field) => field.stableKey,
      ),
    ).toEqual(["public"]);
  });

  it("filters url fields from detail sections (TC-A-03)", () => {
    const profile = makeProfile([
      makeSection({
        fields: [
          makeField({ stableKey: "links:site", kind: "url" }),
          makeField({ stableKey: "basic:fullName", kind: "shortText" }),
        ],
      }),
    ]);

    expect(
      buildMemberDetailViewModel(profile).detailSections[0]?.fields.map(
        (field) => field.stableKey,
      ),
    ).toEqual(["basic:fullName"]);
  });

  it("silently skips non-display kinds (TC-A-04)", () => {
    const profile = makeProfile([
      makeSection({
        fields: [
          makeField({ stableKey: "ok", kind: "paragraph" }),
          makeField({ stableKey: "unknown", kind: "unknown" }),
          makeField({ stableKey: "system", kind: "system" }),
          makeField({ stableKey: "consent", kind: "consent" }),
        ],
      }),
    ]);

    expect(
      buildMemberDetailViewModel(profile).detailSections[0]?.fields.map(
        (field) => field.stableKey,
      ),
    ).toEqual(["ok"]);
  });

  it("removes sections emptied by filtering (TC-A-05)", () => {
    const profile = makeProfile([
      makeSection({
        fields: [makeField({ stableKey: "links:only", kind: "url" })],
      }),
    ]);

    expect(buildMemberDetailViewModel(profile).detailSections).toEqual([]);
  });

  it("does not mutate the input profile (TC-A-06)", () => {
    const profile = makeProfile([
      makeSection({
        fields: [
          makeField({ stableKey: "public" }),
          makeField({ stableKey: "admin", visibility: "admin" }),
        ],
      }),
    ]);
    const before = structuredClone(profile);

    expect(buildMemberDetailViewModel(profile)).toEqual(
      buildMemberDetailViewModel(profile),
    );
    expect(profile).toEqual(before);
    expect(profile.publicSections[0]?.fields.map((field) => field.stableKey)).toEqual([
      "public",
      "admin",
    ]);
  });
});
