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
} from "./schemas";

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
      const { app, env: e } = buildApp(env);
      const res = await app.request("/profile", {}, e);
      expect(res.status).toBe(200);
      const json = (await res.json()) as Record<string, unknown>;
      const parsed = MeProfileResponseZ.parse(json);
      expect(parsed.profile.memberId).toBe("m_001");
      expect(parsed.editResponseUrl).toBe(
        "https://docs.google.com/forms/edit/r_001",
      );
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
