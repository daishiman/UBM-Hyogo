import { describe, expect, it } from "vitest";

import { PUBLIC_CONSENT_KEY, RULES_CONSENT_KEY, normalizeConsent } from "./consent";

// extractConsentScalar / normalizeOne の未到達分岐を狙う追補テスト。
describe("consent normalizer branch coverage", () => {
  it("unwraps Forms textAnswers shape (extractConsentScalar recursion)", () => {
    const wrapped = {
      textAnswers: { answers: [{ value: "yes" }] },
    };
    expect(normalizeConsent({ [PUBLIC_CONSENT_KEY]: wrapped }).publicConsent).toBe(
      "consented",
    );
  });

  it("unwraps an array-wrapped scalar (Array.isArray branch)", () => {
    expect(
      normalizeConsent({ [PUBLIC_CONSENT_KEY]: ["yes"] }).publicConsent,
    ).toBe("consented");
  });

  it("maps numeric 1/0 and treats other numbers as unknown", () => {
    expect(normalizeConsent({ [PUBLIC_CONSENT_KEY]: 1 }).publicConsent).toBe(
      "consented",
    );
    expect(normalizeConsent({ [PUBLIC_CONSENT_KEY]: 0 }).publicConsent).toBe(
      "declined",
    );
    // 1/0 以外の number は unknown (line 65 branch)
    expect(normalizeConsent({ [PUBLIC_CONSENT_KEY]: 5 }).publicConsent).toBe(
      "unknown",
    );
  });

  it("treats empty trimmed string as unknown", () => {
    expect(normalizeConsent({ [PUBLIC_CONSENT_KEY]: "   " }).publicConsent).toBe(
      "unknown",
    );
  });

  it("matches the partial consented hint phrase (containsAny consented branch)", () => {
    expect(
      normalizeConsent({ [PUBLIC_CONSENT_KEY]: "掲載OKです" }).publicConsent,
    ).toBe("consented");
  });

  it("matches the partial declined hint phrase (containsAny declined branch)", () => {
    expect(
      normalizeConsent({ [PUBLIC_CONSENT_KEY]: "公開NGでお願いします" })
        .publicConsent,
    ).toBe("declined");
  });

  it("falls through unmatched strings to unknown", () => {
    expect(
      normalizeConsent({ [PUBLIC_CONSENT_KEY]: "なにか別の自由記述" })
        .publicConsent,
    ).toBe("unknown");
  });

  it("treats non-scalar object values as unknown (final fallthrough)", () => {
    expect(
      normalizeConsent({ [PUBLIC_CONSENT_KEY]: { nested: true } }).publicConsent,
    ).toBe("unknown");
  });

  it("infers publicConsent from a non-keyed answer containing a public hint", () => {
    const result = normalizeConsent({
      "活動内容の掲載について": "公開してよい",
    });
    expect(result.publicConsent).toBe("consented");
  });

  it("infers rulesConsent from a non-keyed answer containing a rules hint", () => {
    const result = normalizeConsent({
      "規約への同意": "同意します",
    });
    expect(result.rulesConsent).toBe("consented");
  });

  it("falls back rulesConsent to a normalizable non-hint answer", () => {
    const result = normalizeConsent({
      "なにかの設問": "yes",
    });
    expect(result.rulesConsent).toBe("consented");
  });

  it("skips known consent keys during inference", () => {
    const result = normalizeConsent({
      [RULES_CONSENT_KEY]: "yes",
      "別設問": "no",
    });
    expect(result.rulesConsent).toBe("consented");
  });
});
