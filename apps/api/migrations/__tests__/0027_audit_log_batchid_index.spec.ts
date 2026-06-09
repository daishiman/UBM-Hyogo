// @vitest-environment node
import { describe, expect, it } from "vitest";
import { setupD1 } from "../../src/repository/__tests__/_setup";

describe("0027_audit_log_batchid_index", () => {
  it("adds a generated batch_id column and an index-backed lookup", async () => {
    const env = await setupD1();

    const columns = await env.db
      .prepare("PRAGMA table_xinfo(audit_log)")
      .all<{ name: string; hidden: number }>();
    expect(columns.results ?? []).toContainEqual(
      expect.objectContaining({ name: "batch_id", hidden: 2 }),
    );

    const indexes = await env.db
      .prepare("PRAGMA index_list(audit_log)")
      .all<{ name: string }>();
    expect((indexes.results ?? []).map((row) => row.name)).toContain(
      "idx_audit_log_batch_id",
    );

    await env.db
      .prepare(
        "INSERT INTO audit_log (audit_id, actor_email, action, target_type, target_id, before_json, after_json, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
      )
      .bind(
        "audit_1128_after",
        "owner@example.com",
        "admin.member.tag_assigned",
        "member",
        "m_after",
        null,
        JSON.stringify({ tagId: "tag_a", batchId: "batch-1128" }),
        "2026-06-07T00:00:00.000Z",
      )
      .run();
    await env.db
      .prepare(
        "INSERT INTO audit_log (audit_id, actor_email, action, target_type, target_id, before_json, after_json, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
      )
      .bind(
        "audit_1128_before",
        "owner@example.com",
        "admin.member.tag_unassigned",
        "member",
        "m_before",
        JSON.stringify({ tagId: "tag_b", batchId: "batch-1128" }),
        "{broken",
        "2026-06-06T00:00:00.000Z",
      )
      .run();

    const rows = await env.db
      .prepare(
        "SELECT audit_id AS auditId, batch_id AS batchId FROM audit_log WHERE batch_id = ?1 ORDER BY created_at DESC",
      )
      .bind("batch-1128")
      .all<{ auditId: string; batchId: string }>();
    expect(rows.results).toEqual([
      { auditId: "audit_1128_after", batchId: "batch-1128" },
      { auditId: "audit_1128_before", batchId: "batch-1128" },
    ]);

    const plan = await env.db
      .prepare(
        "EXPLAIN QUERY PLAN SELECT audit_id FROM audit_log WHERE batch_id = ?1 ORDER BY created_at DESC, audit_id DESC LIMIT ?2",
      )
      .bind("batch-1128", 10)
      .all<{ detail: string }>();
    const details = (plan.results ?? []).map((row) => row.detail).join("\n");
    expect(details).toContain("idx_audit_log_batch_id");
    expect(details).not.toMatch(/\bSCAN audit_log\b/);
  });
});
