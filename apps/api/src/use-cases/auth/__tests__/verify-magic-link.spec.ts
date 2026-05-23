// 05b: verifyMagicLink use-case test
// AC-5 (T-02): 期限切れ -> reason: expired
// AC-6 (T-03): 二重使用 -> reason: already_used
// AC-9 (T-04): not_found
// AC-9 (T-05): email mismatch -> resolve_failed

// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "../../../repository/__tests__/_setup";
import { verifyMagicLink } from "../verify-magic-link";
import * as magicTokens from "../../../repository/magicTokens";
import { magicTokenValue } from "../../../repository/_shared/brand";
import { asMemberId, asResponseId } from "@ubm-hyogo/shared";
import { seedValidMember, VALID_EMAIL } from "./_seed";

const issueFor = async (env: InMemoryD1, ttlSec: number, now?: Date) =>
  magicTokens.issue(env.ctx, {
    memberId: asMemberId("m_001"),
    email: VALID_EMAIL,
    responseId: asResponseId("r_001"),
    ttlSec,
    ...(now !== undefined ? { now } : {}),
  });

describe("verifyMagicLink", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
    await seedValidMember(env);
  });

  it("T-01: 有効 token + matching email → ok=true / SessionUser を返す", async () => {
    const row = await issueFor(env, 900);
    const r = await verifyMagicLink({
      ctx: env.ctx,
      token: row.token,
      email: VALID_EMAIL,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.user.memberId).toBe("m_001");
      expect(r.user.responseId).toBe("r_001");
      expect(r.user.email).toBe(VALID_EMAIL);
      expect(r.user.authGateState).toBe("active");
      expect(r.user.isAdmin).toBe(false);
    }
  });

  it("AC-5 (T-02): expired token → reason=expired", async () => {
    const row = await issueFor(env, 1, new Date(Date.now() - 10_000));
    const r = await verifyMagicLink({
      ctx: env.ctx,
      token: row.token,
      email: VALID_EMAIL,
    });
    expect(r).toEqual({ ok: false, reason: "expired" });
  });

  it("AC-6 (T-03): 二度目使用は already_used", async () => {
    const row = await issueFor(env, 900);
    const first = await verifyMagicLink({
      ctx: env.ctx,
      token: row.token,
      email: VALID_EMAIL,
    });
    expect(first.ok).toBe(true);
    const second = await verifyMagicLink({
      ctx: env.ctx,
      token: row.token,
      email: VALID_EMAIL,
    });
    expect(second).toEqual({ ok: false, reason: "already_used" });
  });

  it("T-04: 存在しない token → not_found", async () => {
    const r = await verifyMagicLink({
      ctx: env.ctx,
      token: magicTokenValue("0".repeat(64)),
      email: VALID_EMAIL,
    });
    expect(r).toEqual({ ok: false, reason: "not_found" });
  });

  it("T-05: token は valid だが email mismatch → resolve_failed", async () => {
    const row = await issueFor(env, 900);
    const r = await verifyMagicLink({
      ctx: env.ctx,
      token: row.token,
      email: "other@example.com",
    });
    expect(r).toEqual({ ok: false, reason: "resolve_failed" });
  });
});
