// @vitest-environment node
// Branch-coverage recovery for src/routes/admin/requests.ts.
// Targets uncovered branches (decode/sanitize/parse fallbacks, alternate
// status/type enums, empty-list fallback, member-summary fallback, unsupported
// note type 400, best-effort enqueue non-duplicate failure path).
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "../../repository/__tests__/_setup";
import { createAdminRequestsRoute } from "./requests";
import { adminAuthHeader, TEST_AUTH_SECRET } from "./_test-auth";
import { adminEmail, asMemberId } from "../../repository/_shared/brand";
import { createWriteTagNoteProviderBundle } from "../../middleware/repository-providers";
import type { NotificationOutboxRepository } from "../../repository/_shared/provider-context";

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
    .bind(memberId, `${memberId}@example.com`, `resp_${memberId}`, "2026-04-01T00:00:00Z")
    .run();
  await env.db
    .prepare(
      `INSERT INTO member_status (member_id, public_consent, rules_consent, publish_state, is_deleted, updated_at)
       VALUES (?1, 'consented', 'consented', 'public', 0, ?2)`,
    )
    .bind(memberId, "2026-04-01T00:00:00Z")
    .run();
};

// member_identities だけ用意し member_status を作らない (一覧で summary fallback を踏む)
const seedIdentityOnly = async (env: InMemoryD1, memberId: string) => {
  await env.db
    .prepare(
      `INSERT INTO member_identities
        (member_id, response_email, current_response_id, first_response_id, last_submitted_at, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?3, ?4, ?4, ?4)`,
    )
    .bind(memberId, `${memberId}@example.com`, `resp_${memberId}`, "2026-04-01T00:00:00Z")
    .run();
};

const createRequest = async (
  env: InMemoryD1,
  memberId: string,
  noteType: "visibility_request" | "delete_request",
  body: string,
) => {
  return createWriteTagNoteProviderBundle(env.ctx).adminNotesProvider.create({
    memberId: asMemberId(memberId),
    body,
    createdBy: adminEmail("system@admin.local"),
    noteType,
  });
};

describe("admin requests route — GET branch coverage", () => {
  let env: InMemoryD1;
  let app: ReturnType<typeof createAdminRequestsRoute>;
  beforeEach(async () => {
    env = await setupD1();
    app = createAdminRequestsRoute();
    await seedMember(env, "m_alice");
  });

  it("GET: 空 pending 一覧は items=[] / nextCursor=null (memberIds 空分岐)", async () => {
    const headers = await adminAuthHeader();
    const res = await app.request(
      "/requests?type=visibility_request",
      { headers },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      items: unknown[];
      nextCursor: string | null;
      appliedFilters: { status: string; type: string };
    };
    expect(body.ok).toBe(true);
    expect(body.items).toEqual([]);
    expect(body.nextCursor).toBeNull();
    // status 省略時のデフォルト "pending"
    expect(body.appliedFilters.status).toBe("pending");
  });

  it("GET: 正しい base64url だが createdAt/noteId 欠落の cursor は 400 (decodeCursor null)", async () => {
    const headers = await adminAuthHeader();
    // base64url({"foo":"bar"}) — 必須キー欠落で decodeCursor が null
    const badCursor = btoa(JSON.stringify({ foo: "bar" }))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
    const res = await app.request(
      `/requests?type=visibility_request&cursor=${badCursor}`,
      { headers },
      makeEnv(env),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("invalid cursor");
  });

  it("GET: 壊れた base64url cursor も 400 (decodeCursor catch)", async () => {
    const headers = await adminAuthHeader();
    const res = await app.request(
      `/requests?type=visibility_request&cursor=%%%not-base64%%%`,
      { headers },
      makeEnv(env),
    );
    expect(res.status).toBe(400);
  });

  it("GET: status=resolved の絞り込み (StatusZ 別 enum 値)", async () => {
    // pending を 1 件作って resolve 済みにする
    const note = await createRequest(
      env,
      "m_alice",
      "visibility_request",
      JSON.stringify({ reason: null, payload: { desiredState: "hidden" } }),
    );
    const headers = await adminAuthHeader();
    await app.request(
      `/requests/${note.noteId}/resolve`,
      {
        method: "POST",
        headers: { ...headers, "content-type": "application/json" },
        body: JSON.stringify({ resolution: "approve" }),
      },
      makeEnv(env),
    );
    const res = await app.request(
      "/requests?status=resolved&type=visibility_request",
      { headers },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      items: Array<{ requestStatus: string }>;
      appliedFilters: { status: string };
    };
    expect(body.appliedFilters.status).toBe("resolved");
    expect(body.items).toHaveLength(1);
    expect(body.items[0]!.requestStatus).toBe("resolved");
  });

  it("GET: member_status が無い行は summary fallback (publishState=unknown / isDeleted=false)", async () => {
    await seedIdentityOnly(env, "m_ghost");
    await createRequest(
      env,
      "m_ghost",
      "visibility_request",
      JSON.stringify({ reason: null, payload: { desiredState: "hidden" } }),
    );
    const headers = await adminAuthHeader();
    const res = await app.request(
      "/requests?type=visibility_request",
      { headers },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      items: Array<{
        memberId: string;
        memberSummary: { publishState: string; isDeleted: boolean; publicHandle: string | null };
      }>;
    };
    expect(body.items).toHaveLength(1);
    const summary = body.items[0]!.memberSummary;
    expect(summary.publishState).toBe("unknown");
    expect(summary.isDeleted).toBe(false);
    expect(summary.publicHandle).toBeNull();
  });

  it("GET: payload の PII キー除去・配列・ネスト・null を sanitize (sanitizePayload 全分岐)", async () => {
    // body.reason を string にし parseNoteBody の reason 分岐も踏む
    await createRequest(
      env,
      "m_alice",
      "visibility_request",
      JSON.stringify({
        reason: "希望理由",
        payload: {
          desiredState: "hidden",
          email: "leak@example.com", // PII → 除去
          name: "氏名", // PII → 除去
          tags: ["a", "b"], // 配列
          nested: { keep: 1, phone: "090" }, // ネスト + PII 除去
          maybe: null, // null
        },
      }),
    );
    const headers = await adminAuthHeader();
    const res = await app.request(
      "/requests?type=visibility_request",
      { headers },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      items: Array<{ requestedReason: string | null; requestedPayload: Record<string, unknown> }>;
    };
    const item = body.items[0]!;
    expect(item.requestedReason).toBe("希望理由");
    const p = item.requestedPayload as {
      desiredState: string;
      tags: string[];
      nested: Record<string, unknown>;
      maybe: unknown;
      email?: unknown;
      name?: unknown;
    };
    expect(p.desiredState).toBe("hidden");
    expect(p.email).toBeUndefined();
    expect(p.name).toBeUndefined();
    expect(p.tags).toEqual(["a", "b"]);
    expect(p.nested).toEqual({ keep: 1 }); // phone 除去
    expect(p.maybe).toBeNull();
  });

  it("GET: body が JSON 配列 (非オブジェクト) の note は reason/payload とも null (parseNoteBody fallthrough)", async () => {
    await createRequest(env, "m_alice", "visibility_request", JSON.stringify([1, 2, 3]));
    const headers = await adminAuthHeader();
    const res = await app.request(
      "/requests?type=visibility_request",
      { headers },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      items: Array<{ requestedReason: string | null; requestedPayload: unknown }>;
    };
    expect(body.items[0]!.requestedReason).toBeNull();
    expect(body.items[0]!.requestedPayload).toBeNull();
  });

  it("GET: body が非 JSON 文字列の note も null fallback (parseNoteBody catch)", async () => {
    await createRequest(env, "m_alice", "delete_request", "not-json-at-all");
    const headers = await adminAuthHeader();
    const res = await app.request(
      "/requests?type=delete_request",
      { headers },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      items: Array<{ requestedReason: string | null; requestedPayload: unknown }>;
    };
    expect(body.items[0]!.requestedReason).toBeNull();
    expect(body.items[0]!.requestedPayload).toBeNull();
  });
});

describe("admin requests route — POST resolve branch coverage", () => {
  let env: InMemoryD1;
  let app: ReturnType<typeof createAdminRequestsRoute>;
  beforeEach(async () => {
    env = await setupD1();
    app = createAdminRequestsRoute();
    await seedMember(env, "m_alice");
  });

  it("POST: body が非 JSON で 400 (invalid json catch)", async () => {
    const note = await createRequest(
      env,
      "m_alice",
      "visibility_request",
      JSON.stringify({ reason: null, payload: { desiredState: "hidden" } }),
    );
    const headers = await adminAuthHeader();
    const res = await app.request(
      `/requests/${note.noteId}/resolve`,
      {
        method: "POST",
        headers: { ...headers, "content-type": "application/json" },
        body: "{not json",
      },
      makeEnv(env),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("invalid json");
  });

  it("POST: note_type=general の note は unsupported note type で 400", async () => {
    // general 行を request_status='pending' で直接 INSERT し findById は通すが type 不一致
    const noteId = "gen_note_1";
    await env.db
      .prepare(
        `INSERT INTO admin_member_notes (note_id, member_id, body, note_type, request_status, created_by, updated_by, created_at, updated_at)
         VALUES (?1, ?2, ?3, 'general', 'pending', ?4, ?4, ?5, ?5)`,
      )
      .bind(noteId, "m_alice", "{}", "system@admin.local", "2026-04-01T00:00:00Z")
      .run();
    const headers = await adminAuthHeader();
    const res = await app.request(
      `/requests/${noteId}/resolve`,
      {
        method: "POST",
        headers: { ...headers, "content-type": "application/json" },
        body: JSON.stringify({ resolution: "approve" }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("unsupported note type");
  });

  it("POST: 既に resolved 済みの note を再度 resolve すると 409 (status guard) + currentStatus", async () => {
    const note = await createRequest(
      env,
      "m_alice",
      "delete_request",
      JSON.stringify({ reason: null, payload: {} }),
    );
    const headers = await adminAuthHeader();
    const first = await app.request(
      `/requests/${note.noteId}/resolve`,
      {
        method: "POST",
        headers: { ...headers, "content-type": "application/json" },
        body: JSON.stringify({ resolution: "reject" }),
      },
      makeEnv(env),
    );
    expect(first.status).toBe(200);
    const second = await app.request(
      `/requests/${note.noteId}/resolve`,
      {
        method: "POST",
        headers: { ...headers, "content-type": "application/json" },
        body: JSON.stringify({ resolution: "reject" }),
      },
      makeEnv(env),
    );
    expect(second.status).toBe(409);
    const body = (await second.json()) as { error: string; currentStatus: string };
    expect(body.error).toBe("already_resolved");
    expect(body.currentStatus).toBe("rejected");
  });

  it("POST: visibility_request で payload に desiredState 無し → 422 (inferDesiredPublishState null)", async () => {
    // payload はオブジェクトだが desiredState 欠落 (199 の object 分岐 + 201 false)
    const note = await createRequest(
      env,
      "m_alice",
      "visibility_request",
      JSON.stringify({ reason: null, payload: { somethingElse: true } }),
    );
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
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("invalid desiredState in request payload");
  });

  it("POST: visibility_request で payload が非オブジェクト → 422 (inferDesiredPublishState object guard false)", async () => {
    const note = await createRequest(
      env,
      "m_alice",
      "visibility_request",
      JSON.stringify({ reason: null, payload: [1, 2, 3] }),
    );
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

  it("POST: enqueue が non-duplicate 失敗を返しても resolve は 200 (best-effort warn 分岐)", async () => {
    const warnings: Array<{ msg: string; meta?: Record<string, unknown> }> = [];
    const stubOutbox: NotificationOutboxRepository = {
      async enqueue() {
        return { ok: false, reason: "db_error" };
      },
      async findRecipientEmail(memberId: string) {
        return { memberId, responseEmail: `${memberId}@example.com` };
      },
    } as unknown as NotificationOutboxRepository;
    const customApp = createAdminRequestsRoute({
      outboxFactory: () => stubOutbox,
      logger: {
        warn: (msg, meta) =>
          warnings.push(meta === undefined ? { msg } : { msg, meta }),
      },
    });
    const note = await createRequest(
      env,
      "m_alice",
      "visibility_request",
      JSON.stringify({ reason: null, payload: { desiredState: "hidden" } }),
    );
    const headers = await adminAuthHeader();
    const res = await customApp.request(
      `/requests/${note.noteId}/resolve`,
      {
        method: "POST",
        headers: { ...headers, "content-type": "application/json" },
        body: JSON.stringify({ resolution: "approve" }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    // note は resolved に確定
    const updated = await createWriteTagNoteProviderBundle(env.ctx).adminNotesProvider.findById(
      note.noteId,
    );
    expect(updated?.requestStatus).toBe("resolved");
    // 失敗 reason は warn 済み
    expect(warnings.some((w) => w.msg === "notification_enqueue_failed")).toBe(true);
  });

  it("POST: recipient が見つからない (findRecipientEmail null) でも resolve は 200 + missing_email warn", async () => {
    const warnings: string[] = [];
    const stubOutbox: NotificationOutboxRepository = {
      async enqueue() {
        return { ok: true };
      },
      async findRecipientEmail() {
        return null;
      },
    } as unknown as NotificationOutboxRepository;
    const customApp = createAdminRequestsRoute({
      outboxFactory: () => stubOutbox,
      logger: { warn: (msg) => warnings.push(msg) },
    });
    const note = await createRequest(
      env,
      "m_alice",
      "delete_request",
      JSON.stringify({ reason: null, payload: {} }),
    );
    const headers = await adminAuthHeader();
    const res = await customApp.request(
      `/requests/${note.noteId}/resolve`,
      {
        method: "POST",
        headers: { ...headers, "content-type": "application/json" },
        body: JSON.stringify({ resolution: "approve" }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    expect(warnings).toContain("notification_enqueue_skipped");
  });

  it("POST: enqueue が duplicate を返す場合は warn せず 200 (duplicate 例外分岐)", async () => {
    const warnings: string[] = [];
    const stubOutbox: NotificationOutboxRepository = {
      async enqueue() {
        return { ok: false, reason: "duplicate" };
      },
      async findRecipientEmail(memberId: string) {
        return { memberId, responseEmail: `${memberId}@example.com` };
      },
    } as unknown as NotificationOutboxRepository;
    const customApp = createAdminRequestsRoute({
      outboxFactory: () => stubOutbox,
      logger: { warn: (msg) => warnings.push(msg) },
    });
    const note = await createRequest(
      env,
      "m_alice",
      "visibility_request",
      JSON.stringify({ reason: null, payload: { desiredState: "member_only" } }),
    );
    const headers = await adminAuthHeader();
    const res = await customApp.request(
      `/requests/${note.noteId}/resolve`,
      {
        method: "POST",
        headers: { ...headers, "content-type": "application/json" },
        body: JSON.stringify({ resolution: "approve" }),
      },
      makeEnv(env),
    );
    expect(res.status).toBe(200);
    expect(warnings).not.toContain("notification_enqueue_failed");
  });
});
