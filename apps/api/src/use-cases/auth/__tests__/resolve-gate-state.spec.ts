// 05b: AuthGateState resolver test
// AC-1: unregistered (R1)
// AC-2: rules_declined (R2)
// AC-3: deleted (R3) — 優先順位 R3-PRIO

// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "../../../repository/__tests__/_setup";
import { resolveGateState } from "../resolve-gate-state";
import {
  seedValidMember,
  seedRulesDeclinedMember,
  seedDeletedMember,
  VALID_EMAIL,
  RULES_DECLINED_EMAIL,
  DELETED_EMAIL,
  UNKNOWN_EMAIL,
} from "./_seed";

describe("resolveGateState", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
  });

  it("AC-1 (R1): identity 不在は unregistered、memberId は返さない", async () => {
    const r = await resolveGateState(env.ctx, UNKNOWN_EMAIL);
    expect(r.state).toBe("unregistered");
    expect(r.memberId).toBeNull();
    expect(r.responseId).toBeNull();
  });

  it("AC-2 (R2): rules_consent != consented は rules_declined", async () => {
    await seedRulesDeclinedMember(env);
    const r = await resolveGateState(env.ctx, RULES_DECLINED_EMAIL);
    expect(r.state).toBe("rules_declined");
    expect(r.memberId).toBeNull();
  });

  it("AC-3 (R3): is_deleted=1 は deleted", async () => {
    await seedDeletedMember(env);
    const r = await resolveGateState(env.ctx, DELETED_EMAIL);
    expect(r.state).toBe("deleted");
    expect(r.memberId).toBeNull();
  });

  it("AC-4: 全条件 OK は ok + memberId / responseId 解決", async () => {
    await seedValidMember(env);
    const r = await resolveGateState(env.ctx, VALID_EMAIL);
    expect(r.state).toBe("ok");
    expect(r.memberId).toBe("m_001");
    expect(r.responseId).toBe("r_001");
  });

  it("normalize: 大文字 / 前後空白を吸収する", async () => {
    await seedValidMember(env);
    const r = await resolveGateState(env.ctx, "  USER1@EXAMPLE.COM  ");
    expect(r.state).toBe("ok");
  });
});
