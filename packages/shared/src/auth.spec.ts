// @vitest-environment node
import { describe, it, expect } from "vitest";
import {
  decodeAuthSessionJwt,
  encodeAuthSessionJwt,
  signSessionJwt,
  verifySessionJwt,
  SESSION_JWT_TTL_SECONDS,
} from "./auth";
import { asMemberId } from "./branded";

const SECRET = "test-secret-test-secret-test-secret-test-secret"; // 48 bytes

describe("signSessionJwt / verifySessionJwt (HS256)", () => {
  const member = asMemberId("mbr_01HXYZ");

  it("S-01: 一般 member の JWT を発行 → verify で claims を復元する", async () => {
    const jwt = await signSessionJwt(SECRET, {
      memberId: member,
      email: "user@example.com",
      isAdmin: false,
    });
    const claims = await verifySessionJwt(jwt, SECRET);
    expect(claims).not.toBeNull();
    expect(claims!.memberId).toBe(member);
    expect(claims!.sub).toBe(member);
    expect(claims!.isAdmin).toBe(false);
    expect(claims!.email).toBe("user@example.com");
    expect(claims!.exp - claims!.iat).toBe(SESSION_JWT_TTL_SECONDS);
  });

  it("S-02: admin の JWT は isAdmin=true で復元される", async () => {
    const jwt = await signSessionJwt(SECRET, {
      memberId: member,
      email: "admin@example.com",
      isAdmin: true,
      name: "Admin",
    });
    const claims = await verifySessionJwt(jwt, SECRET);
    expect(claims!.isAdmin).toBe(true);
    expect(claims!.name).toBe("Admin");
  });

  it("S-06 / AC-8: 改ざんされた JWT は verify で null を返す", async () => {
    const jwt = await signSessionJwt(SECRET, {
      memberId: member,
      email: "user@example.com",
      isAdmin: false,
    });
    // payload 部分を別のものに差し替え（signature と不整合）
    const [h, , s] = jwt.split(".");
    const fakePayload = btoa(
      JSON.stringify({
        sub: member,
        memberId: member,
        isAdmin: true, // 偽 admin に昇格
        email: "user@example.com",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      }),
    )
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const tampered = `${h}.${fakePayload}.${s}`;
    const claims = await verifySessionJwt(tampered, SECRET);
    expect(claims).toBeNull();
  });

  it("期限切れ JWT は null を返す", async () => {
    const jwt = await signSessionJwt(SECRET, {
      memberId: member,
      email: "u@example.com",
      isAdmin: false,
      nowSeconds: 1_700_000_000,
      ttlSeconds: 60,
    });
    const claims = await verifySessionJwt(jwt, SECRET, 1_700_000_000 + 120);
    expect(claims).toBeNull();
  });

  it("異なる secret では verify 失敗", async () => {
    const jwt = await signSessionJwt(SECRET, {
      memberId: member,
      email: "u@example.com",
      isAdmin: false,
    });
    const claims = await verifySessionJwt(jwt, "different-secret-different");
    expect(claims).toBeNull();
  });

  it("不正な形式は null", async () => {
    expect(await verifySessionJwt("not.a.jwt", SECRET)).toBeNull();
    expect(await verifySessionJwt("", SECRET)).toBeNull();
    expect(await verifySessionJwt("a.b", SECRET)).toBeNull();
  });

  it("S-07: JWT に responseId / profile が含まれない（型レベル + 実 payload）", async () => {
    const jwt = await signSessionJwt(SECRET, {
      memberId: member,
      email: "u@example.com",
      isAdmin: false,
    });
    const claims = await verifySessionJwt(jwt, SECRET);
    const keys = Object.keys(claims!);
    expect(keys).not.toContain("responseId");
    expect(keys).not.toContain("profile");
    expect(keys).not.toContain("responses");
    expect(keys).not.toContain("notes");
  });

  it("S-08: Auth.js jwt.encode/decode adapter と API verifier が同じ HS256 JWT を共有する", async () => {
    const jwt = await encodeAuthSessionJwt(SECRET, {
      sub: member,
      memberId: member,
      email: "admin@example.com",
      name: "Admin",
      isAdmin: true,
    });
    const apiClaims = await verifySessionJwt(jwt, SECRET);
    const authClaims = await decodeAuthSessionJwt(SECRET, jwt);
    expect(apiClaims?.memberId).toBe(member);
    expect(apiClaims?.isAdmin).toBe(true);
    expect(authClaims?.email).toBe("admin@example.com");
  });
});
