// @vitest-environment node
// Issue #836 (T-01〜T-05): schema alias recompute workflow の reverse-backfill / idempotency /
// 衝突回避 / CPU budget 継続 / not_rolled_back ガードを in-memory D1 で検証する。
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "../repository/__tests__/_setup";
import {
  schemaAliasRecompute,
  reverseBackfillResponseFields,
  SchemaAliasRecomputeFailure,
} from "./schemaAliasRecompute";

const insertAlias = async (
  env: InMemoryD1,
  id: string,
  overrides: Partial<{
    revisionId: string;
    stableKey: string;
    aliasQuestionId: string;
    aliasLabel: string;
    source: string;
    resolvedBy: string;
    resolvedAt: string;
    version: number;
    deletedAt: string | null;
  }> = {},
) => {
  const o = {
    revisionId: "rev1",
    stableKey: "full_name",
    aliasQuestionId: "q1",
    aliasLabel: "Full name",
    source: "manual",
    resolvedBy: "admin@example.com",
    resolvedAt: "2026-05-19T00:00:00.000Z",
    version: 2,
    deletedAt: "2026-05-19T01:00:00.000Z" as string | null,
    ...overrides,
  };
  await env.db
    .prepare(
      `INSERT INTO schema_aliases
       (id, revision_id, stable_key, alias_question_id, alias_label, source, resolved_by, resolved_at, deleted_at, deleted_by, version)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      o.revisionId,
      o.stableKey,
      o.aliasQuestionId,
      o.aliasLabel,
      o.source,
      o.resolvedBy,
      o.resolvedAt,
      o.deletedAt,
      o.deletedAt ? "admin@example.com" : null,
      o.version,
    )
    .run();
};

const insertResponseField = async (
  env: InMemoryD1,
  responseId: string,
  stableKey: string,
) => {
  await env.db
    .prepare(
      `INSERT OR IGNORE INTO member_responses
       (response_id, form_id, revision_id, schema_hash, submitted_at, answers_json)
       VALUES (?, 'f1', 'rev1', 'h', '2026-01-01T00:00:00Z', '{}')`,
    )
    .bind(responseId)
    .run();
  await env.db
    .prepare(
      `INSERT INTO response_fields (response_id, stable_key, value_json, raw_value_json)
       VALUES (?, ?, NULL, '{}')`,
    )
    .bind(responseId, stableKey)
    .run();
};

const countByKey = async (env: InMemoryD1, stableKey: string): Promise<number> => {
  const r = await env.db
    .prepare(`SELECT COUNT(*) AS c FROM response_fields WHERE stable_key = ?1`)
    .bind(stableKey)
    .first<{ c: number }>();
  return Number(r?.c ?? 0);
};

describe("schemaAliasRecompute workflow", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
  }, 30000);

  it("T-01: rollback 済み alias の stable_key を __extra__:{qid} に整復する", async () => {
    await insertAlias(env, "a-1", { stableKey: "full_name", aliasQuestionId: "q1" });
    await insertResponseField(env, "r1", "full_name");
    await insertResponseField(env, "r2", "full_name");
    await insertResponseField(env, "r3", "full_name");

    const res = await schemaAliasRecompute(env.ctx, {
      aliasId: "a-1",
      actor: "admin@example.com",
    });

    expect(res.status).toBe("completed");
    expect(res.affectedCount).toBe(3);
    expect(res.processedCount).toBe(3);
    expect(res.updatedCount).toBe(3);
    expect(await countByKey(env, "full_name")).toBe(0);
    expect(await countByKey(env, "__extra__:q1")).toBe(3);
  });

  it("T-02: 同一 triggerKey の 2 回呼び出しは冪等（jobId / auditId 一致・件数不変）", async () => {
    await insertAlias(env, "a-2", { stableKey: "full_name", aliasQuestionId: "q1" });
    await insertResponseField(env, "r1", "full_name");
    await insertResponseField(env, "r2", "full_name");

    const first = await schemaAliasRecompute(env.ctx, {
      aliasId: "a-2",
      actor: "admin@example.com",
    });
    const afterFirst = await countByKey(env, "__extra__:q1");

    const second = await schemaAliasRecompute(env.ctx, {
      aliasId: "a-2",
      actor: "admin@example.com",
    });

    expect(second.jobId).toBe(first.jobId);
    expect(second.recomputeAuditId).toBe(first.recomputeAuditId);
    expect(await countByKey(env, "__extra__:q1")).toBe(afterFirst);
    expect(afterFirst).toBe(2);
    const audits = await env.db
      .prepare(
        `SELECT COUNT(*) AS c FROM audit_log
         WHERE action = 'schema_alias.recompute' AND target_id = 'a-2'`,
      )
      .first<{ c: number }>();
    expect(Number(audits?.c ?? 0)).toBe(1);
  });

  it("T-03: 既に __extra__ 行が存在する response は stable_key 行を DELETE し衝突回避する", async () => {
    await insertAlias(env, "a-3", { stableKey: "full_name", aliasQuestionId: "q1" });
    // r1 は full_name と __extra__:q1 の両方を持つ（衝突状態）
    await insertResponseField(env, "r1", "full_name");
    await insertResponseField(env, "r1", "__extra__:q1");

    const res = await schemaAliasRecompute(env.ctx, {
      aliasId: "a-3",
      actor: "admin@example.com",
    });

    expect(res.status).toBe("completed");
    expect(res.deletedCollisionCount).toBe(1);
    expect(await countByKey(env, "full_name")).toBe(0);
    const extra = await env.db
      .prepare(
        `SELECT COUNT(*) AS c FROM response_fields
         WHERE response_id = 'r1' AND stable_key = '__extra__:q1'`,
      )
      .first<{ c: number }>();
    expect(Number(extra?.c ?? 0)).toBe(1);
  });

  it("T-03B: 衝突削除と UPDATE は選択済み batch の response_id だけを処理する", async () => {
    await insertResponseField(env, "r1", "full_name");
    await insertResponseField(env, "r1", "__extra__:q1");
    await insertResponseField(env, "r2", "full_name");
    await insertResponseField(env, "r3", "full_name");

    const first = await reverseBackfillResponseFields(
      env.ctx,
      "q1",
      "full_name",
      null,
      1,
      0,
    );

    expect(first.status).toBe("exhausted");
    expect(first.processed).toBe(1);
    expect(first.deletedCollision).toBe(1);
    expect(first.updated).toBe(0);
    expect(await countByKey(env, "full_name")).toBe(2);
    expect(await countByKey(env, "__extra__:q1")).toBe(1);
  });

  it("T-04: CPU budget exhausted で running 継続し、再呼び出しで completed になる", async () => {
    await insertAlias(env, "a-4", { stableKey: "full_name", aliasQuestionId: "q1" });
    await insertResponseField(env, "r1", "full_name");
    await insertResponseField(env, "r2", "full_name");
    await insertResponseField(env, "r3", "full_name");

    // reverseBackfillResponseFields 単体: cpuBudgetMs=0 で exhausted + 非 null cursor
    const direct = await reverseBackfillResponseFields(
      env.ctx,
      "q1",
      "full_name",
      null,
      2,
      0,
    );
    expect(direct.status).toBe("exhausted");
    expect(direct.cursor).not.toBeNull();
    expect(direct.processed).toBeGreaterThan(0);

    // direct 呼び出しで一部が __extra__ に移動済みなので state をリセットして再 seed
    env = await setupD1();
    await insertAlias(env, "a-4", { stableKey: "full_name", aliasQuestionId: "q1" });
    await insertResponseField(env, "r1", "full_name");
    await insertResponseField(env, "r2", "full_name");
    await insertResponseField(env, "r3", "full_name");

    const running = await schemaAliasRecompute(env.ctx, {
      aliasId: "a-4",
      actor: "admin@example.com",
      cpuBudgetMs: 0,
      batchSize: 2,
    });
    expect(running.status).toBe("running");

    const done = await schemaAliasRecompute(env.ctx, {
      aliasId: "a-4",
      actor: "admin@example.com",
    });
    expect(done.status).toBe("completed");
    expect(done.jobId).toBe(running.jobId);
    expect(await countByKey(env, "full_name")).toBe(0);
    expect(await countByKey(env, "__extra__:q1")).toBe(3);
  });

  it("T-05: 未 rollback（deleted_at IS NULL）の alias は not_rolled_back を throw し無変更", async () => {
    await insertAlias(env, "a-5", {
      stableKey: "full_name",
      aliasQuestionId: "q1",
      deletedAt: null,
    });
    await insertResponseField(env, "r1", "full_name");

    await expect(
      schemaAliasRecompute(env.ctx, { aliasId: "a-5", actor: "admin@example.com" }),
    ).rejects.toMatchObject({
      name: "SchemaAliasRecomputeFailure",
      kind: "not_rolled_back",
    });
    expect(SchemaAliasRecomputeFailure).toBeDefined();
    expect(await countByKey(env, "full_name")).toBe(1);
    expect(await countByKey(env, "__extra__:q1")).toBe(0);
  });
});
