import { describe, expect, it } from "vitest";
import {
  GeneratedManifestResolver,
  defaultMetadataResolver,
  UNKNOWN_SECTION_KEY,
  type AliasQueueAdapter,
} from "./metadata";

describe("GeneratedManifestResolver", () => {
  it("resolves consent stable_keys to consent kind (AC-4)", () => {
    const r = defaultMetadataResolver;
    const pubResult = r.resolveFieldKind("publicConsent");
    const rulesResult = r.resolveFieldKind("rulesConsent");
    expect(pubResult.ok && pubResult.value).toBe("consent");
    expect(rulesResult.ok && rulesResult.value).toBe("consent");
  });

  it("does not misclassify text/select stable_keys as consent (AC-4 boundary)", () => {
    const r = defaultMetadataResolver;
    const fullName = r.resolveFieldKind("fullName");
    const ubmZone = r.resolveFieldKind("ubmZone");
    expect(fullName.ok && fullName.value).toBe("shortText");
    expect(ubmZone.ok && ubmZone.value).toBe("radio");
  });

  it("resolves canonical labels and never returns the stable_key itself (AC-5)", () => {
    const r = defaultMetadataResolver;
    const result = r.resolveLabel("fullName");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).not.toBe("fullName");
      expect(result.value.length).toBeGreaterThan(0);
    }
  });

  it("returns Result.err with unknownStableKey for drift (AC-6)", () => {
    const r = defaultMetadataResolver;
    const result = r.resolveSectionKey("q_section1_company_name");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("unknownStableKey");
      if (result.error.kind === "unknownStableKey") {
        expect(result.error.stableKey).toBe("q_section1_company_name");
      }
    }
  });

  it("treats responseEmail as system field (invariant #3)", () => {
    const r = defaultMetadataResolver;
    const kind = r.resolveFieldKind("responseEmail");
    const section = r.resolveSectionKey("responseEmail");
    expect(kind.ok && kind.value).toBe("system");
    expect(section.ok && section.value).toBe("__system__");
  });

  it("supports alias adapter hook (AC-7)", () => {
    const adapter: AliasQueueAdapter = {
      async dryRunAlias(): Promise<{ ok: false; reason: string }> {
        return { ok: false, reason: "not-implemented" };
      },
    };
    const r = new GeneratedManifestResolver({ aliasAdapter: adapter });
    expect(r.getAliasAdapter()).toBe(adapter);
  });

  it("works without alias adapter (AC-7 fallback)", () => {
    const r = new GeneratedManifestResolver();
    expect(r.getAliasAdapter()).toBeUndefined();
    const result = r.resolveFieldKind("fullName");
    expect(result.ok).toBe(true);
  });

  it("listSections includes consent and __system__ ordering anchors", () => {
    const sections = defaultMetadataResolver.listSections();
    const keys = sections.map((s) => s.key);
    expect(keys).toContain("consent");
    expect(keys).toContain("__system__");
  });

  it("UNKNOWN_SECTION_KEY constant is stable", () => {
    expect(UNKNOWN_SECTION_KEY).toBe("__unknown__");
  });
});
