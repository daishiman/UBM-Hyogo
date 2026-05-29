import { describe, expect, it } from "vitest";
import {
  decidePublishState,
  isAdminOverrideStatus,
  normalizeConsentValue,
  normalizePublishState,
  type AutoPublishInput,
} from "./auto-publish";

const base: AutoPublishInput = {
  currentPublishState: "member_only",
  publicConsent: "unknown",
  hasAdminExplicitOverride: false,
  flagEnabled: true,
};

describe("decidePublishState", () => {
  it("flagEnabled=false は currentPublishState を維持", () => {
    expect(
      decidePublishState({ ...base, flagEnabled: false, publicConsent: "consented" }),
    ).toBe("member_only");
  });
  it("flag=true / member_only / consented / no override → public", () => {
    expect(
      decidePublishState({ ...base, publicConsent: "consented" }),
    ).toBe("public");
  });
  it("flag=true / member_only / consented / override=true → member_only", () => {
    expect(
      decidePublishState({
        ...base,
        publicConsent: "consented",
        hasAdminExplicitOverride: true,
      }),
    ).toBe("member_only");
  });
  it("flag=true / member_only / declined → member_only", () => {
    expect(
      decidePublishState({ ...base, publicConsent: "declined" }),
    ).toBe("member_only");
  });
  it("flag=true / member_only / unknown → member_only", () => {
    expect(decidePublishState({ ...base, publicConsent: "unknown" })).toBe(
      "member_only",
    );
  });
  it("flag=true / hidden / consented → hidden", () => {
    expect(
      decidePublishState({
        ...base,
        currentPublishState: "hidden",
        publicConsent: "consented",
      }),
    ).toBe("hidden");
  });
  it("flag=true / public / 任意 → public 維持", () => {
    expect(
      decidePublishState({
        ...base,
        currentPublishState: "public",
        publicConsent: "declined",
      }),
    ).toBe("public");
  });
});

describe("isAdminOverrideStatus", () => {
  it("currentPublishState='hidden' は admin override 扱い", () => {
    expect(
      isAdminOverrideStatus({ currentPublishState: "hidden", updatedBy: null }),
    ).toBe(true);
  });
  it("updatedBy=null は admin override ではない", () => {
    expect(
      isAdminOverrideStatus({ currentPublishState: "member_only", updatedBy: null }),
    ).toBe(false);
  });
  it("updatedBy='system:sync' は admin override ではない", () => {
    expect(
      isAdminOverrideStatus({
        currentPublishState: "member_only",
        updatedBy: "system:sync",
      }),
    ).toBe(false);
  });
  it("updatedBy='admin@example.com' は admin override", () => {
    expect(
      isAdminOverrideStatus({
        currentPublishState: "member_only",
        updatedBy: "admin@example.com",
      }),
    ).toBe(true);
  });
});

describe("normalizePublishState", () => {
  it("legacy published -> public", () => {
    expect(normalizePublishState("published")).toBe("public");
  });
  it("legacy private -> hidden", () => {
    expect(normalizePublishState("private")).toBe("hidden");
  });
  it("canonical 値は維持", () => {
    expect(normalizePublishState("public")).toBe("public");
    expect(normalizePublishState("hidden")).toBe("hidden");
    expect(normalizePublishState("member_only")).toBe("member_only");
  });
  it("不明値は member_only", () => {
    expect(normalizePublishState(null)).toBe("member_only");
    expect(normalizePublishState(undefined)).toBe("member_only");
    expect(normalizePublishState("???")).toBe("member_only");
  });
});

describe("normalizeConsentValue", () => {
  it("正常値はそのまま", () => {
    expect(normalizeConsentValue("consented")).toBe("consented");
    expect(normalizeConsentValue("declined")).toBe("declined");
  });
  it("不明値は unknown", () => {
    expect(normalizeConsentValue(null)).toBe("unknown");
    expect(normalizeConsentValue(undefined)).toBe("unknown");
    expect(normalizeConsentValue("anything")).toBe("unknown");
  });
});
