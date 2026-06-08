import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { verifySessionJwt } from "@ubm-hyogo/shared";
import {
  findMissingEnv,
  mintStagingBearers,
  mintStagingBearersForRoles,
  parseRoles,
  requiredEnvForRoles,
} from "../mint-staging-bearers.mts";

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

const roleEnv = {
  STAGING_AUTH_SECRET: SECRET,
  STAGING_ADMIN_MEMBER_ID: "admin-member-id",
  STAGING_ADMIN_EMAIL: "admin@example.com",
  STAGING_ME_MEMBER_ID: "me-member-id",
  STAGING_ME_EMAIL: "me@example.com",
} as const;

// JWT payload (2 個目の segment) を base64url decode して iat を取り出す test util。
function decodeIat(jwt: string): number {
  const payloadSegment = jwt.split(".")[1]!;
  const padded = payloadSegment.replace(/-/g, "+").replace(/_/g, "/") +
    "===".slice((payloadSegment.length + 3) % 4);
  const json = JSON.parse(Buffer.from(padded, "base64").toString("utf8")) as { iat: number };
  return json.iat;
}

function runCli(args: readonly string[], env: NodeJS.ProcessEnv): {
  status: number;
  output: string;
  stderr: string;
} {
  const dir = mkdtempSync(join(tmpdir(), "mint-bearers-"));
  const outputFile = join(dir, "github-output.txt");
  writeFileSync(outputFile, "");
  try {
    const stderr = execFileSync(
      process.execPath,
      ["--import", "tsx", "scripts/smoke/mint-staging-bearers.mts", ...args],
      {
        cwd: process.cwd(),
        env: {
          PATH: process.env.PATH,
          HOME: process.env.HOME,
          GITHUB_OUTPUT: outputFile,
          MINT_TTL_SECONDS: "600",
          ...env,
        },
        stdio: ["ignore", "ignore", "pipe"],
        encoding: "utf8",
      },
    );
    return { status: 0, output: readFileSync(outputFile, "utf8"), stderr };
  } catch (error) {
    const err = error as { status?: number; stderr?: Buffer | string };
    return {
      status: err.status ?? 1,
      output: readFileSync(outputFile, "utf8"),
      stderr: Buffer.isBuffer(err.stderr) ? err.stderr.toString("utf8") : String(err.stderr ?? ""),
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
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

describe("mint bearer role scoping", () => {
  it("parses role lists and removes duplicates", () => {
    expect(parseRoles(undefined)).toEqual(["admin", "me"]);
    expect(parseRoles("admin,me,admin")).toEqual(["admin", "me"]);
    expect(parseRoles("me,admin")).toEqual(["admin", "me"]);
    expect(() => parseRoles("admin,owner")).toThrow(/unknown role/);
  });

  it("requires only env names needed by the selected role", () => {
    expect(requiredEnvForRoles(["admin"])).toEqual([
      "STAGING_AUTH_SECRET",
      "STAGING_ADMIN_MEMBER_ID",
      "STAGING_ADMIN_EMAIL",
    ]);
    expect(findMissingEnv(requiredEnvForRoles(["admin"]), roleEnv)).toEqual([]);
    expect(findMissingEnv(requiredEnvForRoles(["admin"]), {
      STAGING_AUTH_SECRET: SECRET,
    })).toEqual([
      "STAGING_ADMIN_MEMBER_ID",
      "STAGING_ADMIN_EMAIL",
    ]);
  });

  it("mints only admin bearer for admin role", async () => {
    const minted = await mintStagingBearersForRoles(["admin"], {
      STAGING_AUTH_SECRET: SECRET,
      STAGING_ADMIN_MEMBER_ID: roleEnv.STAGING_ADMIN_MEMBER_ID,
      STAGING_ADMIN_EMAIL: roleEnv.STAGING_ADMIN_EMAIL,
    });
    expect(minted.adminBearer).toBeDefined();
    expect(minted.meBearer).toBeUndefined();
    expect(minted.memberId).toBe(roleEnv.STAGING_ADMIN_MEMBER_ID);
  });

  it("mints only me bearer for me role", async () => {
    const minted = await mintStagingBearersForRoles(["me"], {
      STAGING_AUTH_SECRET: SECRET,
      STAGING_ME_MEMBER_ID: roleEnv.STAGING_ME_MEMBER_ID,
      STAGING_ME_EMAIL: roleEnv.STAGING_ME_EMAIL,
    });
    expect(minted.adminBearer).toBeUndefined();
    expect(minted.meBearer).toBeDefined();
    expect(minted.memberId).toBe(roleEnv.STAGING_ME_MEMBER_ID);
  });
});

describe("mint-staging-bearers CLI", () => {
  it("admin role does not require ME env", () => {
    const result = runCli(["--roles", "admin"], {
      STAGING_AUTH_SECRET: SECRET,
      STAGING_ADMIN_MEMBER_ID: roleEnv.STAGING_ADMIN_MEMBER_ID,
      STAGING_ADMIN_EMAIL: roleEnv.STAGING_ADMIN_EMAIL,
    });
    expect(result.status).toBe(0);
    expect(result.output).toMatch(/^admin_bearer=/m);
    expect(result.output).toMatch(/^member_id=admin-member-id$/m);
    expect(result.output).not.toMatch(/^me_bearer=/m);
  }, 30_000);

  it("--roles=<value> form is accepted", () => {
    const result = runCli(["--roles=admin"], {
      STAGING_AUTH_SECRET: SECRET,
      STAGING_ADMIN_MEMBER_ID: roleEnv.STAGING_ADMIN_MEMBER_ID,
      STAGING_ADMIN_EMAIL: roleEnv.STAGING_ADMIN_EMAIL,
    });
    expect(result.status).toBe(0);
    expect(result.output).toMatch(/^admin_bearer=/m);
    expect(result.output).not.toMatch(/^me_bearer=/m);
  }, 30_000);

  it("default role list preserves admin+me output compatibility", () => {
    const result = runCli([], roleEnv);
    expect(result.status).toBe(0);
    expect(result.output).toMatch(/^admin_bearer=/m);
    expect(result.output).toMatch(/^me_bearer=/m);
    expect(result.output).toMatch(/^member_id=admin-member-id$/m);
  }, 30_000);

  it("missing env report is scoped to requested role and leaks no values", () => {
    const result = runCli(["--roles", "admin"], { STAGING_AUTH_SECRET: SECRET });
    expect(result.status).toBe(2);
    expect(result.stderr).toContain("STAGING_ADMIN_MEMBER_ID");
    expect(result.stderr).toContain("STAGING_ADMIN_EMAIL");
    expect(result.stderr).not.toContain("STAGING_ME_MEMBER_ID");
    expect(result.stderr).not.toContain(SECRET);
  }, 30_000);

  it("degrade exits zero and writes only the degraded marker", () => {
    const result = runCli(["--roles", "admin"], { RUNTIME_SMOKE_MINT_DEGRADE: "1" });
    expect(result.status).toBe(0);
    expect(result.output).toBe("mint_degraded=1\n");
    expect(result.output).not.toContain("admin_bearer=");
    expect(result.output).not.toContain("me_bearer=");
  }, 30_000);

  it("degrade trigger is strict", () => {
    const result = runCli(["--roles", "admin"], { RUNTIME_SMOKE_MINT_DEGRADE: "true" });
    expect(result.status).toBe(2);
    expect(result.output).not.toContain("mint_degraded=1");
  }, 30_000);
});
