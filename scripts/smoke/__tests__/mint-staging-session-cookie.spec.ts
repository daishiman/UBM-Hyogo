import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { decodeAuthSessionJwt, verifySessionJwt } from "@ubm-hyogo/shared";
import {
  mintStagingSessionCookie,
  resolveEnvPrefix,
} from "../mint-staging-session-cookie.mts";

const SECRET = "test-secret-admin-cookie";

const baseInput = {
  authSecret: SECRET,
  memberId: "admin-member-id",
  email: "admin@example.com",
  isAdmin: true,
} as const;

function tokenFromCookie(cookie: string): string {
  return cookie.split("=").slice(1).join("=");
}

function runCli(envName: string, env: NodeJS.ProcessEnv): { outputFile: string; text: string } {
  const dir = mkdtempSync(join(tmpdir(), "mint-admin-cookie-"));
  const outputFile = join(dir, "github-output.txt");
  execFileSync(
    "pnpm",
    ["exec", "tsx", "scripts/smoke/mint-staging-session-cookie.mts", envName],
    {
      cwd: process.cwd(),
      env: {
        PATH: process.env.PATH,
        HOME: process.env.HOME,
        GITHUB_OUTPUT: outputFile,
        MINT_TTL_SECONDS: "600",
        ...env,
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  return { outputFile, text: readFileSync(outputFile, "utf8") };
}

describe("mintStagingSessionCookie", () => {
  it("resolves supported runtime smoke environment prefixes", () => {
    expect(resolveEnvPrefix("staging")).toBe("STAGING");
    expect(resolveEnvPrefix("production")).toBe("PRODUCTION");
    expect(() => resolveEnvPrefix("preview")).toThrow(/unsupported runtime smoke env/);
  });

  it("creates the Auth.js session cookie name used by middleware", async () => {
    const cookie = await mintStagingSessionCookie(baseInput);
    expect(cookie.startsWith("__Secure-authjs.session-token=")).toBe(true);
    expect(tokenFromCookie(cookie)).not.toHaveLength(0);
  });

  it("uses the same HS256 session JWT contract as Auth.js encode/decode adapter", async () => {
    const cookie = await mintStagingSessionCookie(baseInput);
    const token = tokenFromCookie(cookie);
    const claims = await decodeAuthSessionJwt(SECRET, token);
    expect(claims).not.toBeNull();
    expect(claims!.memberId).toBe(baseInput.memberId);
    expect(claims!.email).toBe(baseInput.email);
    expect(claims!.isAdmin).toBe(true);
  });

  it("honors ttlSeconds", async () => {
    const cookie = await mintStagingSessionCookie({ ...baseInput, ttlSeconds: 600 });
    const token = tokenFromCookie(cookie);
    const payloadSegment = token.split(".")[1]!;
    const padded = payloadSegment.replace(/-/g, "+").replace(/_/g, "/") +
      "===".slice((payloadSegment.length + 3) % 4);
    const payload = JSON.parse(Buffer.from(padded, "base64").toString("utf8")) as { iat: number };
    expect(await verifySessionJwt(token, SECRET, payload.iat + 599)).not.toBeNull();
    expect(await verifySessionJwt(token, SECRET, payload.iat + 601)).toBeNull();
  });

  it("supports non-secure fallback cookie name for local probes", async () => {
    const cookie = await mintStagingSessionCookie({
      ...baseInput,
      cookieName: "authjs.session-token",
    });
    expect(cookie.startsWith("authjs.session-token=")).toBe(true);
  });

  it("rejects missing secret without returning a token", async () => {
    await expect(
      mintStagingSessionCookie({ ...baseInput, authSecret: "" }),
    ).rejects.toThrow(/AUTH_SECRET missing/);
  });

  it("CLI production mode reads PRODUCTION_* without requiring STAGING_*", async () => {
    const { outputFile, text } = runCli("production", {
      PRODUCTION_AUTH_SECRET: SECRET,
      PRODUCTION_ADMIN_MEMBER_ID: "production-admin-id",
      PRODUCTION_ADMIN_EMAIL: "production-admin@example.com",
    });
    try {
      expect(text).toMatch(/^admin_session_cookie=__Secure-authjs\.session-token=/);
      const cookie = text.trim().replace(/^admin_session_cookie=/, "");
      const claims = await decodeAuthSessionJwt(SECRET, tokenFromCookie(cookie));
      expect(claims!.memberId).toBe("production-admin-id");
      expect(claims!.email).toBe("production-admin@example.com");
    } finally {
      rmSync(dirname(outputFile), { recursive: true, force: true });
    }
  }, 30_000);

  it("CLI staging default reads STAGING_* without requiring PRODUCTION_*", () => {
    const { outputFile, text } = runCli("staging", {
      STAGING_AUTH_SECRET: SECRET,
      STAGING_ADMIN_MEMBER_ID: "staging-admin-id",
      STAGING_ADMIN_EMAIL: "staging-admin@example.com",
    });
    try {
      expect(text).toMatch(/^admin_session_cookie=__Secure-authjs\.session-token=/);
    } finally {
      rmSync(dirname(outputFile), { recursive: true, force: true });
    }
  }, 30_000);

  it("CLI production mode reports only missing PRODUCTION_* names", () => {
    const dir = mkdtempSync(join(tmpdir(), "mint-admin-cookie-missing-"));
    const outputFile = join(dir, "github-output.txt");
    try {
      expect(() => execFileSync(
        "pnpm",
        ["exec", "tsx", "scripts/smoke/mint-staging-session-cookie.mts", "production"],
        {
          cwd: process.cwd(),
          env: {
            PATH: process.env.PATH,
            HOME: process.env.HOME,
            GITHUB_OUTPUT: outputFile,
            STAGING_AUTH_SECRET: SECRET,
            STAGING_ADMIN_MEMBER_ID: "staging-admin-id",
            STAGING_ADMIN_EMAIL: "staging-admin@example.com",
          },
          stdio: ["ignore", "pipe", "pipe"],
        },
      )).toThrowError(/PRODUCTION_AUTH_SECRET/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 30_000);
});
