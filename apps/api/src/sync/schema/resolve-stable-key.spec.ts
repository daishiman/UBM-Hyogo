// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "../../repository/__tests__/_setup";
import { resolveStableKey } from "./resolve-stable-key";
import * as schemaQuestionsRepo from "../../repository/schemaQuestions";
import * as schemaAliasesRepo from "../../repository/schemaAliases";
import { asStableKey } from "@ubm-hyogo/shared";

describe("resolveStableKey", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
  }, 60000);

  it("known: labelToKnownStableKey が返した値を採用する", async () => {
    const r = await resolveStableKey(
      { questionId: "qNew", title: "お名前（フルネーム）" },
      {
        ctx: env.ctx,
        labelToKnownStableKey: (l) =>
          l === "お名前（フルネーム）" ? "fullName" : null,
      },
    );
    expect(r).toEqual({ stableKey: "fullName", source: "known" });
  });

  it("alias: D1 既存 stable_key が known より優先される", async () => {
    await schemaAliasesRepo.insert(env.ctx, {
      id: "alias-q-existing",
      stableKey: asStableKey("fullName"),
      aliasQuestionId: "qExisting",
      aliasLabel: "label-old",
      source: "manual",
      resolvedBy: "admin@example.com",
      resolvedAt: "2026-05-01T00:00:00.000Z",
    });
    const r = await resolveStableKey(
      { questionId: "qExisting", title: "label-now" },
      {
        ctx: env.ctx,
        labelToKnownStableKey: () => "shouldBeIgnored",
      },
    );
    expect(r).toEqual({ stableKey: "fullName", source: "alias" });
  });

  it("fallback retired (issue-299): schema_aliases miss でも schema_questions.stable_key にはフォールバックしない", async () => {
    // 既存 schema_questions に過去の stable_key が残っていても、
    // schema_aliases に alias 行が無ければ resolve は alias 経路で hit しないこと。
    await schemaQuestionsRepo.upsertField(env.ctx, {
      questionPk: "rev-prev:qExisting",
      revisionId: "rev-prev",
      stableKey: asStableKey("fullName"),
      questionId: "qExisting",
      itemId: null,
      sectionKey: "section_1",
      sectionTitle: "S1",
      label: "label-old",
      kind: "shortText",
      position: 0,
      required: false,
      visibility: "public",
      searchable: true,
      status: "active",
      choiceLabelsJson: "[]",
    });
    const preparedSql: string[] = [];
    const originalPrepare = env.db.prepare.bind(env.db);
    (env.db as typeof env.db & { prepare: typeof env.db.prepare }).prepare = (sql: string) => {
      preparedSql.push(sql);
      return originalPrepare(sql);
    };
    // known map も不在 → unresolved (source='unknown') になる
    const r = await resolveStableKey(
      { questionId: "qExisting", title: "label-now" },
      {
        ctx: env.ctx,
        labelToKnownStableKey: () => null,
      },
    );
    expect(r).toEqual({ stableKey: null, source: "unknown" });
    expect(preparedSql).not.toContain([
      "SELECT stable_key FROM schema_questions",
      "WHERE question_id = ?",
      "ORDER BY revision_id DESC LIMIT 1",
    ].join(" "));
  });

  it("fallback retired (issue-299): alias miss かつ known hit の場合は known を採用する", async () => {
    // schema_aliases miss でも known map が解決すれば source='known' で確定する。
    await schemaQuestionsRepo.upsertField(env.ctx, {
      questionPk: "rev-prev:qExisting2",
      revisionId: "rev-prev",
      stableKey: asStableKey("fullName"),
      questionId: "qExisting2",
      itemId: null,
      sectionKey: "section_1",
      sectionTitle: "S1",
      label: "label-old",
      kind: "shortText",
      position: 0,
      required: false,
      visibility: "public",
      searchable: true,
      status: "active",
      choiceLabelsJson: "[]",
    });
    const r = await resolveStableKey(
      { questionId: "qExisting2", title: "label-now" },
      {
        ctx: env.ctx,
        labelToKnownStableKey: (l) => (l === "label-now" ? "displayName" : null),
      },
    );
    expect(r).toEqual({ stableKey: "displayName", source: "known" });
  });

  it("unknown: alias も known も無ければ stableKey=null / source='unknown'", async () => {
    const r = await resolveStableKey(
      { questionId: "qNew", title: "未知ラベル" },
      {
        ctx: env.ctx,
        labelToKnownStableKey: () => null,
      },
    );
    expect(r).toEqual({ stableKey: null, source: "unknown" });
  });

  it("unknown: D1 に stable_key='unknown' があっても alias 採用しない", async () => {
    await schemaQuestionsRepo.upsertField(env.ctx, {
      questionPk: "rev-prev:qZ",
      revisionId: "rev-prev",
      stableKey: asStableKey("unknown"),
      questionId: "qZ",
      itemId: null,
      sectionKey: "section_1",
      sectionTitle: "S1",
      label: "x",
      kind: "shortText",
      position: 0,
      required: false,
      visibility: "public",
      searchable: true,
      status: "active",
      choiceLabelsJson: "[]",
    });
    const r = await resolveStableKey(
      { questionId: "qZ", title: "未知" },
      { ctx: env.ctx, labelToKnownStableKey: () => null },
    );
    expect(r.source).toBe("unknown");
  });
});
