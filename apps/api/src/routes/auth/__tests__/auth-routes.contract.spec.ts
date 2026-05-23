// 05b: /auth/* contract test
// AC-1〜AC-10 と test-matrix.md の R1〜R4 / RS-01〜RS-05 を検証する。
// 不変条件 #2: rules_consent / public_consent 名称
// 不変条件 #5: D1 アクセスは route 内で repository / use-case 経由
// 不変条件 #9: いずれの状態でも /no-access 系 redirect は発生しない（status は 200/400/401/502）

// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "../../../repository/__tests__/_setup";
import { createAuthRoute } from "../index";
import {
  __resetRateLimitMagicLinkForTests,
} from "../../../middleware/rate-limit-magic-link";
import {
  seedValidMember,
  seedRulesDeclinedMember,
  seedDeletedMember,
  VALID_EMAIL,
  RULES_DECLINED_EMAIL,
  DELETED_EMAIL,
  UNKNOWN_EMAIL,
} from "../../../use-cases/auth/__tests__/_seed";
import * as magicTokens from "../../../repository/magicTokens";
import { magicTokenValue } from "../../../repository/_shared/brand";
import { asMemberId, asResponseId } from "@ubm-hyogo/shared";
import type {
  MailSender,
  MailMessage,
  MailSendResult,
} from "../../../services/mail/magic-link-mailer";

class CapturingSender implements MailSender {
  readonly messages: MailMessage[] = [];
  result: MailSendResult = { ok: true };
  async send(message: MailMessage) {
    this.messages.push(message);
    return this.result;
  }
}

const buildApp = (env: InMemoryD1, sender: MailSender) => {
  const app = createAuthRoute({
    resolveMailSender: () => sender,
    ttlSec: 900,
  });
  return {
    app,
    env: { DB: env.db as unknown as D1Database, AUTH_URL: "https://app.test", MAIL_FROM_ADDRESS: "no-reply@test" },
  };
};

const countTokens = async (env: InMemoryD1): Promise<number> => {
  const r = await env.db
    .prepare("SELECT COUNT(*) AS c FROM magic_tokens")
    .first<{ c: number }>();
  return r?.c ?? 0;
};

describe("/auth/* contract", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
    __resetRateLimitMagicLinkForTests();
  });

  describe("POST /auth/magic-link", () => {
    it("AC-1 (R1-POST): unregistered → 200 state=unregistered, INSERT 0, mail 0", async () => {
      const sender = new CapturingSender();
      const { app, env: e } = buildApp(env, sender);
      const res = await app.request(
        "/magic-link",
        { method: "POST", body: JSON.stringify({ email: UNKNOWN_EMAIL }), headers: { "content-type": "application/json" } },
        e,
      );
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ state: "unregistered" });
      expect(await countTokens(env)).toBe(0);
      expect(sender.messages).toHaveLength(0);
    });

    it("AC-2 (R2-POST): rules_declined → 200 / INSERT 0", async () => {
      await seedRulesDeclinedMember(env);
      const sender = new CapturingSender();
      const { app, env: e } = buildApp(env, sender);
      const res = await app.request(
        "/magic-link",
        { method: "POST", body: JSON.stringify({ email: RULES_DECLINED_EMAIL }), headers: { "content-type": "application/json" } },
        e,
      );
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ state: "rules_declined" });
      expect(await countTokens(env)).toBe(0);
    });

    it("AC-3 (R3-POST): deleted → 200 / INSERT 0", async () => {
      await seedDeletedMember(env);
      const sender = new CapturingSender();
      const { app, env: e } = buildApp(env, sender);
      const res = await app.request(
        "/magic-link",
        { method: "POST", body: JSON.stringify({ email: DELETED_EMAIL }), headers: { "content-type": "application/json" } },
        e,
      );
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ state: "deleted" });
      expect(await countTokens(env)).toBe(0);
    });

    it("AC-4 (R4-POST): valid → 200 state=sent / INSERT 1 / mail 1", async () => {
      await seedValidMember(env);
      const sender = new CapturingSender();
      const { app, env: e } = buildApp(env, sender);
      const res = await app.request(
        "/magic-link",
        { method: "POST", body: JSON.stringify({ email: VALID_EMAIL }), headers: { "content-type": "application/json" } },
        e,
      );
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ state: "sent" });
      expect(await countTokens(env)).toBe(1);
      expect(sender.messages).toHaveLength(1);
      expect(sender.messages[0]!.to).toBe(VALID_EMAIL);
    });

    it("F-01: body 欠落は 400 INVALID_REQUEST", async () => {
      const { app, env: e } = buildApp(env, new CapturingSender());
      const res = await app.request(
        "/magic-link",
        { method: "POST", body: "{}", headers: { "content-type": "application/json" } },
        e,
      );
      expect(res.status).toBe(400);
      const body = (await res.json()) as { code: string };
      expect(body.code).toBe("INVALID_REQUEST");
    });

    it("F-02: malformed email は 400 INVALID_REQUEST", async () => {
      const { app, env: e } = buildApp(env, new CapturingSender());
      const res = await app.request(
        "/magic-link",
        { method: "POST", body: JSON.stringify({ email: "not-an-email" }), headers: { "content-type": "application/json" } },
        e,
      );
      expect(res.status).toBe(400);
    });

    it("F-11: mail 失敗時は 502 + token rollback", async () => {
      await seedValidMember(env);
      const sender = new CapturingSender();
      sender.result = { ok: false, errorMessage: "boom" };
      const { app, env: e } = buildApp(env, sender);
      const res = await app.request(
        "/magic-link",
        { method: "POST", body: JSON.stringify({ email: VALID_EMAIL }), headers: { "content-type": "application/json" } },
        e,
      );
      expect(res.status).toBe(502);
      expect(await countTokens(env)).toBe(0);
    });
  });

  describe("GET /auth/gate-state", () => {
    it("AC-1 (R1-GET): unregistered", async () => {
      const { app, env: e } = buildApp(env, new CapturingSender());
      const res = await app.request(`/gate-state?email=${encodeURIComponent(UNKNOWN_EMAIL)}`, {}, e);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ state: "unregistered" });
    });

    it("AC-2 (R2-GET): rules_declined", async () => {
      await seedRulesDeclinedMember(env);
      const { app, env: e } = buildApp(env, new CapturingSender());
      const res = await app.request(`/gate-state?email=${encodeURIComponent(RULES_DECLINED_EMAIL)}`, {}, e);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ state: "rules_declined" });
    });

    it("AC-3 (R3-GET): deleted", async () => {
      await seedDeletedMember(env);
      const { app, env: e } = buildApp(env, new CapturingSender());
      const res = await app.request(`/gate-state?email=${encodeURIComponent(DELETED_EMAIL)}`, {}, e);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ state: "deleted" });
    });

    it("AC-4 (R4-GET): valid → ok / 副作用なし (INSERT 0)", async () => {
      await seedValidMember(env);
      const { app, env: e } = buildApp(env, new CapturingSender());
      const res = await app.request(`/gate-state?email=${encodeURIComponent(VALID_EMAIL)}`, {}, e);
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ state: "ok" });
      expect(await countTokens(env)).toBe(0);
    });

    it("Z-02: gate-state response に memberId が含まれない", async () => {
      await seedValidMember(env);
      const { app, env: e } = buildApp(env, new CapturingSender());
      const res = await app.request(`/gate-state?email=${encodeURIComponent(VALID_EMAIL)}`, {}, e);
      const text = await res.text();
      expect(text).not.toContain("m_001");
      expect(text).not.toContain("memberId");
    });

    it("malformed email は 400", async () => {
      const { app, env: e } = buildApp(env, new CapturingSender());
      const res = await app.request("/gate-state?email=not-an-email", {}, e);
      expect(res.status).toBe(400);
    });
  });

  describe("POST /auth/magic-link/verify", () => {
    const issueTokenForValid = async () =>
      magicTokens.issue(env.ctx, {
        memberId: asMemberId("m_001"),
        email: VALID_EMAIL,
        responseId: asResponseId("r_001"),
        ttlSec: 900,
      });

    it("T-01: 有効 token + matching email → 200 ok=true / SessionUser", async () => {
      await seedValidMember(env);
      const row = await issueTokenForValid();
      const { app, env: e } = buildApp(env, new CapturingSender());
      const res = await app.request(
        "/magic-link/verify",
        { method: "POST", body: JSON.stringify({ token: row.token, email: VALID_EMAIL }), headers: { "content-type": "application/json" } },
        e,
      );
      expect(res.status).toBe(200);
      const body = (await res.json()) as { ok: boolean; user?: { memberId: string } };
      expect(body.ok).toBe(true);
      expect(body.user?.memberId).toBe("m_001");
    });

    it("AC-5 (T-02): 期限切れ token → 401 reason=expired", async () => {
      await seedValidMember(env);
      const row = await magicTokens.issue(env.ctx, {
        memberId: asMemberId("m_001"),
        email: VALID_EMAIL,
        responseId: asResponseId("r_001"),
        ttlSec: 1,
        now: new Date(Date.now() - 10_000),
      });
      const { app, env: e } = buildApp(env, new CapturingSender());
      const res = await app.request(
        "/magic-link/verify",
        { method: "POST", body: JSON.stringify({ token: row.token, email: VALID_EMAIL }), headers: { "content-type": "application/json" } },
        e,
      );
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ ok: false, reason: "expired" });
    });

    it("AC-6 (T-03): 二度目使用は 401 reason=already_used", async () => {
      await seedValidMember(env);
      const row = await issueTokenForValid();
      const { app, env: e } = buildApp(env, new CapturingSender());
      const make = async () =>
        app.request(
          "/magic-link/verify",
          { method: "POST", body: JSON.stringify({ token: row.token, email: VALID_EMAIL }), headers: { "content-type": "application/json" } },
          e,
        );
      const first = await make();
      expect(first.status).toBe(200);
      const second = await make();
      expect(second.status).toBe(401);
      expect(await second.json()).toEqual({ ok: false, reason: "already_used" });
    });

    it("T-04: 存在しない token → 401 reason=not_found", async () => {
      const { app, env: e } = buildApp(env, new CapturingSender());
      const res = await app.request(
        "/magic-link/verify",
        { method: "POST", body: JSON.stringify({ token: "0".repeat(64), email: VALID_EMAIL }), headers: { "content-type": "application/json" } },
        e,
      );
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ ok: false, reason: "not_found" });
    });

    it("T-05: email mismatch → 401 reason=resolve_failed", async () => {
      await seedValidMember(env);
      const row = await issueTokenForValid();
      const { app, env: e } = buildApp(env, new CapturingSender());
      const res = await app.request(
        "/magic-link/verify",
        { method: "POST", body: JSON.stringify({ token: row.token, email: "other@example.com" }), headers: { "content-type": "application/json" } },
        e,
      );
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ ok: false, reason: "resolve_failed" });
    });

    it("F-09: 不正な token 形式 (短すぎ) → 400", async () => {
      const { app, env: e } = buildApp(env, new CapturingSender());
      const res = await app.request(
        "/magic-link/verify",
        { method: "POST", body: JSON.stringify({ token: "abc", email: VALID_EMAIL }), headers: { "content-type": "application/json" } },
        e,
      );
      expect(res.status).toBe(400);
    });
  });

  describe("POST /auth/resolve-session", () => {
    it("RS-01: unregistered → 401", async () => {
      const { app, env: e } = buildApp(env, new CapturingSender());
      const res = await app.request(
        "/resolve-session",
        { method: "POST", body: JSON.stringify({ email: UNKNOWN_EMAIL }), headers: { "content-type": "application/json" } },
        e,
      );
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ ok: false, reason: "unregistered" });
    });

    it("RS-04: valid → 200 ok=true / SessionUser", async () => {
      await seedValidMember(env);
      const { app, env: e } = buildApp(env, new CapturingSender());
      const res = await app.request(
        "/resolve-session",
        { method: "POST", body: JSON.stringify({ email: VALID_EMAIL }), headers: { "content-type": "application/json" } },
        e,
      );
      expect(res.status).toBe(200);
      const body = (await res.json()) as { ok: boolean; user?: { memberId: string; isAdmin: boolean } };
      expect(body.ok).toBe(true);
      expect(body.user?.memberId).toBe("m_001");
      expect(body.user?.isAdmin).toBe(false);
    });
  });
});
