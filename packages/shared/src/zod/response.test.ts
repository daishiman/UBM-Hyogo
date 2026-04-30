import { describe, expect, it } from "vitest";

import { FormResponseAnswerZ, MemberResponseZ } from "./response";

describe("response zod schemas", () => {
  it("FormResponseAnswerZ accepts scalar value", () => {
    const out = FormResponseAnswerZ.parse({ stableKey: "fullName", value: "山田" });
    expect(out.stableKey).toBe("fullName");
  });

  it("MemberResponseZ accepts a fully populated response", () => {
    const out = MemberResponseZ.parse({
      responseId: "r_1",
      formId: "f_1",
      revisionId: "rev-1",
      schemaHash: "sha-1",
      responseEmail: "x@example.com",
      submittedAt: "2026-04-30T00:00:00Z",
      editResponseUrl: "https://docs.google.com/forms/d/e/abc/edit",
      answersByStableKey: { fullName: "山田" },
      rawAnswersByQuestionId: { q_1: "x" },
      extraFields: {},
      unmappedQuestionIds: [],
      searchText: "",
    });
    expect(out.responseEmail).toBe("x@example.com");
  });

  it("MemberResponseZ allows null email and editResponseUrl", () => {
    const out = MemberResponseZ.parse({
      responseId: "r_2",
      formId: "f_1",
      revisionId: "rev-1",
      schemaHash: "sha-1",
      responseEmail: null,
      submittedAt: "2026-04-30T00:00:00Z",
      editResponseUrl: null,
      answersByStableKey: {},
      rawAnswersByQuestionId: {},
      extraFields: {},
      unmappedQuestionIds: [],
      searchText: "",
    });
    expect(out.responseEmail).toBeNull();
  });

  it("MemberResponseZ rejects empty responseId", () => {
    expect(() =>
      MemberResponseZ.parse({
        responseId: "",
        formId: "f_1",
        revisionId: "rev-1",
        schemaHash: "sha-1",
        responseEmail: null,
        submittedAt: "2026-04-30T00:00:00Z",
        editResponseUrl: null,
        answersByStableKey: {},
        rawAnswersByQuestionId: {},
        extraFields: {},
        unmappedQuestionIds: [],
        searchText: "",
      }),
    ).toThrow();
  });
});
