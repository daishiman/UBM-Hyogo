import { describe, expect, it } from "vitest";

import { LEGACY_CONSENT_KEYS, normalizeConsent } from "./consent";

describe("consent normalizer (AC-5 / 不変条件 #2)", () => {
  it("returns unknown when raw is null/undefined", () => {
    expect(normalizeConsent(null)).toEqual({
      publicConsent: "unknown",
      rulesConsent: "unknown",
    });
    expect(normalizeConsent(undefined)).toEqual({
      publicConsent: "unknown",
      rulesConsent: "unknown",
    });
  });

  it("normalizes legacy publicConsent keys to publicConsent: consented", () => {
    for (const key of [
      "public_consent",
      "publishConsent",
      "shareInfo",
      "consent_publish",
    ]) {
      expect(normalizeConsent({ [key]: true })).toEqual({
        publicConsent: "consented",
        rulesConsent: "unknown",
      });
    }
  });

  it("normalizes legacy rulesConsent keys to rulesConsent: consented", () => {
    for (const key of [
      "rules_consent",
      "ruleConsent",
      "rule_consent",
      "agreeRules",
      "consent_rules",
    ]) {
      expect(normalizeConsent({ [key]: "yes" })).toEqual({
        publicConsent: "unknown",
        rulesConsent: "consented",
      });
    }
  });

  it("normalizes mixed legacy + canonical keys, canonical wins", () => {
    const result = normalizeConsent({
      shareInfo: false,
      publicConsent: "consented",
      ruleConsent: "no",
      rulesConsent: "yes",
    });
    expect(result).toEqual({
      publicConsent: "consented",
      rulesConsent: "consented",
    });
  });

  it("treats Japanese 同意します as consented", () => {
    expect(normalizeConsent({ publicConsent: "同意します" })).toEqual({
      publicConsent: "consented",
      rulesConsent: "unknown",
    });
  });

  it("normalizes Google Forms textAnswers payloads", () => {
    expect(
      normalizeConsent({
        q_public: {
          questionId: "q_public",
          textAnswers: { answers: [{ value: "同意する（掲載OK）" }] },
        },
        q_rules: {
          questionId: "q_rules",
          textAnswers: { answers: [{ value: "同意する" }] },
        },
      }),
    ).toEqual({
      publicConsent: "consented",
      rulesConsent: "consented",
    });
  });

  it("treats Japanese 同意しません as declined", () => {
    expect(normalizeConsent({ rulesConsent: "同意しません" })).toEqual({
      publicConsent: "unknown",
      rulesConsent: "declined",
    });
  });

  it("returns unknown for unrecognised string", () => {
    expect(normalizeConsent({ publicConsent: "maybe" })).toEqual({
      publicConsent: "unknown",
      rulesConsent: "unknown",
    });
  });

  it("LEGACY_CONSENT_KEYS contains no canonical keys", () => {
    expect(LEGACY_CONSENT_KEYS).not.toContain("publicConsent");
    expect(LEGACY_CONSENT_KEYS).not.toContain("rulesConsent");
  });
});
