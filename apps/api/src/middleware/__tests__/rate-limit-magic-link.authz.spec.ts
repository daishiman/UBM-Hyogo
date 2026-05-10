// 05b: rate limit middleware test
// R-01: 同 email 6 回目は 429
// R-02: 異 email は通る
// R-03: 同 IP の gate-state 61 回目は 429

// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "../../repository/__tests__/_setup";
import { createAuthRoute } from "../../routes/auth";
import {
  __resetRateLimitMagicLinkForTests,
  POST_MAGIC_LINK_EMAIL_LIMIT,
  GET_GATE_STATE_IP_LIMIT,
} from "../rate-limit-magic-link";
import { seedValidMember, VALID_EMAIL } from "../../use-cases/auth/__tests__/_seed";

const buildApp = (env: InMemoryD1) => {
  const app = createAuthRoute({
    resolveMailSender: () => ({ async send() { return { ok: true as const }; } }),
    ttlSec: 900,
  });
  return {
    app,
    env: { DB: env.db as unknown as D1Database, AUTH_URL: "https://app.test", MAIL_FROM_ADDRESS: "no-reply@test" },
  };
};

describe("rate-limit-magic-link", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
    __resetRateLimitMagicLinkForTests();
    await seedValidMember(env);
  });

  it("R-01: 同 email 6 回目以降は 429 RATE_LIMITED", async () => {
    const { app, env: e } = buildApp(env);
    const post = (ip: string) =>
      app.request(
        "/magic-link",
        {
          method: "POST",
          body: JSON.stringify({ email: VALID_EMAIL }),
          headers: {
            "content-type": "application/json",
            // IP を変えても email リミットで弾かれる
            "cf-connecting-ip": ip,
          },
        },
        e,
      );
    for (let i = 0; i < POST_MAGIC_LINK_EMAIL_LIMIT; i++) {
      const res = await post(`10.0.0.${i + 1}`);
      expect(res.status).toBe(200);
    }
    const blocked = await post("10.0.0.99");
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBeTruthy();
  });

  it("R-02: 異 email は各 1 回目なら全て通る", async () => {
    const { app, env: e } = buildApp(env);
    // 別 fixture を入れずに unregistered で済ませる（state="unregistered"）。
    for (let i = 0; i < POST_MAGIC_LINK_EMAIL_LIMIT + 2; i++) {
      const res = await app.request(
        "/magic-link",
        {
          method: "POST",
          body: JSON.stringify({ email: `u${i}@example.com` }),
          headers: { "content-type": "application/json", "cf-connecting-ip": "10.1.0.1" },
        },
        e,
      );
      expect(res.status).toBe(200);
    }
  });

  it("R-03: 同 IP の gate-state は 61 回目で 429", async () => {
    const { app, env: e } = buildApp(env);
    for (let i = 0; i < GET_GATE_STATE_IP_LIMIT; i++) {
      const res = await app.request(
        `/gate-state?email=${encodeURIComponent("u" + i + "@example.com")}`,
        { headers: { "cf-connecting-ip": "10.2.0.1" } },
        e,
      );
      expect(res.status).toBe(200);
    }
    const blocked = await app.request(
      `/gate-state?email=${encodeURIComponent("ux@example.com")}`,
      { headers: { "cf-connecting-ip": "10.2.0.1" } },
      e,
    );
    expect(blocked.status).toBe(429);
  });
});
