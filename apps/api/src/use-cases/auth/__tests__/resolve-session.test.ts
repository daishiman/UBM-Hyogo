// 05b: resolveSession use-case test
// AC-10: identity 解決失敗 (unregistered/rules_declined/deleted) は session 未発行
// admin_users にあれば isAdmin=true

// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "../../../repository/__tests__/_setup";
import { resolveSession } from "../resolve-session";
import {
  seedValidMember,
  seedRulesDeclinedMember,
  seedDeletedMember,
  seedAdminUser,
  VALID_EMAIL,
  RULES_DECLINED_EMAIL,
  DELETED_EMAIL,
  UNKNOWN_EMAIL,
} from "./_seed";

describe("resolveSession", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
  });

  it("RS-01: unregistered → ok=false / reason=unregistered", async () => {
    const r = await resolveSession({ ctx: env.ctx, email: UNKNOWN_EMAIL });
    expect(r).toEqual({ ok: false, reason: "unregistered" });
  });

  it("RS-02: rules_declined → ok=false / reason=rules_declined", async () => {
    await seedRulesDeclinedMember(env);
    const r = await resolveSession({ ctx: env.ctx, email: RULES_DECLINED_EMAIL });
    expect(r).toEqual({ ok: false, reason: "rules_declined" });
  });

  it("RS-03: deleted → ok=false / reason=deleted", async () => {
    await seedDeletedMember(env);
    const r = await resolveSession({ ctx: env.ctx, email: DELETED_EMAIL });
    expect(r).toEqual({ ok: false, reason: "deleted" });
  });

  it("RS-04: valid → ok=true / SessionUser に memberId と responseId", async () => {
    await seedValidMember(env);
    const r = await resolveSession({ ctx: env.ctx, email: VALID_EMAIL });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.user.memberId).toBe("m_001");
      expect(r.user.responseId).toBe("r_001");
      expect(r.user.email).toBe(VALID_EMAIL);
      expect(r.user.isAdmin).toBe(false);
      expect(r.user.authGateState).toBe("active");
    }
  });

  it("RS-05: admin_users に登録済み email は isAdmin=true", async () => {
    await seedValidMember(env);
    await seedAdminUser(env, VALID_EMAIL);
    const r = await resolveSession({ ctx: env.ctx, email: VALID_EMAIL });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.user.isAdmin).toBe(true);
  });
});
