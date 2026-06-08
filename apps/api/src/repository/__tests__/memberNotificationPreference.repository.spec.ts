// @vitest-environment node
// Issue #55: member_status.notification_opt_out repository
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "./_setup";
import {
  loadNotificationOptOut,
  updateNotificationOptOut,
} from "../memberNotificationPreference";

describe("memberNotificationPreference", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
  });

  const seedIdentity = async (memberId: string) => {
    await env.db
      .prepare(
        `INSERT INTO member_identities
          (member_id, response_email, current_response_id, first_response_id, last_submitted_at, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?3, ?4, ?4, ?4)`,
      )
      .bind(memberId, `${memberId}@example.com`, `resp_${memberId}`, "2026-05-23T00:00:00Z")
      .run();
  };

  it("行が存在しない member は false を返す", async () => {
    expect(await loadNotificationOptOut(env.ctx, "m_missing")).toBe(false);
  });

  it("update → load で値が永続化される (true / false 往復)", async () => {
    await seedIdentity("m_x");
    await updateNotificationOptOut(env.ctx, {
      memberId: "m_x",
      notificationOptOut: true,
      updatedBy: "admin@example.com",
      updatedAt: "2026-05-23T00:00:00Z",
    });
    expect(await loadNotificationOptOut(env.ctx, "m_x")).toBe(true);

    await updateNotificationOptOut(env.ctx, {
      memberId: "m_x",
      notificationOptOut: false,
      updatedBy: "admin@example.com",
      updatedAt: "2026-05-23T00:01:00Z",
    });
    expect(await loadNotificationOptOut(env.ctx, "m_x")).toBe(false);
  });
});
