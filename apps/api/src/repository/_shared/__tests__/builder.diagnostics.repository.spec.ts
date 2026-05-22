import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { buildSectionsWithDiagnostics } from "../builder";
import { defaultMetadataResolver } from "../metadata";
import * as logger from "../../../lib/logger";
import type { FieldVisibility } from "@ubm-hyogo/shared";

const allowAll: FieldVisibility[] = ["public", "member", "admin"];

describe("buildSectionsWithDiagnostics structured logging (DT-08〜DT-10)", () => {
  const warnSpy = vi.spyOn(logger, "logWarn");

  beforeEach(() => {
    warnSpy.mockClear();
  });

  afterEach(() => {
    warnSpy.mockClear();
  });

  it("DT-08: unknown stable key 検出時 logWarn が UBM-MANIFEST-UNKNOWN-KEY で呼ばれる", () => {
    const sections = [{ section_key: "basic_profile", section_title: "基本", position: 1 }];
    const fields = [
      { stable_key: "fullName", value_json: '"taro"' },
      { stable_key: "totally_unknown_x", value_json: '"v"' },
      { stable_key: "another_unknown_y", value_json: '"v"' },
    ];
    const visibilityMap = new Map<string, FieldVisibility>();
    const result = buildSectionsWithDiagnostics(
      sections,
      fields,
      visibilityMap,
      allowAll,
      defaultMetadataResolver,
    );
    expect(result.diagnostics.unknownStableKeys).toContain("totally_unknown_x");
    expect(result.diagnostics.unknownStableKeys).toContain("another_unknown_y");
    expect(warnSpy).toHaveBeenCalledTimes(1);
    const payload = warnSpy.mock.calls[0]![0]!;
    expect(payload.code).toBe("UBM-MANIFEST-UNKNOWN-KEY");
    expect(payload.count).toBe(2);
    expect(payload.stableKeys).toEqual(
      expect.arrayContaining(["totally_unknown_x", "another_unknown_y"]),
    );
  });

  it("DT-09: unknown 件数 0 のとき logWarn は呼ばれない", () => {
    const sections = [{ section_key: "basic_profile", section_title: "基本", position: 1 }];
    const fields = [{ stable_key: "fullName", value_json: '"taro"' }];
    const visibilityMap = new Map<string, FieldVisibility>();
    buildSectionsWithDiagnostics(
      sections,
      fields,
      visibilityMap,
      allowAll,
      defaultMetadataResolver,
    );
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("DT-10: 戻り値 shape は { sections, diagnostics: { unknownStableKeys, errors } }", () => {
    const result = buildSectionsWithDiagnostics(
      [],
      [],
      new Map(),
      allowAll,
      defaultMetadataResolver,
    );
    expect(Object.keys(result).sort()).toEqual(["diagnostics", "sections"]);
    expect(Object.keys(result.diagnostics).sort()).toEqual(["errors", "unknownStableKeys"]);
  });

  it("DT-18: logWarn の count が unknownStableKeys.length と一致", () => {
    const sections = [{ section_key: "basic_profile", section_title: "基本", position: 1 }];
    const fields = [
      { stable_key: "x_unknown_a", value_json: null },
      { stable_key: "x_unknown_b", value_json: null },
      { stable_key: "x_unknown_c", value_json: null },
    ];
    const result = buildSectionsWithDiagnostics(
      sections,
      fields,
      new Map(),
      allowAll,
      defaultMetadataResolver,
    );
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0]![0]!.count).toBe(result.diagnostics.unknownStableKeys.length);
  });
});
