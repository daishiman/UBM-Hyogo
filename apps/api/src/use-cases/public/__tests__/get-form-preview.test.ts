// UT-08A-01: get-form-preview use-case unit test。
// happy / schema null → UBM-5500 / D1 failure を担保する。
import { describe, expect, it } from "vitest";
import { ApiError } from "@ubm-hyogo/shared/errors";

import { getFormPreviewUseCase } from "../get-form-preview";
import {
  buildSchemaQuestionRow,
  buildSchemaVersionRow,
  createPublicD1Mock,
} from "./helpers/public-d1";

const env = {
  GOOGLE_FORM_ID: "form-test",
  FORM_ID: undefined,
  GOOGLE_FORM_RESPONDER_URL: "https://example.test/forms/test/respond",
};

describe("getFormPreviewUseCase", () => {
  it("schema manifest と field を view に組み立てる", async () => {
    const db = createPublicD1Mock({
      latestVersion: buildSchemaVersionRow(),
      schemaFields: [
        buildSchemaQuestionRow({
          stable_key: "fullName",
          position: 1,
          section_key: "section-1",
        }),
        buildSchemaQuestionRow({
          stable_key: "nickname",
          position: 2,
          section_key: "section-2",
          question_pk: "q-pk-2",
        }),
      ],
    });
    const result = await getFormPreviewUseCase({
      ctx: { db: db as never },
      env,
    });
    expect(result.fieldCount).toBe(2);
    expect(result.sectionCount).toBe(2);
    expect(result.responderUrl).toBe(env.GOOGLE_FORM_RESPONDER_URL);
    expect(result.manifest.formId).toBe("form-test");
  });

  it("schema_versions が無い場合は UBM-5500 を投げる", async () => {
    const db = createPublicD1Mock({ latestVersion: null });
    await expect(
      getFormPreviewUseCase({ ctx: { db: db as never }, env }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("schema_questions の query 失敗を伝播させる", async () => {
    const db = createPublicD1Mock({
      latestVersion: buildSchemaVersionRow(),
      failOnSql: /FROM schema_questions/,
    });
    await expect(
      getFormPreviewUseCase({ ctx: { db: db as never }, env }),
    ).rejects.toThrow(/MockD1Failure/);
  });
});
