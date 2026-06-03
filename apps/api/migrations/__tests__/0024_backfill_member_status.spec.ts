// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { setupD1 } from "../../src/repository/__tests__/_setup";

const migrationSql = readFileSync(
  join(process.cwd(), "apps/api/migrations/0024_backfill_member_status.sql"),
  "utf8",
)
  .replace(/^--.*$/gm, "")
  .replace(/\s+/g, " ")
  .trim();

describe("0024_backfill_member_status", () => {
  it("member_identities に対する orphan member_status を既定値で backfill し冪等", async () => {
    const env = await setupD1();
    await env.db
      .prepare(
        `INSERT INTO member_identities
          (member_id, response_email, current_response_id, first_response_id, last_submitted_at)
         VALUES ('m-orphan', 'orphan@example.com', 'r-orphan', 'r-orphan', '2026-06-02T00:00:00Z')`,
      )
      .run();

    await env.db.exec(migrationSql);
    await env.db.exec(migrationSql);

    const rows = await env.db
      .prepare("SELECT * FROM member_status WHERE member_id = 'm-orphan'")
      .all();

    expect(rows.results).toHaveLength(1);
    expect(rows.results[0]).toMatchObject({
      member_id: "m-orphan",
      public_consent: "unknown",
      rules_consent: "unknown",
      publish_state: "member_only",
      is_deleted: 0,
    });
  });
});
