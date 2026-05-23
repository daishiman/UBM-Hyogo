// 03b: T-U-05, T-U-12（AC-3 / AC-8）
import { describe, expect, it } from "vitest";
import { extractConsent } from "./extract-consent";
import {
  asResponseEmail,
  asResponseId,
  type MemberResponse,
} from "@ubm-hyogo/shared";

const baseResp = (
  answersByStableKey: Record<string, unknown>,
  rawAnswersByQuestionId: Record<string, unknown> = {},
): MemberResponse => ({
  responseId: asResponseId("r-1"),
  formId: "form-1",
  revisionId: "rev-1",
  schemaHash: "hash-1",
  responseEmail: asResponseEmail("a@b.example.com"),
  submittedAt: "2026-01-01T00:00:00Z",
  editResponseUrl: null,
  answersByStableKey: answersByStableKey as MemberResponse["answersByStableKey"],
  rawAnswersByQuestionId,
  extraFields: {},
  unmappedQuestionIds: [],
  searchText: "",
});

describe("extractConsent", () => {
  it("publicConsent / rulesConsent を consented/declined/unknown に正規化する (T-U-05)", () => {
    const r = baseResp({
      publicConsent: "同意します",
      rulesConsent: "同意しない",
    });
    expect(extractConsent(r)).toEqual({
      publicConsent: "consented",
      rulesConsent: "declined",
    });
  });

  it("空 / 未知の値は unknown", () => {
    const r = baseResp({});
    expect(extractConsent(r)).toEqual({
      publicConsent: "unknown",
      rulesConsent: "unknown",
    });
  });

  it("旧 ruleConsent を rulesConsent として正規化する (T-U-12 / AC-8)", () => {
    const r = baseResp({ ruleConsent: "yes" });
    expect(extractConsent(r).rulesConsent).toBe("consented");
  });
});
