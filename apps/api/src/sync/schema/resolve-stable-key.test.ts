// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "../../repository/__tests__/_setup";
import { resolveStableKey } from "./resolve-stable-key";
import * as schemaQuestionsRepo from "../../repository/schemaQuestions";
import { asStableKey } from "@ubm-hyogo/shared";

describe("resolveStableKey", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
  }, 30000);

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
    const r = await resolveStableKey(
      { questionId: "qExisting", title: "label-now" },
      {
        ctx: env.ctx,
        labelToKnownStableKey: () => "shouldBeIgnored",
      },
    );
    expect(r).toEqual({ stableKey: "fullName", source: "alias" });
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
