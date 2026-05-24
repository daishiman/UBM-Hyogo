import { describe, expect, it, vi } from "vitest";

// M-3: self-verify 失敗時の throw 経路（理論上の署名/検証 drift）。
// verifySessionJwt を null 固定にして mintStagingBearers の自己検証ガードへ到達させる。
// signSessionJwt は実関数を維持し、検証側のみ差し替える（importOriginal で actual を継承）。
vi.mock("@ubm-hyogo/shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@ubm-hyogo/shared")>();
  return { ...actual, verifySessionJwt: vi.fn(async () => null) };
});

const { mintStagingBearers } = await import("../mint-staging-bearers.mts");

const baseEnv = {
  authSecret: "test-secret-mint-self-verify",
  adminMemberId: "admin-member-id",
  adminEmail: "admin@example.com",
  meMemberId: "me-member-id",
  meEmail: "me@example.com",
} as const;

describe("mintStagingBearers self-verify guard", () => {
  it("M-3: self-verify が null を返すと reject し、Error.message に token を含まない", async () => {
    const promise = mintStagingBearers(baseEnv);
    await expect(promise).rejects.toThrow(/self verification failed/i);

    const error = await promise.catch((e: unknown) => e as Error);
    // JWT 文字列（3 セグメントの header.payload.signature）が露出していないこと（不変条件 5）。
    expect(error.message).not.toMatch(/[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
    expect(error.message).not.toContain(baseEnv.authSecret);
  });
});
