// 03b: T-U-03, T-U-04, T-U-07
import { describe, expect, it } from "vitest";
import { normalizeResponse } from "./normalize-response";
import {
  asResponseEmail,
  asResponseId,
  type MemberResponse,
} from "@ubm-hyogo/shared";

const baseResp = (
  overrides: Partial<MemberResponse> = {},
): MemberResponse => ({
  responseId: asResponseId("r-1"),
  formId: "form-1",
  revisionId: "rev-1",
  schemaHash: "hash-1",
  responseEmail: asResponseEmail("a@b.example.com"),
  submittedAt: "2026-01-01T00:00:00Z",
  editResponseUrl: null,
  answersByStableKey: {},
  rawAnswersByQuestionId: {},
  extraFields: {},
  unmappedQuestionIds: [],
  searchText: "",
  ...overrides,
});

describe("normalizeResponse", () => {
  it("known stableKey と unknown を分離する (T-U-03)", () => {
    const resp = baseResp({
      answersByStableKey: { fullName: "山田太郎", publicConsent: "同意します" },
      unmappedQuestionIds: ["q-unknown-1"],
      rawAnswersByQuestionId: {
        "q-unknown-1": { textAnswers: { answers: [{ value: "新質問" }] } },
        "q-known-1": { textAnswers: { answers: [{ value: "山田太郎" }] } },
      },
    });
    const result = normalizeResponse(resp);
    expect(Array.from(result.known.keys()).sort()).toEqual(
      ["fullName", "publicConsent"].sort(),
    );
    expect(Array.from(result.unknown.keys())).toEqual(["q-unknown-1"]);
  });

  it("responseEmail を known/unknown いずれにも含めない (T-U-07 / AC-4)", () => {
    const resp = baseResp({
      answersByStableKey: {
        responseEmail: "a@b.example.com",
        fullName: "山田",
      },
      unmappedQuestionIds: [],
    });
    const result = normalizeResponse(resp);
    expect(result.known.has("responseEmail")).toBe(false);
    expect(result.known.has("fullName")).toBe(true);
  });

  it("unknown は raw payload を JSON 文字列で保持する", () => {
    const raw = { textAnswers: { answers: [{ value: "X" }] } };
    const resp = baseResp({
      unmappedQuestionIds: ["qX"],
      rawAnswersByQuestionId: { qX: raw },
    });
    const result = normalizeResponse(resp);
    const u = result.unknown.get("qX");
    expect(u?.questionId).toBe("qX");
    expect(JSON.parse(u?.rawValueJson ?? "null")).toEqual(raw);
  });
});
