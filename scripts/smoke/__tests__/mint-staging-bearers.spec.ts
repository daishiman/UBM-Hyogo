import { describe, expect, it } from "vitest";
import { verifySessionJwt } from "@ubm-hyogo/shared";
import { mintStagingBearers } from "../mint-staging-bearers.mts";

// ダミー鍵リテラルのみ使用し、実 secret を fixture に置かない（不変条件 3）。
const SECRET = "test-secret-mint-parity";
const OTHER_SECRET = "test-secret-other";

const baseEnv = {
  authSecret: SECRET,
  adminMemberId: "admin-member-id",
  adminEmail: "admin@example.com",
  meMemberId: "me-member-id",
  meEmail: "me@example.com",
} as const;

// JWT payload (2 個目の segment) を base64url decode して iat を取り出す test util。
function decodeIat(jwt: string): number {
  const payloadSegment = jwt.split(".")[1]!;
  const padded = payloadSegment.replace(/-/g, "+").replace(/_/g, "/") +
    "===".slice((payloadSegment.length + 3) % 4);
  const json = JSON.parse(Buffer.from(padded, "base64").toString("utf8")) as { iat: number };
  return json.iat;
}

describe("mintStagingBearers", () => {
  it("T-A1: admin bearer は verifySessionJwt を通過し isAdmin=true", async () => {
    const minted = await mintStagingBearers(baseEnv);
    const claims = await verifySessionJwt(minted.adminBearer, SECRET);
    expect(claims).not.toBeNull();
    expect(claims!.isAdmin).toBe(true);
    expect(claims!.memberId).toBe(baseEnv.adminMemberId);
    expect(claims!.email).toBe(baseEnv.adminEmail);
    expect(claims!.sub).toBe(baseEnv.adminMemberId);
  });

  it("T-A2: me bearer は verifySessionJwt を通過し isAdmin=false", async () => {
    const minted = await mintStagingBearers(baseEnv);
    const claims = await verifySessionJwt(minted.meBearer, SECRET);
    expect(claims).not.toBeNull();
    expect(claims!.isAdmin).toBe(false);
    expect(claims!.memberId).toBe(baseEnv.meMemberId);
    expect(claims!.email).toBe(baseEnv.meEmail);
  });

  it("T-A3: 返り値 memberId は admin の memberId（既存 STAGING_MEMBER_ID 互換）", async () => {
    const minted = await mintStagingBearers(baseEnv);
    expect(minted.memberId).toBe(baseEnv.adminMemberId);
  });

  it("T-A4: TTL=600 指定時 exp=iat+600（599 で有効・601 で失効）", async () => {
    const minted = await mintStagingBearers({ ...baseEnv, ttlSeconds: 600 });
    const iat = decodeIat(minted.adminBearer);
    const valid = await verifySessionJwt(minted.adminBearer, SECRET, iat + 599);
    const expired = await verifySessionJwt(minted.adminBearer, SECRET, iat + 601);
    expect(valid).not.toBeNull();
    expect(expired).toBeNull();
  });

  it("T-A5: TTL 既定値は 600（10 分）", async () => {
    const minted = await mintStagingBearers(baseEnv);
    const iat = decodeIat(minted.adminBearer);
    const valid = await verifySessionJwt(minted.adminBearer, SECRET, iat + 599);
    const expired = await verifySessionJwt(minted.adminBearer, SECRET, iat + 601);
    expect(valid).not.toBeNull();
    expect(expired).toBeNull();
  });

  it("T-A6: 鍵不一致では verify が null（HMAC mismatch）", async () => {
    const minted = await mintStagingBearers(baseEnv);
    const claims = await verifySessionJwt(minted.adminBearer, OTHER_SECRET);
    expect(claims).toBeNull();
  });

  it("T-A7: authSecret 欠落では throw（CLI guard は exit 2 相当）", async () => {
    await expect(
      mintStagingBearers({ ...baseEnv, authSecret: "" }),
    ).rejects.toThrow(/AUTH_SECRET missing/);
  });

  it("T-A8: 返り値に JWT 以外の予期せぬ平文露出キーが無い", async () => {
    const minted = await mintStagingBearers(baseEnv);
    expect(Object.keys(minted).sort()).toEqual(["adminBearer", "meBearer", "memberId"]);
  });
});
