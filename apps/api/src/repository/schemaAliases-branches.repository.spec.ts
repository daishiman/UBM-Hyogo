// @vitest-environment node
// Branch coverage recovery for schemaAliases repository.
// Targets uncovered branches: getById active path (L106), findActiveByStableKey
// results (L121), listRecentResolvedAliases affected count + ?? fallbacks (L144/146),
// findRevisionStableKeyCollisions (L162), insertManualAlias existing/collision
// (L197/198), update not-found + conditional patch coalescing (L260/270/272/273/275).
import { beforeEach, describe, expect, it } from "vitest";
import { asStableKey } from "./_shared/brand";
import type { DbCtx } from "./_shared/db";
import { setupD1, type InMemoryD1 } from "./__tests__/_setup";
import {
  findActiveByStableKey,
  findAliasByQuestionId,
  findRevisionStableKeyCollisions,
  getById,
  insert,
  insertManualAlias,
  listRecentResolvedAliases,
  update,
} from "./schemaAliases";

// Minimal stub ctx returning empty/undefined results to exercise `?? []` fallback
// branches (real D1 .all() never yields a missing `results` array).
const stubNoResultsCtx = (): DbCtx => ({
  db: {
    prepare: () => {
      const stmt = {
        bind: () => stmt,
        first: async () => null,
        all: async () => ({}) as { results: never[] },
        run: async () => ({ success: true, meta: { changes: 0, last_row_id: 0 } }),
      };
      return stmt;
    },
    exec: async () => ({ count: 0, duration: 0 }),
  } as unknown as DbCtx["db"],
});

describe("schemaAliases branch recovery", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
  }, 30000);

  it("getById (default, not includeDeleted) returns active row but null for soft-deleted", async () => {
    await insert(env.ctx, {
      id: "a-active",
      revisionId: "rev1",
      stableKey: asStableKey("full_name"),
      aliasQuestionId: "qA",
      aliasLabel: "A",
      source: "manual",
      resolvedBy: null,
      resolvedAt: "2026-05-01T00:00:00.000Z",
    });
    // active read via default options (exercises L106 cond#1 false-of-includeDeleted)
    const active = await getById(env.ctx, "a-active");
    expect(active?.id).toBe("a-active");

    // soft-delete the row then confirm default getById hides it, includeDeleted shows it.
    await env.db
      .prepare("UPDATE schema_aliases SET deleted_at = '2026-05-02T00:00:00.000Z' WHERE id = ?1")
      .bind("a-active")
      .run();
    expect(await getById(env.ctx, "a-active")).toBeNull();
    expect((await getById(env.ctx, "a-active", { includeDeleted: true }))?.id).toBe("a-active");
  });

  it("findActiveByStableKey returns mapped rows and empty fallback", async () => {
    await insert(env.ctx, {
      id: "a1",
      revisionId: "rev1",
      stableKey: asStableKey("occupation"),
      aliasQuestionId: "qb",
      aliasLabel: null,
      source: "auto",
      resolvedBy: null,
      resolvedAt: "2026-05-01T00:00:00.000Z",
    });
    const rows = await findActiveByStableKey(env.ctx, "occupation");
    expect(rows.map((r) => r.id)).toEqual(["a1"]);
    // no match -> empty array (D1 results path)
    expect(await findActiveByStableKey(env.ctx, "no_such_key")).toEqual([]);
    // stub yields missing `results` -> exercises `?? []` fallback (L121 branch#1)
    expect(await findActiveByStableKey(stubNoResultsCtx(), "anything")).toEqual([]);
  });

  it("listRecentResolvedAliases computes affected_response_count and falls back to []", async () => {
    await insert(env.ctx, {
      id: "a-resolved",
      revisionId: "rev1",
      stableKey: asStableKey("full_name"),
      aliasQuestionId: "qc",
      aliasLabel: "Name",
      source: "manual",
      resolvedBy: "admin@example.com",
      resolvedAt: "2026-05-03T00:00:00.000Z",
    });
    // two responses each with a full_name field -> affected_response_count = 2 (L144/L146)
    // (response_fields PK is (response_id, stable_key) so the count needs two responses)
    await env.db
      .prepare(
        `INSERT INTO member_responses (response_id, form_id, revision_id, schema_hash, response_email, search_text, submitted_at, answers_json)
         VALUES ('rr1','f1','rev1','h','a@x.com','','2026-01-01T00:00:00.000Z','{}')`,
      )
      .run();
    await env.db
      .prepare(
        `INSERT INTO member_responses (response_id, form_id, revision_id, schema_hash, response_email, search_text, submitted_at, answers_json)
         VALUES ('rr2','f1','rev1','h','b@x.com','','2026-01-02T00:00:00.000Z','{}')`,
      )
      .run();
    await env.db
      .prepare(
        "INSERT INTO response_fields (response_id, stable_key, value_json) VALUES ('rr1','full_name', json_quote('x'))",
      )
      .run();
    await env.db
      .prepare(
        "INSERT INTO response_fields (response_id, stable_key, value_json) VALUES ('rr2','full_name', json_quote('y'))",
      )
      .run();

    const rows = await listRecentResolvedAliases(env.ctx, 10);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.affectedResponseCount).toBe(2);

    // stub: missing results -> `?? []` fallback
    expect(await listRecentResolvedAliases(stubNoResultsCtx(), 10)).toEqual([]);
  });

  it("findRevisionStableKeyCollisions returns other active questionIds and empty fallback", async () => {
    // The partial UNIQUE index (revision_id, stable_key WHERE deleted_at IS NULL)
    // permits at most one active row per (revision, stable_key). To produce a
    // collision row distinct from the excluded questionId, insert one active alias
    // and query excluding a different (self) questionId.
    await insert(env.ctx, {
      id: "c2",
      revisionId: "revX",
      stableKey: asStableKey("full_name"),
      aliasQuestionId: "qx2",
      aliasLabel: null,
      source: "manual",
      resolvedBy: null,
      resolvedAt: "2026-05-01T00:00:00.000Z",
    });
    // querying for collisions excluding qx_self -> finds qx2 (results non-empty, L162 map).
    const collisions = await findRevisionStableKeyCollisions(env.ctx, "revX", "full_name", "qx_self");
    expect(collisions).toEqual(["qx2"]);
    // excluding qx2 itself -> no other rows.
    expect(await findRevisionStableKeyCollisions(env.ctx, "revX", "full_name", "qx2")).toEqual([]);
    // stub missing results -> `?? []` (L162 branch#1)
    expect(
      await findRevisionStableKeyCollisions(stubNoResultsCtx(), "revX", "full_name", "qx1"),
    ).toEqual([]);
  });

  it("insertManualAlias returns existing when stable_key matches, throws on collision", async () => {
    const first = await insertManualAlias(env.ctx, {
      revisionId: "revM",
      stableKey: asStableKey("full_name"),
      aliasQuestionId: "qm",
      aliasLabel: "Name",
      resolvedBy: null,
    });
    // same questionId + same stableKey -> existing returned (L197 true, L198 true)
    const again = await insertManualAlias(env.ctx, {
      revisionId: "revM",
      stableKey: asStableKey("full_name"),
      aliasQuestionId: "qm",
      aliasLabel: "Name",
      resolvedBy: null,
    });
    expect(again.id).toBe(first.id);

    // same questionId + different stableKey -> stable_key_collision (L198 false)
    await expect(
      insertManualAlias(env.ctx, {
        revisionId: "revM",
        stableKey: asStableKey("occupation"),
        aliasQuestionId: "qm",
        aliasLabel: "Name",
        resolvedBy: null,
      }),
    ).rejects.toThrow(/stable_key_collision/);
  });

  it("update throws for missing id (L260)", async () => {
    await expect(update(env.ctx, "ghost-id", { aliasLabel: "x" })).rejects.toThrow(/not found/);
  });

  it("update coalesces undefined patch fields to current values (L270/272/273/275)", async () => {
    await insert(env.ctx, {
      id: "u1",
      revisionId: "rev1",
      stableKey: asStableKey("full_name"),
      aliasQuestionId: "qu",
      aliasLabel: "Original",
      source: "manual",
      resolvedBy: "first@example.com",
      resolvedAt: "2026-05-01T00:00:00.000Z",
    });

    // patch only stableKey; aliasLabel/source/resolvedBy/resolvedAt omitted -> keep current.
    const kept = await update(env.ctx, "u1", { stableKey: asStableKey("occupation") });
    expect(kept.stableKey).toBe("occupation");
    expect(kept.aliasLabel).toBe("Original");
    expect(kept.resolvedBy).toBe("first@example.com");
    expect(kept.resolvedAt).toBe("2026-05-01T00:00:00.000Z");

    // explicit null aliasLabel + explicit null resolvedBy -> nulls applied;
    // resolvedAt explicit null -> coalesced back to current (L273 branch#1 / L275).
    const nulled = await update(env.ctx, "u1", {
      aliasLabel: null,
      resolvedBy: null,
      resolvedAt: null,
    });
    expect(nulled.aliasLabel).toBeNull();
    expect(nulled.resolvedBy).toBeNull();
    expect(nulled.resolvedAt).toBe("2026-05-01T00:00:00.000Z");
  });

  it("findAliasByQuestionId returns null when not found", async () => {
    expect(await findAliasByQuestionId(env.ctx, "nope")).toBeNull();
    expect(await findAliasByQuestionId(env.ctx, "nope", "rev1")).toBeNull();
  });
});
