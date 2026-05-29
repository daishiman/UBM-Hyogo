// @vitest-environment node
import { beforeEach, describe, expect, it } from "vitest";
import { setupD1, type InMemoryD1 } from "./_setup";
import {
  findAutoLinkCandidateByEmail,
  tryAutoLinkIdentityByEmail,
} from "../identities";
import { asResponseEmail } from "../_shared/brand";

const insertResponse = async (
  env: InMemoryD1,
  responseId: string,
  email: string | null,
  submittedAt: string,
) => {
  await env.db
    .prepare(
      `INSERT INTO member_responses
        (response_id, form_id, revision_id, schema_hash, response_email, submitted_at, answers_json)
       VALUES (?1, 'form-1', 'rev-1', 'hash-1', ?2, ?3, '{}')`,
    )
    .bind(responseId, email, submittedAt)
    .run();
};

describe("identity auto-link repository", () => {
  let env: InMemoryD1;

  beforeEach(async () => {
    env = await setupD1();
  }, 30000);

  it("builds a candidate from response history and picks first/current response deterministically", async () => {
    await insertResponse(env, "r-old", "User@Example.COM", "2026-05-01T00:00:00Z");
    await insertResponse(env, "r-new", "user@example.com", "2026-05-02T00:00:00Z");
    await env.db
      .prepare(
        "INSERT INTO tag_assignment_queue (queue_id, member_id, response_id) VALUES ('q1', 'm_existing', 'r-old')",
      )
      .run();

    const candidate = await findAutoLinkCandidateByEmail(
      env.ctx,
      asResponseEmail("user@example.com"),
    );

    expect(candidate).toMatchObject({
      member_id: "m_existing",
      response_email: "user@example.com",
      current_response_id: "r-new",
      first_response_id: "r-old",
      last_submitted_at: "2026-05-02T00:00:00Z",
    });
  });

  it("creates an identity once and returns the same row on repeated auto-link", async () => {
    await insertResponse(env, "r-1", "new@example.com", "2026-05-01T00:00:00Z");

    const first = await tryAutoLinkIdentityByEmail(
      env.ctx,
      asResponseEmail("new@example.com"),
    );
    const second = await tryAutoLinkIdentityByEmail(
      env.ctx,
      asResponseEmail("new@example.com"),
    );
    const count = await env.db
      .prepare("SELECT COUNT(*) AS n FROM member_identities")
      .first<{ n: number }>();

    expect(first?.response_email).toBe("new@example.com");
    expect(second?.member_id).toBe(first?.member_id);
    expect(count?.n).toBe(1);
  });

  it("does not overwrite an existing identity for the same email", async () => {
    await insertResponse(env, "r-1", "linked@example.com", "2026-05-01T00:00:00Z");
    await env.db
      .prepare(
        `INSERT INTO member_identities
          (member_id, response_email, current_response_id, first_response_id, last_submitted_at)
         VALUES ('m_existing', 'linked@example.com', 'r-1', 'r-1', '2026-05-01T00:00:00Z')`,
      )
      .run();

    const identity = await tryAutoLinkIdentityByEmail(
      env.ctx,
      asResponseEmail("linked@example.com"),
    );

    expect(identity?.member_id).toBe("m_existing");
  });
});
