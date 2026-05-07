// 04b: /me/* contract / authz / integration test
// 不変条件 #4: profile 本文 (response_fields) を変更しない
// 不変条件 #11: path に :memberId を含めず、session 由来 memberId のみ参照
// 不変条件 #12: GET 系 response 型に notes プロパティが現れない

// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "../../repository/__tests__/_setup";
import {
  MEMBER_IDENTITY_1,
  MEMBER_STATUS_CONSENTED,
  MEMBER_RESPONSE_1,
  RESPONSE_FIELDS_R001,
  FIELD_VISIBILITY_M001,
} from "../../repository/__fixtures__/members.fixture";
import { createMeRoute } from "./index";
import {
  __resetRateLimitForTests,
  RATE_LIMIT_MAX,
} from "../../middleware/rate-limit-self-request";
import {
  MeProfileResponseZ,
  MeSessionResponseZ,
  MeQueueAcceptedResponseZ,
  MeAttendancePageResponseZ,
} from "./schemas";
import {
  encodeAttendanceCursor,
  decodeAttendanceCursor,
} from "../../repository/attendance";

const seedMember = async (env: InMemoryD1) => {
  const insert = (table: string, row: Record<string, unknown>) => {
    const cols = Object.keys(row);
    const ph = cols.map((_, i) => `?${i + 1}`).join(",");
    return env.db
      .prepare(
        `INSERT INTO ${table} (${cols.join(",")}) VALUES (${ph})`,
      )
      .bind(...Object.values(row))
      .run();
  };
  await insert("member_identities", MEMBER_IDENTITY_1);
  await insert("member_status", MEMBER_STATUS_CONSENTED);
  await insert("member_responses", MEMBER_RESPONSE_1);
  for (const f of RESPONSE_FIELDS_R001) await insert("response_fields", f);
  for (const v of FIELD_VISIBILITY_M001) await insert("member_field_visibility", v);
};

const buildApp = (env: InMemoryD1, sessionEmail: string | null = "user1@example.com") => {
  const app = createMeRoute({
    resolveSession: async () => {
      if (!sessionEmail) return null;
      return { email: sessionEmail, memberId: "m_001" };
    },
  });
  return {
    app,
    env: { DB: env.db as unknown as D1Database, RESPONDER_URL: "https://example.com/form" },
  };
};

describe("/me/* — member self-service API", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
    __resetRateLimitForTests();
    await seedMember(env);
  });

  describe("GET /me", () => {
    it("AC-1: 未ログインは 401 で memberId を含まない", async () => {
      const { app, env: e } = buildApp(env, null);
      const res = await app.request("/", { method: "GET" }, e);
      expect(res.status).toBe(401);
      const body = await res.text();
      expect(body).not.toContain("m_001");
    });

    it("AC-7: SessionUser と authGateState=active を返す", async () => {
      const { app, env: e } = buildApp(env);
      const res = await app.request("/", { method: "GET" }, e);
      expect(res.status).toBe(200);
      const json = (await res.json()) as unknown;
      const parsed = MeSessionResponseZ.parse(json);
      expect(parsed.user.memberId).toBe("m_001");
      expect(parsed.user.responseId).toBe("r_001");
      expect(parsed.authGateState).toBe("active");
      expect(parsed.user.isAdmin).toBe(false);
    });

    it("AC-7: rules_consent != consented なら authGateState=rules_declined", async () => {
      await env.db
        .prepare(
          "UPDATE member_status SET rules_consent='declined' WHERE member_id='m_001'",
        )
        .run();
      const { app, env: e } = buildApp(env);
      const res = await app.request("/", {}, e);
      expect(res.status).toBe(200);
      const json = (await res.json()) as { authGateState: string };
      expect(json.authGateState).toBe("rules_declined");
    });

    it("F-3: is_deleted=1 は 410 + DELETED", async () => {
      await env.db
        .prepare(
          "UPDATE member_status SET is_deleted=1 WHERE member_id='m_001'",
        )
        .run();
      const { app, env: e } = buildApp(env);
      const res = await app.request("/", {}, e);
      expect(res.status).toBe(410);
      const json = (await res.json()) as { code: string };
      expect(json.code).toBe("DELETED");
    });
  });

  describe("GET /me/profile", () => {
    it("AC-3 / AC-8: MemberProfile + editResponseUrl を返し、notes を含まない", async () => {
      await env.db
        .prepare(
          "INSERT INTO meeting_sessions (session_id, title, held_on, created_by) VALUES ('s_route_me','Route ME','2026-05-06','admin')",
        )
        .run();
      await env.db
        .prepare(
          "INSERT INTO member_attendance (member_id, session_id, assigned_by) VALUES ('m_001','s_route_me','admin')",
        )
        .run();
      const { app, env: e } = buildApp(env);
      const res = await app.request("/profile", {}, e);
      expect(res.status).toBe(200);
      const json = (await res.json()) as Record<string, unknown>;
      const parsed = MeProfileResponseZ.parse(json);
      expect(parsed.profile.memberId).toBe("m_001");
      expect(parsed.editResponseUrl).toBe(
        "https://docs.google.com/forms/edit/r_001",
      );
      expect(parsed.profile.attendance).toEqual([
        { sessionId: "s_route_me", title: "Route ME", heldOn: "2026-05-06" },
      ]);
      // notes leak 0 (#12)
      expect(JSON.stringify(json)).not.toMatch(/"notes"|"adminNotes"/);
    });

    it("F-5: editResponseUrl が null の場合は null を返し fallbackResponderUrl が常に存在", async () => {
      await env.db
        .prepare(
          "UPDATE member_responses SET edit_response_url=NULL WHERE response_id='r_001'",
        )
        .run();
      const { app, env: e } = buildApp(env);
      const res = await app.request("/profile", {}, e);
      const json = (await res.json()) as { editResponseUrl: string | null; fallbackResponderUrl: string };
      expect(json.editResponseUrl).toBeNull();
      expect(json.fallbackResponderUrl).toMatch(/^https?:/);
    });

    it("AC-1: 未ログインは 401", async () => {
      const { app, env: e } = buildApp(env, null);
      const res = await app.request("/profile", {}, e);
      expect(res.status).toBe(401);
    });

    // 06b-followup-001 (#428): server-side pending state の reload 永続性
    it("06b-fu-001: pending が無い場合は pendingRequests={}", async () => {
      const { app, env: e } = buildApp(env);
      const res = await app.request("/profile", {}, e);
      expect(res.status).toBe(200);
      const parsed = MeProfileResponseZ.parse(await res.json());
      expect(parsed.pendingRequests).toEqual({});
    });

    it("06b-fu-001: visibility_request POST 後の reload で pendingRequests.visibility が返る", async () => {
      const { app, env: e } = buildApp(env);
      const post = await app.request(
        "/visibility-request",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ desiredState: "hidden", reason: "一時" }),
        },
        e,
      );
      expect(post.status).toBe(202);
      const accepted = MeQueueAcceptedResponseZ.parse(await post.json());

      const res = await app.request("/profile", {}, e);
      const parsed = MeProfileResponseZ.parse(await res.json());
      expect(parsed.pendingRequests.visibility?.queueId).toBe(accepted.queueId);
      expect(parsed.pendingRequests.visibility?.status).toBe("pending");
      expect(parsed.pendingRequests.visibility?.desiredState).toBe("hidden");
      expect(parsed.pendingRequests.delete).toBeUndefined();
    });

    it("06b-fu-001: delete_request POST 後の reload で pendingRequests.delete が返る", async () => {
      const { app, env: e } = buildApp(env);
      const post = await app.request(
        "/delete-request",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({}),
        },
        e,
      );
      expect(post.status).toBe(202);

      const res = await app.request("/profile", {}, e);
      const parsed = MeProfileResponseZ.parse(await res.json());
      expect(parsed.pendingRequests.delete?.status).toBe("pending");
      expect(parsed.pendingRequests.visibility).toBeUndefined();
    });

    it("06b-fu-001: resolved 行は pending として返さない", async () => {
      // 直接 resolved 状態の note を入れて pending ではないことを確認
      await env.db
        .prepare(
          "INSERT INTO admin_member_notes (note_id, member_id, body, note_type, request_status, resolved_at, created_by, updated_by, created_at, updated_at) VALUES ('n_resolved','m_001','{}','visibility_request','resolved',1,'admin@example.com','admin@example.com','2026-05-04T00:00:00Z','2026-05-04T00:00:00Z')",
        )
        .run();
      const { app, env: e } = buildApp(env);
      const res = await app.request("/profile", {}, e);
      const parsed = MeProfileResponseZ.parse(await res.json());
      expect(parsed.pendingRequests.visibility).toBeUndefined();
    });

    it("06b-fu-001: 最新が resolved でも古い pending があれば banner 用 pendingRequests.visibility を返す", async () => {
      await env.db
        .prepare(
          "INSERT INTO admin_member_notes (note_id, member_id, body, note_type, request_status, created_by, updated_by, created_at, updated_at) VALUES ('n_pending_old','m_001','{\"payload\":{\"desiredState\":\"public\"}}','visibility_request','pending','admin@example.com','admin@example.com','2026-05-04T00:00:00Z','2026-05-04T00:00:00Z')",
        )
        .run();
      await env.db
        .prepare(
          "INSERT INTO admin_member_notes (note_id, member_id, body, note_type, request_status, resolved_at, created_by, updated_by, created_at, updated_at) VALUES ('n_resolved_new','m_001','{}','visibility_request','resolved',1,'admin@example.com','admin@example.com','2026-05-04T01:00:00Z','2026-05-04T01:00:00Z')",
        )
        .run();

      const { app, env: e } = buildApp(env);
      const res = await app.request("/profile", {}, e);
      const parsed = MeProfileResponseZ.parse(await res.json());
      expect(parsed.pendingRequests.visibility?.queueId).toBe("n_pending_old");
      expect(parsed.pendingRequests.visibility?.desiredState).toBe("public");
    });
  });

  // issue-372: 出席履歴のページング
  describe("GET /me/attendance — pagination", () => {
    const seedSessions = async (count: number) => {
      for (let i = 0; i < count; i++) {
        const sid = `s_${String(i).padStart(3, "0")}`;
        const day = String((i % 28) + 1).padStart(2, "0");
        const heldOn = `2026-${String((i % 12) + 1).padStart(2, "0")}-${day}`;
        await env.db
          .prepare(
            "INSERT INTO meeting_sessions (session_id, title, held_on, note, created_at, created_by) VALUES (?, ?, ?, NULL, ?, 'admin')",
          )
          .bind(sid, `題目${i}`, heldOn, "2026-01-01T00:00:00Z")
          .run();
        await env.db
          .prepare(
            "INSERT INTO member_attendance (member_id, session_id, assigned_by) VALUES (?, ?, 'admin')",
          )
          .bind("m_001", sid)
          .run();
      }
    };

    it("default limit 50 件 + hasMore=true / nextCursor 返却（60 件投入）", async () => {
      await seedSessions(60);
      const { app, env: e } = buildApp(env);
      const res = await app.request("/profile", {}, e);
      expect(res.status).toBe(200);
      const parsed = MeProfileResponseZ.parse(await res.json());
      expect(parsed.profile.attendance).toHaveLength(50);
      expect(parsed.profile.attendanceMeta?.hasMore).toBe(true);
      expect(parsed.profile.attendanceMeta?.nextCursor).not.toBeNull();
    });

    it("件数 ≤ default なら hasMore=false / nextCursor=null", async () => {
      await seedSessions(10);
      const { app, env: e } = buildApp(env);
      const res = await app.request("/profile", {}, e);
      const parsed = MeProfileResponseZ.parse(await res.json());
      expect(parsed.profile.attendance).toHaveLength(10);
      expect(parsed.profile.attendanceMeta?.hasMore).toBe(false);
      expect(parsed.profile.attendanceMeta?.nextCursor).toBeNull();
    });

    it("/me/attendance: cursor で次ページが取れる", async () => {
      await seedSessions(60);
      const { app, env: e } = buildApp(env);
      const first = await app.request("/profile", {}, e);
      const firstBody = MeProfileResponseZ.parse(await first.json());
      const cur = firstBody.profile.attendanceMeta!.nextCursor!;

      const next = await app.request(
        `/attendance?cursor=${encodeURIComponent(cur)}`,
        {},
        e,
      );
      expect(next.status).toBe(200);
      const nextBody = MeAttendancePageResponseZ.parse(await next.json());
      expect(nextBody.records).toHaveLength(10);
      expect(nextBody.hasMore).toBe(false);
      expect(nextBody.nextCursor).toBeNull();
      // first page と次ページで重複しない
      const firstSet = new Set(firstBody.profile.attendance.map((r) => r.sessionId));
      for (const r of nextBody.records) {
        expect(firstSet.has(r.sessionId)).toBe(false);
      }
    });

    it("/me/attendance: limit=10 で 10 件 + hasMore=true", async () => {
      await seedSessions(15);
      const { app, env: e } = buildApp(env);
      const res = await app.request("/attendance?limit=10", {}, e);
      const body = MeAttendancePageResponseZ.parse(await res.json());
      expect(body.records).toHaveLength(10);
      expect(body.hasMore).toBe(true);
      expect(body.nextCursor).not.toBeNull();
    });

    it("/me/attendance: 不正 cursor は 400", async () => {
      const { app, env: e } = buildApp(env);
      const res = await app.request("/attendance?cursor=!!invalid!!", {}, e);
      expect(res.status).toBe(400);
      const body = (await res.json()) as { code: string };
      expect(body.code).toBe("INVALID_CURSOR");
    });

    it("/me/attendance: limit=0 は 400", async () => {
      const { app, env: e } = buildApp(env);
      const res = await app.request("/attendance?limit=0", {}, e);
      expect(res.status).toBe(400);
    });

    it("/me/attendance: 未ログインは 401", async () => {
      const { app, env: e } = buildApp(env, null);
      const res = await app.request("/attendance", {}, e);
      expect(res.status).toBe(401);
    });

    it("/me/attendance: cursor 経由で nextCursor をデコードすると最終 record の (heldOn,sessionId)", async () => {
      await seedSessions(60);
      const { app, env: e } = buildApp(env);
      const res = await app.request("/attendance?limit=5", {}, e);
      const body = MeAttendancePageResponseZ.parse(await res.json());
      const last = body.records[body.records.length - 1]!;
      const decoded = decodeAttendanceCursor(body.nextCursor!);
      expect(decoded).toEqual({ heldOn: last.heldOn, sessionId: last.sessionId });
      // encode roundtrip
      expect(encodeAttendanceCursor(decoded!)).toBe(body.nextCursor);
    });
  });

  describe("POST /me/visibility-request", () => {
    it("AC-4: 202 + queueId を返し、admin_member_notes に visibility_request 行が入る", async () => {
      const { app, env: e } = buildApp(env);
      const res = await app.request(
        "/visibility-request",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ desiredState: "hidden", reason: "一時的に" }),
        },
        e,
      );
      expect(res.status).toBe(202);
      const json = MeQueueAcceptedResponseZ.parse(await res.json());
      expect(json.type).toBe("visibility_request");
      const row = await env.db
        .prepare(
          "SELECT note_type, member_id FROM admin_member_notes WHERE note_id=?1",
        )
        .bind(json.queueId)
        .first<{ note_type: string; member_id: string }>();
      expect(row?.note_type).toBe("visibility_request");
      expect(row?.member_id).toBe("m_001");
      // 不変条件 #4: response_fields は変更されていない
      const fields = await env.db
        .prepare(
          "SELECT COUNT(*) AS c FROM response_fields WHERE response_id='r_001'",
        )
        .first<{ c: number }>();
      expect(fields?.c).toBe(RESPONSE_FIELDS_R001.length);
    });

    it("AC-7: resolved 行のみ存在する member は再申請が 202 で成功する", async () => {
      const { app, env: e } = buildApp(env);
      const first = await app.request(
        "/visibility-request",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ desiredState: "hidden" }),
        },
        e,
      );
      expect(first.status).toBe(202);
      const firstJson = MeQueueAcceptedResponseZ.parse(await first.json());
      // admin が resolve したと仮定して直接 D1 を更新
      await env.db
        .prepare(
          "UPDATE admin_member_notes SET request_status='resolved', resolved_at=?1, resolved_by_admin_id='adm_owner' WHERE note_id=?2",
        )
        .bind(Date.now(), firstJson.queueId)
        .run();
      const second = await app.request(
        "/visibility-request",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ desiredState: "hidden" }),
        },
        e,
      );
      expect(second.status).toBe(202);
      const secondJson = MeQueueAcceptedResponseZ.parse(await second.json());
      expect(secondJson.queueId).not.toBe(firstJson.queueId);
      const pendingRows = await env.db
        .prepare(
          "SELECT COUNT(*) AS c FROM admin_member_notes WHERE member_id='m_001' AND note_type='visibility_request' AND request_status='pending'",
        )
        .first<{ c: number }>();
      expect(pendingRows?.c).toBe(1);
    });

    it("F-7: 二重申請は 409 DUPLICATE_PENDING_REQUEST", async () => {
      const { app, env: e } = buildApp(env);
      const first = await app.request(
        "/visibility-request",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ desiredState: "hidden" }),
        },
        e,
      );
      expect(first.status).toBe(202);
      const second = await app.request(
        "/visibility-request",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ desiredState: "hidden" }),
        },
        e,
      );
      expect(second.status).toBe(409);
      const json = (await second.json()) as { code: string };
      expect(json.code).toBe("DUPLICATE_PENDING_REQUEST");
    });

    it("F-8: 不正 body は 422", async () => {
      const { app, env: e } = buildApp(env);
      const res = await app.request(
        "/visibility-request",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ desiredState: "invalid" }),
        },
        e,
      );
      expect(res.status).toBe(422);
    });

    it("F-4: rules_consent != consented は 403 RULES_NOT_ACCEPTED", async () => {
      await env.db
        .prepare(
          "UPDATE member_status SET rules_consent='declined' WHERE member_id='m_001'",
        )
        .run();
      const { app, env: e } = buildApp(env);
      const res = await app.request(
        "/visibility-request",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ desiredState: "hidden" }),
        },
        e,
      );
      expect(res.status).toBe(403);
    });
  });

  describe("POST /me/delete-request", () => {
    it("AC-4: 202 + delete_request 行を投入する", async () => {
      const { app, env: e } = buildApp(env);
      const res = await app.request(
        "/delete-request",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ reason: "退会" }),
        },
        e,
      );
      expect(res.status).toBe(202);
      const json = MeQueueAcceptedResponseZ.parse(await res.json());
      expect(json.type).toBe("delete_request");
    });

    it("空 body も許容", async () => {
      const { app, env: e } = buildApp(env);
      const res = await app.request(
        "/delete-request",
        { method: "POST" },
        e,
      );
      expect(res.status).toBe(202);
    });
  });

  describe("F-6: rate limit 5 req/min", () => {
    it("6 回目で 429 Retry-After", async () => {
      const { app, env: e } = buildApp(env);
      // 連続 POST を別 type で叩いても session 単位 bucket なので 6 回目で 429
      // visibility/delete を交互に叩くと visibility 側は 1 回目 202、以降 409 になるため、
      // ここでは delete-request の 422 を活用して count を消費する。
      const fire = () =>
        app.request(
          "/delete-request",
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ reason: "x".repeat(501) }), // 422 だが rate counter は消費される
          },
          e,
        );
      const responses: number[] = [];
      for (let i = 0; i < RATE_LIMIT_MAX + 1; i += 1) {
        const r = await fire();
        responses.push(r.status);
      }
      expect(responses[RATE_LIMIT_MAX]).toBe(429);
    });
  });
});
