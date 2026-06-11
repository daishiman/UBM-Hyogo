import { describe, expect, it } from "vitest";

import { buildQuestionIdToStableKey } from "./build-qid-map";

describe("buildQuestionIdToStableKey", () => {
  it("falls back to raw form labels when schema_questions rows are empty", () => {
    const map = buildQuestionIdToStableKey(
      {
        formId: "form_1",
        items: [
          {
            title: "お名前（フルネーム）",
            questionItem: { question: { questionId: "q_name" } },
          },
        ],
      },
      [],
    );
    expect(map).toEqual({ q_name: "fullName" });
  });

  it("merges raw fallback with schema rows and lets schema rows win", () => {
    const map = buildQuestionIdToStableKey(
      {
        formId: "form_1",
        items: [
          {
            title: "Custom Question Title",
            questionItem: { question: { questionId: "q_custom" } },
          },
          {
            title: "お名前（フルネーム）",
            questionItem: { question: { questionId: "q_name" } },
          },
        ],
      },
      [
        { questionId: "q_custom", stableKey: "schemaOwnedKey" },
        { questionId: null, stableKey: "ignored" },
      ],
    );
    expect(map).toEqual({
      q_custom: "schemaOwnedKey",
      q_name: "fullName",
    });
  });
});
