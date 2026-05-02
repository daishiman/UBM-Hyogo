// @vitest-environment node
// 04b-followup-004: admin queue resolve workflow route tests
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "../../repository/__tests__/_setup";
import { createAdminRequestsRoute } from "./requests";
import { adminAuthHeader, TEST_AUTH_SECRET } from "./_test-auth";
import * as adminNotes from "../../repository/adminNotes";
import { adminEmail, asMemberId } from "../../repository/_shared/brand";

const makeEnv = (env: InMemoryD1) => ({
  DB: env.db as unknown as D1Database,
  AUTH_SECRET: TEST_AUTH_SECRET,
});

const seedMember = async (env: InMemoryD1, memberId: string) => {
  await env.db
    .prepare(
      `INSERT INTO member_identities
        (member_id, response_email, current_response_id, first_response_id, last_submitted_at, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?3, ?4, ?4, ?4)`,
    )
    .bind(
      memberId,
      `${memberId}@example.com`,
      `resp_${memberId}`,
      "2026-04-01T00:00:00Z",
    )
    .run();
  await env.db
    .prepare(
      `INSERT INTO member_status (member_id, public_consent, rules_consent, publish_state, is_deleted, updated_at)
       VALUES (?1, 'consented', 'consented', 'public', 0, ?2)`,
    )
    .bind(memberId, "2026-04-01T00:00:00Z")
    .run();
};

const createPendingRequest = async (
  env: InMemoryD1,
  memberId: string,
  noteType: "visibility_request" | "delete_request",
  payload: Record<string, unknown>,
) => {
  return adminNotes.create(env.ctx, {
    memberId: asMemberId(memberId),
    body: JSON.stringify({ reason: null, payload }),
    createdBy: adminEmail("system@admin.local"),
    noteType,
  });
};

describe("admin requests route — GET /admin/requests", () => {
  let env: InMemoryD1;
  let app: ReturnType<typeof createAdminRequestsRoute>;
  beforeEach(async () => {
    env = await setupD1();
    app = createAdminRequestsRoute();
    await seedMember(env, "m_alice");
    await seedMember(env, "m_bob");
  });

  it("TC-01: 認証なしで 401", async () => {
    const res = await app.request(
      "/requests?status=pending&type=visibility_request",
      {},
      makeEnv(env),
    );
    expect(res.status).toBe(401);
  });

  it("TC-02: type=visibility_request の pending を古い順で返す", async () => {
    await createPendingRequest(env, "m_alice", "visibility_request", {
      desiredState: "hidden",
    });
    await createPendingRequest(env, "m_bob", "delete_request", {});
    const headers = await adminAuthHeader();
    const res = await app.request(
      "/requests?status=pending&type=visibility_request",
      { headers },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      items: Array<{ noteType: string; memberId: string; requestStatus: string }>;
      appliedFilters: { status: string; type: string };
    };
    expect(body.ok).toBe(true);
    expect(body.appliedFilters).toEqual({
      status: "pending",
      type: "visibility_request",
    });
    expect(body.items).toHaveLength(1);
    expect(body.items[0]!.noteType).toBe("visibility_request");
    expect(body.items[0]!.requestStatus).toBe("pending");
    expect(body.items[0]!.memberId).toBe("m_alice");
  });

  it("invalid query (type 不在) で 400", async () => {
    const headers = await adminAuthHeader();
    const res = await app.request(
      "/requests?status=pending",
      { headers },
      makeEnv(env),
    );
    expect(res.status).toBe(400);
  });
});

describe("admin requests route — POST /admin/requests/:noteId/resolve", () => {
  let env: InMemoryD1;
  let app: ReturnType<typeof createAdminRequestsRoute>;
  beforeEach(async () => {
    env = await setupD1();
    app = createAdminRequestsRoute();
    await seedMember(env, "m_alice");
  });

  it("TC-04: visibility_request approve で publish_state が更新される", async () => {
    const note = await createPendingRequest(env, "m_alice", "visibility_request", {
      desiredState: "hidden",
    });
    const headers = await adminAuthHeader();
    const res = await app.request(
      `/requests/${note.noteId}/resolve`,
      {
        method: "POST",
        headers: { ...headers, "content-type": "application/json" },
        body: JSON.stringify({ resolution: "approve", resolutionNote: "OK" }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      requestStatus: string;
      memberAfter: { publishState: string; isDeleted: boolean };
    };
    expect(body.ok).toBe(true);
    expect(body.requestStatus).toBe("resolved");
    expect(body.memberAfter.publishState).toBe("hidden");
    expect(body.memberAfter.isDeleted).toBe(false);

    const updated = await adminNotes.findById(env.ctx, note.noteId);
    expect(updated?.requestStatus).toBe("resolved");
    expect(updated?.resolvedByAdminId).toBeTruthy();
    expect(updated?.body).toContain("[resolved] OK");
    const audit = await env.db
      .prepare(
        "SELECT action, target_type AS targetType, target_id AS targetId, after_json AS afterJson FROM audit_log WHERE target_id = ?1",
      )
      .bind("m_alice")
      .first<{
        action: string;
        targetType: string;
        targetId: string;
        afterJson: string;
      }>();
    expect(audit?.action).toBe("admin.request.approve");
    expect(audit?.targetType).toBe("member");
    expect(audit?.targetId).toBe("m_alice");
    expect(JSON.parse(audit?.afterJson ?? "{}")).toMatchObject({
      noteId: note.noteId,
      resolution: "approve",
    });
  });

  it("TC-05: delete_request approve で is_deleted=1", async () => {
    const note = await createPendingRequest(env, "m_alice", "delete_request", {});
    const headers = await adminAuthHeader();
    const res = await app.request(
      `/requests/${note.noteId}/resolve`,
      {
        method: "POST",
        headers: { ...headers, "content-type": "application/json" },
        body: JSON.stringify({ resolution: "approve" }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      memberAfter: { isDeleted: boolean; publishState: string };
    };
    expect(body.memberAfter.isDeleted).toBe(true);
    expect(body.memberAfter.publishState).toBe("public"); // 物理削除しない
  });

  it("TC-05b: member_status がない approve は note を resolved にしない", async () => {
    await env.db
      .prepare("DELETE FROM member_status WHERE member_id = ?1")
      .bind("m_alice")
      .run();
    const note = await createPendingRequest(env, "m_alice", "visibility_request", {
      desiredState: "hidden",
    });
    const headers = await adminAuthHeader();
    const res = await app.request(
      `/requests/${note.noteId}/resolve`,
      {
        method: "POST",
        headers: { ...headers, "content-type": "application/json" },
        body: JSON.stringify({ resolution: "approve" }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("member_status_not_found");
    const unchanged = await adminNotes.findById(env.ctx, note.noteId);
    expect(unchanged?.requestStatus).toBe("pending");
  });

  it("TC-06: reject では member_status を変更せず note のみ rejected", async () => {
    const note = await createPendingRequest(env, "m_alice", "visibility_request", {
      desiredState: "hidden",
    });
    const headers = await adminAuthHeader();
    const res = await app.request(
      `/requests/${note.noteId}/resolve`,
      {
        method: "POST",
        headers: { ...headers, "content-type": "application/json" },
        body: JSON.stringify({ resolution: "reject", resolutionNote: "理由" }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      requestStatus: string;
      memberAfter: { publishState: string; isDeleted: boolean };
    };
    expect(body.requestStatus).toBe("rejected");
    expect(body.memberAfter.publishState).toBe("public");
    expect(body.memberAfter.isDeleted).toBe(false);
    const updated = await adminNotes.findById(env.ctx, note.noteId);
    expect(updated?.requestStatus).toBe("rejected");
    expect(updated?.body).toContain("[rejected] 理由");
  });

  it("TC-08: 二重 resolve は 409 で拒否", async () => {
    const note = await createPendingRequest(env, "m_alice", "visibility_request", {
      desiredState: "hidden",
    });
    const headers = await adminAuthHeader();
    const first = await app.request(
      `/requests/${note.noteId}/resolve`,
      {
        method: "POST",
        headers: { ...headers, "content-type": "application/json" },
        body: JSON.stringify({ resolution: "approve" }),
      },
      makeEnv(env),
    );
    expect(first.status).toBe(200);
    const second = await app.request(
      `/requests/${note.noteId}/resolve`,
      {
        method: "POST",
        headers: { ...headers, "content-type": "application/json" },
        body: JSON.stringify({ resolution: "approve" }),
      },
      makeEnv(env),
    );
    expect(second.status).toBe(409);
    const body = (await second.json()) as { error: string; currentStatus: string };
    expect(body.error).toBe("already_resolved");
    expect(body.currentStatus).toBe("resolved");
  });

  it("TC-09: resolutionNote > 500 で 400", async () => {
    const note = await createPendingRequest(env, "m_alice", "visibility_request", {
      desiredState: "hidden",
    });
    const headers = await adminAuthHeader();
    const res = await app.request(
      `/requests/${note.noteId}/resolve`,
      {
        method: "POST",
        headers: { ...headers, "content-type": "application/json" },
        body: JSON.stringify({
          resolution: "approve",
          resolutionNote: "あ".repeat(501),
        }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(400);
  });

  it("TC-10: unknown noteId で 404", async () => {
    const headers = await adminAuthHeader();
    const res = await app.request(
      `/requests/no_such_note/resolve`,
      {
        method: "POST",
        headers: { ...headers, "content-type": "application/json" },
        body: JSON.stringify({ resolution: "approve" }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(404);
  });

  it("visibility_request approve 時 desiredState 不正で 422", async () => {
    const note = await createPendingRequest(env, "m_alice", "visibility_request", {
      desiredState: "bogus",
    });
    const headers = await adminAuthHeader();
    const res = await app.request(
      `/requests/${note.noteId}/resolve`,
      {
        method: "POST",
        headers: { ...headers, "content-type": "application/json" },
        body: JSON.stringify({ resolution: "approve" }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(422);
  });
});
