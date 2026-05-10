// 06b-A: /me/* session resolver の契約テスト。
// - dev 経路: x-ubm-dev-session: 1 + Bearer "session:<email>:<memberId>"
// - production/staging 経路: Auth.js cookie / Bearer JWT を AUTH_SECRET で verify

// @vitest-environment node
import { describe, it, expect } from "vitest";
import { signSessionJwt, asMemberId } from "@ubm-hyogo/shared";
import {
  createMeSessionResolver,
  type MeSessionResolverEnv,
} from "./me-session-resolver";

const SECRET = "test-secret-32-bytes-min-aaaaaaaa";

const buildRequest = (init: { headers?: Record<string, string> } = {}): Request =>
  new Request("https://api.example.com/me", {
    method: "GET",
    headers: init.headers ?? {},
  });

describe("createMeSessionResolver", () => {
  const resolver = createMeSessionResolver();

  describe("development dev-token path", () => {
    it("returns session for valid dev token", async () => {
      const req = buildRequest({
        headers: {
          "x-ubm-dev-session": "1",
          authorization: "Bearer session:dev@example.com:m_dev",
        },
      });
      const result = await resolver(req, {
        DB: {} as D1Database,
        ENVIRONMENT: "development",
      });
      expect(result).toEqual({ email: "dev@example.com", memberId: "m_dev" });
    });

    it("rejects dev header in production even with valid format", async () => {
      const req = buildRequest({
        headers: {
          "x-ubm-dev-session": "1",
          authorization: "Bearer session:dev@example.com:m_dev",
        },
      });
      const result = await resolver(req, {
        DB: {} as D1Database,
        ENVIRONMENT: "production",
      });
      expect(result).toBeNull();
    });

    it("rejects dev header when ENVIRONMENT is missing", async () => {
      const req = buildRequest({
        headers: {
          "x-ubm-dev-session": "1",
          authorization: "Bearer session:dev@example.com:m_dev",
        },
      });
      const result = await resolver(req, {
        DB: {} as D1Database,
      });
      expect(result).toBeNull();
    });

    it("returns null when dev header missing", async () => {
      const req = buildRequest({
        headers: { authorization: "Bearer session:dev@example.com:m_dev" },
      });
      const result = await resolver(req, {
        DB: {} as D1Database,
        ENVIRONMENT: "development",
      });
      expect(result).toBeNull();
    });
  });

  describe("Auth.js JWT path", () => {
    it("resolves valid JWT from Authorization Bearer in production", async () => {
      const jwt = await signSessionJwt(SECRET, {
        memberId: asMemberId("m_001"),
        email: "user@example.com",
        isAdmin: false,
      });
      const req = buildRequest({
        headers: { authorization: `Bearer ${jwt}` },
      });
      const result = await resolver(req, {
        DB: {} as D1Database,
        ENVIRONMENT: "production",
        AUTH_SECRET: SECRET,
      });
      expect(result).toEqual({ email: "user@example.com", memberId: "m_001" });
    });

    it("resolves JWT from authjs.session-token cookie", async () => {
      const jwt = await signSessionJwt(SECRET, {
        memberId: asMemberId("m_002"),
        email: "cookie@example.com",
        isAdmin: false,
      });
      const req = buildRequest({
        headers: { cookie: `authjs.session-token=${jwt}` },
      });
      const result = await resolver(req, {
        DB: {} as D1Database,
        ENVIRONMENT: "staging",
        AUTH_SECRET: SECRET,
      });
      expect(result).toEqual({ email: "cookie@example.com", memberId: "m_002" });
    });

    it("resolves JWT from __Secure-authjs.session-token cookie", async () => {
      const jwt = await signSessionJwt(SECRET, {
        memberId: asMemberId("m_003"),
        email: "secure@example.com",
        isAdmin: true,
      });
      const req = buildRequest({
        headers: { cookie: `__Secure-authjs.session-token=${jwt}` },
      });
      const result = await resolver(req, {
        DB: {} as D1Database,
        ENVIRONMENT: "production",
        AUTH_SECRET: SECRET,
      });
      expect(result).toEqual({ email: "secure@example.com", memberId: "m_003" });
    });

    it("rejects JWT with wrong secret", async () => {
      const jwt = await signSessionJwt("other-secret-32-bytes-min-bbbbbbbb", {
        memberId: asMemberId("m_001"),
        email: "user@example.com",
        isAdmin: false,
      });
      const req = buildRequest({
        headers: { authorization: `Bearer ${jwt}` },
      });
      const result = await resolver(req, {
        DB: {} as D1Database,
        ENVIRONMENT: "production",
        AUTH_SECRET: SECRET,
      });
      expect(result).toBeNull();
    });

    it("rejects expired JWT", async () => {
      const jwt = await signSessionJwt(SECRET, {
        memberId: asMemberId("m_001"),
        email: "user@example.com",
        isAdmin: false,
        nowSeconds: Math.floor(Date.now() / 1000) - 60 * 60 * 25,
      });
      const req = buildRequest({
        headers: { authorization: `Bearer ${jwt}` },
      });
      const result = await resolver(req, {
        DB: {} as D1Database,
        ENVIRONMENT: "production",
        AUTH_SECRET: SECRET,
      });
      expect(result).toBeNull();
    });

    it("returns null when AUTH_SECRET unset", async () => {
      const jwt = await signSessionJwt(SECRET, {
        memberId: asMemberId("m_001"),
        email: "user@example.com",
        isAdmin: false,
      });
      const req = buildRequest({
        headers: { authorization: `Bearer ${jwt}` },
      });
      const result = await resolver(req, {
        DB: {} as D1Database,
        ENVIRONMENT: "production",
      });
      expect(result).toBeNull();
    });

    it("returns null with no token at all", async () => {
      const req = buildRequest({});
      const result = await resolver(req, {
        DB: {} as D1Database,
        ENVIRONMENT: "production",
        AUTH_SECRET: SECRET,
      });
      expect(result).toBeNull();
    });

    it("returns null for malformed Bearer token", async () => {
      const req = buildRequest({
        headers: { authorization: "Bearer not.a.jwt" },
      });
      const result = await resolver(req, {
        DB: {} as D1Database,
        ENVIRONMENT: "production",
        AUTH_SECRET: SECRET,
      });
      expect(result).toBeNull();
    });
  });
});
