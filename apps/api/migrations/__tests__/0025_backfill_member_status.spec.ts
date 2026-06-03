// @vitest-environment node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { setupD1 } from "../../src/repository/__tests__/_setup";

// cwd に依存せずテストファイル基準で解決する（api-unit シャードは cwd=apps/api で
// 走るため process.cwd() 起点だとパスが二重化して ENOENT になる）
const migrationSql = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "..", "0025_backfill_member_status.sql"),
  "utf8",
)
  .replace(/^--.*$/gm, "")
  .replace(/\s+/g, " ")
  .trim();

describe("0025_backfill_member_status", () => {
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
