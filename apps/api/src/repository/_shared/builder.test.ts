import { describe, expect, it } from "vitest";
import { buildSections, buildSectionsWithDiagnostics } from "./builder";
import { defaultMetadataResolver, UNKNOWN_SECTION_KEY } from "./metadata";
import type { FieldVisibility } from "@ubm-hyogo/shared";

const allVis: FieldVisibility[] = ["public", "member", "admin"];

const visMap = (entries: Record<string, FieldVisibility>): Map<string, FieldVisibility> =>
  new Map(Object.entries(entries));

describe("buildSections (resolver wiring)", () => {
  it("place each field in exactly one section (AC-3)", () => {
    const sections = buildSections(
      [],
      [
        { stable_key: "fullName", value_json: JSON.stringify("Y") },
        { stable_key: "nickname", value_json: JSON.stringify("N") },
        { stable_key: "publicConsent", value_json: JSON.stringify("consented") },
      ],
      visMap({ fullName: "public", nickname: "public", publicConsent: "admin" }),
      allVis,
      defaultMetadataResolver,
    );
    const all = sections.flatMap((s) => s.fields.map((f) => `${s.key}:${f.stableKey}`));
    const uniq = new Set(all);
    expect(uniq.size).toBe(all.length);
  });

  it("does not leak stable_key as label (AC-5)", () => {
    const sections = buildSections(
      [],
      [{ stable_key: "fullName", value_json: JSON.stringify("Y") }],
      visMap({ fullName: "public" }),
      allVis,
      defaultMetadataResolver,
    );
    const fld = sections.flatMap((s) => s.fields).find((f) => f.stableKey === "fullName");
    expect(fld).toBeDefined();
    expect(fld!.label).not.toBe("fullName");
    expect(fld!.label.length).toBeGreaterThan(0);
  });

  it("isolates unknown stable_keys into __unknown__ section (AC-6)", () => {
    const result = buildSectionsWithDiagnostics(
      [],
      [
        { stable_key: "fullName", value_json: JSON.stringify("Y") },
        { stable_key: "q_section1_company_name", value_json: JSON.stringify("Acme") },
      ],
      visMap({ fullName: "public", q_section1_company_name: "public" }),
      allVis,
      defaultMetadataResolver,
    );
    const sections = result.sections;
    const unknown = sections.find((s) => s.key === UNKNOWN_SECTION_KEY);
    expect(unknown).toBeDefined();
    expect(unknown!.fields.map((f) => f.stableKey)).toEqual(["q_section1_company_name"]);
    expect(unknown!.fields[0]!.kind).toBe("unknown");
    expect(result.diagnostics.unknownStableKeys).toEqual(["q_section1_company_name"]);
    expect(result.diagnostics.errors.some((e) => e.kind === "unknownStableKey")).toBe(true);
  });

  it("resolves consent kind for consent stable_keys (AC-4)", () => {
    const sections = buildSections(
      [],
      [
        { stable_key: "publicConsent", value_json: JSON.stringify("consented") },
        { stable_key: "rulesConsent", value_json: JSON.stringify("consented") },
      ],
      visMap({ publicConsent: "admin", rulesConsent: "admin" }),
      allVis,
      defaultMetadataResolver,
    );
    const consentSection = sections.find((s) => s.key === "consent");
    expect(consentSection).toBeDefined();
    for (const f of consentSection!.fields) {
      expect(f.kind).toBe("consent");
    }
  });

  it("filters by allowedVisibilities and never duplicates fields", () => {
    const sections = buildSections(
      [],
      [
        { stable_key: "fullName", value_json: JSON.stringify("Y") },
        { stable_key: "nickname", value_json: JSON.stringify("N") },
        { stable_key: "publicConsent", value_json: JSON.stringify("consented") },
      ],
      visMap({ fullName: "public", nickname: "member", publicConsent: "admin" }),
      ["public"],
      defaultMetadataResolver,
    );
    const flat = sections.flatMap((s) => s.fields.map((f) => f.stableKey));
    expect(flat).toEqual(["fullName"]);
  });
});
