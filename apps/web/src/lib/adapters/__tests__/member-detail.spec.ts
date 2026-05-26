// serial-06-form-response-binding: adapter unit spec (10 cases / branch coverage 100% 目標)
import { describe, expect, it, vi } from "vitest";

import { FieldKindZ, PublicMemberProfileZ } from "@ubm-hyogo/shared";

import { samplePublicMemberProfile } from "../../../fixtures/public-member-profile";
import {
  __testInternals,
  PublicMemberProfileWithUnknownKindZ,
  toMemberDetailProps,
} from "../member-detail";

describe("toMemberDetailProps", () => {
  it("fixture は PublicMemberProfileZ.parse を通過する", () => {
    expect(() =>
      PublicMemberProfileZ.parse(samplePublicMemberProfile),
    ).not.toThrow();
  });

  it("happy path: summary / attendance / tags をそのまま伝播する", () => {
    const result = toMemberDetailProps(samplePublicMemberProfile);
    expect(result.memberId).toBe(samplePublicMemberProfile.memberId);
    expect(result.summary).toEqual(samplePublicMemberProfile.summary);
    expect(result.attendance).toEqual(samplePublicMemberProfile.attendance);
    expect(result.tags).toEqual(samplePublicMemberProfile.tags);
    expect(result.sections.length).toBeGreaterThan(0);
  });

  it("visibility=member field を除外する", () => {
    const result = toMemberDetailProps(samplePublicMemberProfile);
    const all = result.sections.flatMap((s) => s.fields);
    expect(all.find((f) => f.stableKey === "responseEmail")).toBeUndefined();
  });

  it("visibility=admin のみで構成された section は丸ごと除外", () => {
    const result = toMemberDetailProps(samplePublicMemberProfile);
    expect(result.sections.find((s) => s.key === "consent")).toBeUndefined();
  });

  it("unknown kind を silent skip する", () => {
    const tampered = structuredClone(samplePublicMemberProfile);
    (tampered.publicSections[0].fields[0].kind as unknown as string) =
      "unknown_kind_xyz";
    const result = toMemberDetailProps(tampered);
    const basic = result.sections.find((s) => s.key === "basic");
    expect(basic?.fields.find((f) => f.stableKey === "fullName")).toBeUndefined();
    expect(basic?.fields.find((f) => f.stableKey === "nickname")).toBeDefined();
  });

  it("unknown kind で onUnknownKind callback を呼ぶ", () => {
    const tampered = structuredClone(samplePublicMemberProfile);
    (tampered.publicSections[0].fields[0].kind as unknown as string) =
      "unknown_kind_xyz";
    const onUnknownKind = vi.fn();

    const result = toMemberDetailProps(tampered, { onUnknownKind });

    expect(onUnknownKind).toHaveBeenCalledTimes(1);
    expect(onUnknownKind).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "unknown_kind_xyz",
        stableKey: tampered.publicSections[0].fields[0].stableKey,
      }),
    );
    const basic = result.sections.find((s) => s.key === "basic");
    expect(basic?.fields.find((f) => f.stableKey === "fullName")).toBeUndefined();
  });

  it("page 境界の lenient schema は unknown kind を adapter まで通す", () => {
    const tampered = structuredClone(samplePublicMemberProfile);
    (tampered.publicSections[0].fields[0].kind as unknown as string) =
      "unknown_kind_xyz";

    expect(() => PublicMemberProfileZ.parse(tampered)).toThrow();
    const parsed = PublicMemberProfileWithUnknownKindZ.parse(tampered);
    const onUnknownKind = vi.fn();

    toMemberDetailProps(parsed, { onUnknownKind });

    expect(onUnknownKind).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "unknown_kind_xyz",
        stableKey: tampered.publicSections[0].fields[0].stableKey,
      }),
    );
  });

  it("入力を mutate しない", () => {
    const snapshot = structuredClone(samplePublicMemberProfile);
    toMemberDetailProps(samplePublicMemberProfile);
    expect(samplePublicMemberProfile).toEqual(snapshot);
  });

  it("publicSections が空のとき sections === []", () => {
    const result = toMemberDetailProps({
      ...samplePublicMemberProfile,
      publicSections: [],
    });
    expect(result.sections).toEqual([]);
    expect(result.linkSections).toEqual([]);
  });

  it("出力 field には visibility / source キーが含まれない", () => {
    const result = toMemberDetailProps(samplePublicMemberProfile);
    for (const section of result.sections) {
      for (const field of section.fields) {
        expect(field).not.toHaveProperty("visibility");
        expect(field).not.toHaveProperty("source");
      }
    }
  });
});

describe("KIND_ROUTE exhaustiveness", () => {
  it("FieldKindZ.options 全件が KIND_ROUTE に存在する", () => {
    const routed = Object.keys(__testInternals.KIND_ROUTE);
    for (const kind of FieldKindZ.options) {
      expect(routed).toContain(kind);
    }
  });

  it("KIND_ROUTE のキーは FieldKindZ.options と完全一致する", () => {
    const routed = Object.keys(__testInternals.KIND_ROUTE).sort();
    const enumValues = [...FieldKindZ.options].sort();
    expect(routed).toEqual(enumValues);
  });
});

describe("toMemberDetailProps の分類除外", () => {
  it.each(["consent", "system", "unknown"] as const)(
    "kind = %s の field は detail / links のどちらにも含まれない",
    (kind) => {
      const tampered = structuredClone(samplePublicMemberProfile);
      const target = tampered.publicSections[0].fields[0];
      (target.kind as unknown as string) = kind;

      const result = toMemberDetailProps(tampered);
      const all = [...result.sections, ...result.linkSections].flatMap(
        (section) => section.fields,
      );

      expect(
        all.find((field) => field.stableKey === target.stableKey),
      ).toBeUndefined();
    },
  );

  it("kind = url の field は detail から除外し linkSections に残す", () => {
    const tampered = structuredClone(samplePublicMemberProfile);
    const target = tampered.publicSections[0].fields[0];
    target.kind = "url";
    target.value = "https://example.com/member";

    const result = toMemberDetailProps(tampered);
    const detailFields = result.sections.flatMap((section) => section.fields);
    const linkFields = result.linkSections.flatMap((section) => section.fields);

    expect(
      detailFields.find((field) => field.stableKey === target.stableKey),
    ).toBeUndefined();
    expect(
      linkFields.find((field) => field.stableKey === target.stableKey),
    ).toMatchObject({
      kind: "url",
      value: "https://example.com/member",
    });
  });
});

// === EXTENSION TEMPLATE ===
// schema を拡張して新しい field kind / field を追加した場合、
// 以下をコピーして describe("toMemberDetailProps", ...) 内の末尾に挿入する。
//
// it("<新 kind> を正しく normalize する", () => {
//   const tampered = structuredClone(samplePublicMemberProfile);
//   tampered.publicSections[<idx>].fields.push({
//     stableKey: "<key>",
//     label: "<label>",
//     kind: "<new_kind>",
//     value: "<value>",
//     visibility: "public",
//     source: "forms",
//   });
//   const result = toMemberDetailProps(tampered);
//   const target = result.sections
//     .flatMap((s) => s.fields)
//     .find((f) => f.stableKey === "<key>");
//   expect(target).toBeDefined();
//   expect(target?.kind).toBe("<new_kind>");
// });
//
// 拡張時の注意:
// - 先に packages/shared/src/zod/viewmodel.ts の PublicMemberProfileZ を拡張する。
// - 出力 field に visibility / source が含まれない不変条件を維持する。
// - primitive 描画変更が必要なら別 PR で分割する。
// 詳細手順: apps/web/src/lib/adapters/README.md
// === END EXTENSION TEMPLATE ===
