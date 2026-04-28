// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { setupD1, type InMemoryD1 } from "./_setup";
import * as magicTokens from "../magicTokens";
import { magicTokenValue } from "../_shared/brand";
import { asMemberId, asResponseId } from "@ubm-hyogo/shared";

describe("magicTokens (single-use)", () => {
  let env: InMemoryD1;
  beforeEach(async () => {
    env = await setupD1();
  });

  const baseInput = {
    memberId: asMemberId("m_001"),
    email: "u@example.com",
    responseId: asResponseId("res_001"),
  };

  it("issue で token を発行できる", async () => {
    const r = await magicTokens.issue(env.ctx, { ...baseInput, ttlSec: 600 });
    expect(r.token.length).toBeGreaterThan(0);
    expect(r.used).toBe(false);
  });

  it("verify は valid token を返す、used / expired は null", async () => {
    const r = await magicTokens.issue(env.ctx, { ...baseInput, ttlSec: 600 });
    expect(await magicTokens.verify(env.ctx, r.token)).not.toBeNull();
  });

  it("AC-7: consume を 2 回呼ぶと 2 回目は already_used", async () => {
    const r = await magicTokens.issue(env.ctx, { ...baseInput, ttlSec: 600 });
    const first = await magicTokens.consume(env.ctx, r.token);
    expect(first.ok).toBe(true);
    const second = await magicTokens.consume(env.ctx, r.token);
    expect(second).toEqual({ ok: false, reason: "already_used" });
  });

  it("expired token の consume は expired", async () => {
    const past = new Date(Date.now() - 10_000);
    const r = await magicTokens.issue(env.ctx, {
      ...baseInput,
      ttlSec: 1,
      now: new Date(past.getTime() - 5_000),
    });
    const result = await magicTokens.consume(env.ctx, r.token, new Date());
    expect(result).toEqual({ ok: false, reason: "expired" });
  });

  it("AC-7: consume の UPDATE は expires_at 条件付きで期限切れを使用済みにしない", async () => {
    const now = new Date("2026-04-27T00:00:00.000Z");
    const r = await magicTokens.issue(env.ctx, {
      ...baseInput,
      ttlSec: 1,
      now,
    });
    const result = await magicTokens.consume(
      env.ctx,
      r.token,
      new Date("2026-04-27T00:00:02.000Z"),
    );
    expect(result).toEqual({ ok: false, reason: "expired" });
    const stored = await magicTokens.findByToken(env.ctx, r.token);
    expect(stored?.used).toBe(false);
  });


  it("expired token の verify は null", async () => {
    const r = await magicTokens.issue(env.ctx, {
      ...baseInput,
      ttlSec: 1,
      now: new Date(Date.now() - 10_000),
    });
    expect(await magicTokens.verify(env.ctx, r.token, new Date())).toBeNull();
  });

  it("not_found token の consume は not_found", async () => {
    const result = await magicTokens.consume(
      env.ctx,
      magicTokenValue("does_not_exist_token"),
    );
    expect(result).toEqual({ ok: false, reason: "not_found" });
  });
});
