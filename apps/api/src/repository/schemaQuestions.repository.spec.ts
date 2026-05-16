import { describe, it, expect } from "vitest";
import { createFakeD1 } from "./_shared/__fakes__/fakeD1";
import { findFieldByStableKey, findStableKeyByQuestionId, listFieldsByVersion, upsertField } from "./schemaQuestions";
import { asStableKey } from "./_shared/brand";

const seed = () => ({
  tables: {
    schema_questions: [
      {
        question_pk: "p1",
        revision_id: "v1",
        stable_key: "name_full",
        question_id: "q1",
        item_id: "i1",
        section_key: "basic",
        section_title: "基本情報",
        label: "氏名",
        kind: "text",
        position: 0,
        required: 1,
        visibility: "public",
        searchable: 1,
        status: "active",
        choice_labels_json: "[]",
      },
      {
        question_pk: "p2",
        revision_id: "v1",
        stable_key: "occupation",
        question_id: "q2",
        item_id: "i2",
        section_key: "basic",
        section_title: "基本情報",
        label: "職種",
        kind: "select",
        position: 1,
        required: 0,
        visibility: "members_only",
        searchable: 1,
        status: "active",
        choice_labels_json: "[]",
      },
    ],
    schema_aliases: [
      {
        id: "alias-q1",
        revision_id: "v1",
        stable_key: "name_full",
        alias_question_id: "q1",
        alias_label: "氏名",
        source: "manual",
        created_at: "2026-05-15T00:00:00.000Z",
        resolved_by: "admin@example.com",
        resolved_at: "2026-05-15T00:00:00.000Z",
      },
    ],
  },
  primaryKeys: { schema_questions: ["question_pk"], schema_aliases: ["id"] },
});

describe("schemaQuestions repository", () => {
  it("listFieldsByVersion は position ASC で返す", async () => {
    const fake = createFakeD1(seed());
    const r = await listFieldsByVersion({ db: fake.d1 }, "f1", "v1");
    expect(r.map((f) => f.questionPk)).toEqual(["p1", "p2"]);
  });

  it("findFieldByStableKey", async () => {
    const fake = createFakeD1(seed());
    const r = await findFieldByStableKey({ db: fake.d1 }, asStableKey("name_full"));
    expect(r?.questionPk).toBe("p1");
  });

  it("upsertField は新規挿入できる", async () => {
    const fake = createFakeD1(seed());
    const r = await upsertField(
      { db: fake.d1 },
      {
        questionPk: "p3",
        revisionId: "v1",
        stableKey: asStableKey("note"),
        questionId: "q3",
        itemId: "i3",
        sectionKey: "extra",
        sectionTitle: "追加",
        label: "備考",
        kind: "text",
        position: 2,
        required: false,
        visibility: "admin_only",
        searchable: false,
        status: "active",
        choiceLabelsJson: "[]",
      },
    );
    expect(r.questionPk).toBe("p3");
  });

  it("findStableKeyByQuestionId は schema_aliases hit を返す", async () => {
    const fake = createFakeD1(seed());
    const r = await findStableKeyByQuestionId({ db: fake.d1 }, "q1");
    expect(r).toBe("name_full");
  });

  it("findStableKeyByQuestionId は alias miss で schema_questions.stable_key に fallback しない", async () => {
    const fake = createFakeD1(seed());
    const r = await findStableKeyByQuestionId({ db: fake.d1 }, "q2");
    expect(r).toBeNull();
    expect(fake.calls.map((c) => c.sql)).not.toContain([
      "SELECT stable_key FROM schema_questions",
      "WHERE question_id = ?",
      "ORDER BY revision_id DESC LIMIT 1",
    ].join(" "));
  });
});
