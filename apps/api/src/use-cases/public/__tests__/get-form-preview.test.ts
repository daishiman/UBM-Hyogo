// UT-08A-01: get-form-preview use-case unit test。
// happy / schema null → UBM-5500 / D1 failure を担保する。
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@ubm-hyogo/shared/errors";
import { logWarn } from "@ubm-hyogo/shared/logging";

import { getFormPreviewUseCase } from "../get-form-preview";
import {
  buildSchemaQuestionRow,
  buildSchemaVersionRow,
  createPublicD1Mock,
} from "./helpers/public-d1";

vi.mock("@ubm-hyogo/shared/logging", () => ({
  logWarn: vi.fn(),
}));

const env = {
  GOOGLE_FORM_ID: "form-test",
  FORM_ID: undefined,
  GOOGLE_FORM_RESPONDER_URL: "https://example.test/forms/test/respond",
};

describe("getFormPreviewUseCase", () => {
  beforeEach(() => {
    vi.mocked(logWarn).mockClear();
  });

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

  // TC-RED-01: schema_versions が存在し schema_questions が 0 件 → 200 で fieldCount: 0
  // 503 への暴発を防ぎ、空 fields でも view が成立することの担保。
  it("schema_questions が 0 件でも 503 にならず fieldCount=0 / sectionCount=0 で view を返す", async () => {
    const db = createPublicD1Mock({
      latestVersion: buildSchemaVersionRow({ field_count: 0 }),
      schemaFields: [],
    });
    const result = await getFormPreviewUseCase({
      ctx: { db: db as never },
      env,
    });
    expect(result.fieldCount).toBe(0);
    expect(result.sectionCount).toBe(0);
    expect(result.fields).toEqual([]);
    expect(result.responderUrl).toBe(env.GOOGLE_FORM_RESPONDER_URL);
    expect(result.manifest.formId).toBe("form-test");
  });

  // TC-RED-02-A: GOOGLE_FORM_ID 未設定でも FORM_ID が schema_versions の lookup formId として渡る
  it("GOOGLE_FORM_ID が undefined のとき FORM_ID で schema_versions を検索する", async () => {
    const bindLog: Array<{ sql: string; bindings: unknown[] }> = [];
    const db = createPublicD1Mock({
      latestVersion: buildSchemaVersionRow({ form_id: "form-from-FORM_ID" }),
      schemaFields: [],
      bindLog,
    });
    const result = await getFormPreviewUseCase({
      ctx: { db: db as never },
      env: {
        GOOGLE_FORM_ID: undefined,
        FORM_ID: "form-from-FORM_ID",
        GOOGLE_FORM_RESPONDER_URL: "https://example.test/respond",
      },
    });
    const versionLookup = bindLog.find((b) =>
      b.sql.includes("FROM schema_versions"),
    );
    expect(versionLookup?.bindings[0]).toBe("form-from-FORM_ID");
    expect(result.manifest.formId).toBe("form-from-FORM_ID");
  });

  // TC-RED-02-B: GOOGLE_FORM_ID / FORM_ID とも未設定なら FALLBACK_FORM_ID を使う
  it("GOOGLE_FORM_ID / FORM_ID が共に undefined なら FALLBACK formId で検索する", async () => {
    const FALLBACK_FORM_ID = "119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg";
    const bindLog: Array<{ sql: string; bindings: unknown[] }> = [];
    const db = createPublicD1Mock({
      latestVersion: buildSchemaVersionRow({ form_id: FALLBACK_FORM_ID }),
      schemaFields: [],
      bindLog,
    });
    const result = await getFormPreviewUseCase({
      ctx: { db: db as never },
      env: {
        GOOGLE_FORM_ID: undefined,
        FORM_ID: undefined,
        GOOGLE_FORM_RESPONDER_URL: undefined,
      },
    });
    const versionLookup = bindLog.find((b) =>
      b.sql.includes("FROM schema_versions"),
    );
    expect(versionLookup?.bindings[0]).toBe(FALLBACK_FORM_ID);
    expect(result.manifest.formId).toBe(FALLBACK_FORM_ID);
    // responderUrl も FALLBACK が効くこと
    expect(result.responderUrl).toBe(
      "https://docs.google.com/forms/d/e/1FAIpQLSeWfv-R8nblYVqqcCTwcvVsFyVVHFeKYxn96NEm1zNXeydtVQ/viewform",
    );
  });

  // TC-FAIL-01: choiceLabelsJson が壊れた JSON でも crash せず空配列で fallback する
  it("choice_labels_json が不正な JSON のとき空配列で fallback する", async () => {
    const db = createPublicD1Mock({
      latestVersion: buildSchemaVersionRow(),
      schemaFields: [
        buildSchemaQuestionRow({
          stable_key: "favoriteColor",
          choice_labels_json: "{not-json",
        }),
      ],
    });
    const result = await getFormPreviewUseCase({
      ctx: { db: db as never },
      env,
    });
    expect(result.fields).toHaveLength(1);
    expect(result.fields[0]?.choiceLabels).toEqual([]);
  });

  // TC-COV-01: env が両方 undefined で manifest も null のとき、structured warn が
  // usedFallback=true を出すことを担保（line 55-56 の && 第二オペランドの branch 補完）
  it("env 両方 undefined で manifest が null のときも UBM-5500 を投げる (usedFallback 経路)", async () => {
    const db = createPublicD1Mock({ latestVersion: null });
    await expect(
      getFormPreviewUseCase({
        ctx: { db: db as never },
        env: {
          GOOGLE_FORM_ID: undefined,
          FORM_ID: undefined,
          GOOGLE_FORM_RESPONDER_URL: undefined,
        },
      }),
    ).rejects.toBeInstanceOf(ApiError);
    expect(logWarn).toHaveBeenCalledWith({
      code: "UBM-5500",
      message: "schema_versions row missing — returning 503",
      context: {
        where: "getFormPreviewUseCase",
        formId: "119ec539YYGmkUEnSYlhI-zMXtvljVpvDFMm7nfhp7Xg",
        usedFallback: true,
      },
    });
  });

  // TC-FAIL-02: choice_labels_json が array でない object の場合も空配列で fallback する
  it("choice_labels_json が object の場合は空配列で fallback する", async () => {
    const db = createPublicD1Mock({
      latestVersion: buildSchemaVersionRow(),
      schemaFields: [
        buildSchemaQuestionRow({
          stable_key: "favoriteColor",
          choice_labels_json: '{"not":"array"}',
        }),
      ],
    });
    const result = await getFormPreviewUseCase({
      ctx: { db: db as never },
      env,
    });
    expect(result.fields[0]?.choiceLabels).toEqual([]);
  });
});
