import { describe, expect, it } from "vitest";

import {
  mapFormResponse,
  mapFormSchema,
  type RawForm,
  type RawFormResponse,
} from "./mapper";

const baseInput = {
  schemaHash: "sha-1",
  syncedAt: "2026-04-30T00:00:00Z",
};

describe("mapFormSchema branch coverage", () => {
  it("handles raw with no items / no info / no responderUri", () => {
    const raw: RawForm = { formId: "form_x" };
    const out = mapFormSchema({ ...baseInput, raw });
    expect(out.fields).toHaveLength(0);
    expect(out.manifest.title).toBe("");
    expect(out.manifest.revisionId).toBe("unknown");
    expect(out.manifest.sourceUrl).toBe("https://docs.google.com/forms/d/form_x");
    expect(out.manifest.unknownFieldCount).toBe(0);
  });

  it("falls back to documentTitle when title is missing", () => {
    const raw: RawForm = {
      formId: "form_y",
      info: { documentTitle: "Doc Title" },
    };
    const out = mapFormSchema({ ...baseInput, raw });
    expect(out.manifest.title).toBe("Doc Title");
  });

  it("derives stableKey via slugify for unmapped labels, handles options and pageBreak", () => {
    const raw: RawForm = {
      formId: "form_z",
      revisionId: "rev-2",
      items: [
        {
          itemId: "i_a",
          title: "Custom Question Title",
          questionItem: { question: { questionId: "q_a" } },
        },
        {
          itemId: "i_c",
          title: "with options",
          questionItem: {
            question: {
              questionId: "q_c",
              choiceQuestion: { options: [{ value: "Opt A" }, {}] },
            },
          },
        },
        {
          itemId: "i_d",
          title: "page",
          pageBreakItem: { title: "page break" },
        },
      ],
    };
    const out = mapFormSchema({ ...baseInput, raw });
    expect(out.fields).toHaveLength(3);
    expect(out.fields[0].stableKey).toBe("custom_question_title");
    expect(out.fields[1].kind).toBe("radio");
    expect(out.fields[1].choiceLabels).toHaveLength(2);
    expect(out.fields[1].choiceLabels[1].rawLabel).toBe("");
    expect(out.fields[2].kind).toBe("unknown");
    expect(out.manifest.unknownFieldCount).toBe(0);
  });
});

describe("mapFormResponse branch coverage", () => {
  const common = {
    formId: "form_1",
    revisionId: "rev-1",
    schemaHash: "sha-1",
  };

  it("treats single-value answer as scalar and multi-value as array", () => {
    const raw: RawFormResponse = {
      responseId: "r_1",
      lastSubmittedTime: "2026-04-30T00:00:00Z",
      respondentEmail: "x@example.com",
      answers: {
        q_1: { textAnswers: { answers: [{ value: "single" }] } },
        q_2: {
          textAnswers: { answers: [{ value: "a" }, { value: "b" }] },
        },
      },
    };
    const out = mapFormResponse({
      ...common,
      raw,
      questionIdToStableKey: { q_1: "fullName", q_2: "skills" },
    });
    expect(out.answersByStableKey.fullName).toBe("single");
    expect(out.answersByStableKey.skills).toEqual(["a", "b"]);
    expect(out.unmappedQuestionIds).toEqual([]);
  });

  it("collects unmapped questionIds, falls back submittedAt to createTime, allows null email", () => {
    const raw: RawFormResponse = {
      responseId: "r_2",
      createTime: "2026-04-29T00:00:00Z",
      respondentEmail: undefined,
      answers: {
        q_unknown: { textAnswers: { answers: [{ value: "v" }] } },
      },
    };
    const out = mapFormResponse({
      ...common,
      raw,
      questionIdToStableKey: {},
    });
    expect(out.unmappedQuestionIds).toEqual(["q_unknown"]);
    expect(out.responseEmail).toBeNull();
    expect(out.submittedAt).toBe("2026-04-29T00:00:00Z");
  });

  it("uses default 1970 submittedAt when raw lacks both lastSubmittedTime and createTime", () => {
    const raw: RawFormResponse = { responseId: "r_default" };
    const out = mapFormResponse({
      ...common,
      raw,
      questionIdToStableKey: {},
    });
    expect(out.answersByStableKey).toEqual({});
    expect(out.submittedAt).toBe("1970-01-01T00:00:00Z");
    expect(out.searchText).toBe("");
  });

  it("treats empty textAnswers list as null scalar via empty array path", () => {
    const raw: RawFormResponse = {
      responseId: "r_3",
      lastSubmittedTime: "2026-04-30T00:00:00Z",
      answers: {
        q_n: { textAnswers: { answers: [] } },
      },
    };
    const out = mapFormResponse({
      ...common,
      raw,
      questionIdToStableKey: { q_n: "nickname" },
    });
    expect(out.answersByStableKey.nickname).toBeNull();
  });
});
