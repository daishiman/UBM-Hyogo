// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from "vitest";
import { setupD1, type InMemoryD1 } from "./_setup";
import {
  countMemberTagReferences,
  createTagDefinition,
  deactivateTagDefinition,
  getTagDefinitionByIdRaw,
  listTagDefinitionsPaged,
  physicalDeleteTagDefinition,
  reactivateTagDefinition,
  updateTagDefinition,
} from "../tagDefinitions";

describe("tagDefinitions write repository (issue-1035)", () => {
  let env: InMemoryD1;

  beforeEach(async () => {
    env = await setupD1();
    vi.spyOn(crypto, "randomUUID").mockReturnValue(
      "00000000-0000-4000-8000-000000000001",
    );
    await env.db
      .prepare(
        `INSERT INTO tag_definitions (tag_id, code, label, category, source_stable_keys_json, active)
         VALUES ('tag_eng','engineer','エンジニア','occupation','[]',1),
                ('tag_mgr','manager','経営者','occupation','[]',1),
                ('tag_old','old','古いタグ','misc','[]',0)`,
      )
      .run();
  });

  it("creates active tag definitions and maps code conflicts", async () => {
    const created = await createTagDefinition(env.ctx, {
      code: "designer",
      label: "デザイナー",
      category: "occupation",
    });
    expect(created).toEqual({
      ok: true,
      row: expect.objectContaining({
        tagId: "00000000-0000-4000-8000-000000000001",
        code: "designer",
        active: true,
      }),
    });

    const conflict = await createTagDefinition(env.ctx, {
      code: "engineer",
      label: "重複",
      category: "occupation",
    });
    expect(conflict).toEqual({ ok: false, reason: "code_conflict" });
  });

  it("updates label/category only and maps missing rows", async () => {
    const updated = await updateTagDefinition(env.ctx, "tag_eng", {
      label: "Engineer",
      category: "role",
    });
    expect(updated).toMatchObject({
      ok: true,
      row: {
        tagId: "tag_eng",
        code: "engineer",
        label: "Engineer",
        category: "role",
      },
    });

    await updateTagDefinition(env.ctx, "tag_eng", { label: "Engineer 2" });
    expect(await getTagDefinitionByIdRaw(env.ctx, "tag_eng")).toMatchObject({
      code: "engineer",
      label: "Engineer 2",
      category: "role",
    });
    expect(await updateTagDefinition(env.ctx, "missing", { label: "x" })).toEqual({
      ok: false,
      reason: "not_found",
    });
  });

  it("renames code with conflict and stale result separation", async () => {
    const missingExpectedCode = await updateTagDefinition(env.ctx, "tag_eng", {
      code: "software_engineer",
    });
    expect(missingExpectedCode).toEqual({ ok: false, reason: "missing_expected_code" });

    const renamed = await updateTagDefinition(env.ctx, "tag_eng", {
      code: "software_engineer",
      expectedCode: "engineer",
    });
    expect(renamed).toMatchObject({
      ok: true,
      row: {
        tagId: "tag_eng",
        code: "software_engineer",
      },
    });

    const conflict = await updateTagDefinition(env.ctx, "tag_eng", {
      code: "manager",
      expectedCode: "software_engineer",
    });
    expect(conflict).toEqual({ ok: false, reason: "code_conflict" });

    const stale = await updateTagDefinition(env.ctx, "tag_eng", {
      code: "principal_engineer",
      expectedCode: "engineer",
    });
    expect(stale).toEqual({ ok: false, reason: "stale" });
  });

  it("keeps member_tags rows attached to tag_id when code is renamed", async () => {
    await env.db
      .prepare(
        "INSERT INTO member_tags (member_id, tag_id, source, assigned_by) VALUES ('m1', 'tag_eng', 'manual', 'admin@example.com')",
      )
      .run();

    const renamed = await updateTagDefinition(env.ctx, "tag_eng", {
      code: "software_engineer",
      expectedCode: "engineer",
    });
    expect(renamed).toMatchObject({ ok: true });

    const memberTags = await env.db
      .prepare("SELECT COUNT(*) AS n FROM member_tags WHERE tag_id = 'tag_eng'")
      .first<{ n: number }>();
    expect(memberTags?.n).toBe(1);
  });

  it("deactivates idempotently without touching member_tags", async () => {
    await env.db
      .prepare(
        "INSERT INTO member_tags (member_id, tag_id, source, assigned_by) VALUES ('m1', 'tag_eng', 'manual', 'admin@example.com')",
      )
      .run();

    const first = await deactivateTagDefinition(env.ctx, "tag_eng");
    expect(first).toMatchObject({
      changed: true,
      row: { tagId: "tag_eng", active: false },
    });
    const second = await deactivateTagDefinition(env.ctx, "tag_eng");
    expect(second).toMatchObject({ changed: false });
    expect(await deactivateTagDefinition(env.ctx, "missing")).toBeNull();

    const memberTags = await env.db
      .prepare("SELECT COUNT(*) AS n FROM member_tags WHERE tag_id = 'tag_eng'")
      .first<{ n: number }>();
    expect(memberTags?.n).toBe(1);
  });

  it("reactivates inactive tags idempotently", async () => {
    const first = await reactivateTagDefinition(env.ctx, "tag_old");
    expect(first).toMatchObject({
      changed: true,
      row: { tagId: "tag_old", active: true },
    });

    const second = await reactivateTagDefinition(env.ctx, "tag_old");
    expect(second).toMatchObject({
      changed: false,
      row: { tagId: "tag_old", active: true },
    });
    expect(await reactivateTagDefinition(env.ctx, "missing")).toBeNull();
  });

  it("physically deletes only unreferenced tag definitions and frees code", async () => {
    await env.db
      .prepare(
        "INSERT INTO member_tags (member_id, tag_id, source, assigned_by) VALUES ('m1', 'tag_eng', 'manual', 'admin@example.com')",
      )
      .run();

    expect(await countMemberTagReferences(env.ctx, "tag_eng")).toBe(1);
    const blocked = await physicalDeleteTagDefinition(env.ctx, "tag_eng");
    expect(blocked).toEqual({
      ok: false,
      reason: "has_references",
      referenceCount: 1,
    });
    expect(await getTagDefinitionByIdRaw(env.ctx, "tag_eng")).toMatchObject({
      tagId: "tag_eng",
    });

    const deleted = await physicalDeleteTagDefinition(env.ctx, "tag_old");
    expect(deleted).toEqual({
      ok: true,
      row: expect.objectContaining({ tagId: "tag_old", code: "old" }),
    });
    expect(await getTagDefinitionByIdRaw(env.ctx, "tag_old")).toBeNull();

    const recreated = await createTagDefinition(env.ctx, {
      code: "old",
      label: "Old Again",
      category: "misc",
    });
    expect(recreated).toMatchObject({ ok: true, row: { code: "old" } });
    expect(await physicalDeleteTagDefinition(env.ctx, "missing")).toEqual({
      ok: false,
      reason: "not_found",
    });
  });

  it("lists with pagination, search, inactive rows, and stable total", async () => {
    const first = await listTagDefinitionsPaged(env.ctx, { page: 1, pageSize: 2 });
    expect(first.total).toBe(3);
    expect(first.items.map((row) => row.code)).toEqual(["engineer", "manager"]);

    const second = await listTagDefinitionsPaged(env.ctx, { page: 2, pageSize: 2 });
    expect(second.total).toBe(3);
    expect(second.items.map((row) => row.code)).toEqual(["old"]);

    const searched = await listTagDefinitionsPaged(env.ctx, {
      q: "MAN",
      page: 1,
      pageSize: 50,
    });
    expect(searched.items.map((row) => row.code)).toEqual(["manager"]);

    const wildcard = await listTagDefinitionsPaged(env.ctx, {
      q: "%",
      page: 1,
      pageSize: 50,
    });
    expect(wildcard.total).toBe(3);
  });
});
