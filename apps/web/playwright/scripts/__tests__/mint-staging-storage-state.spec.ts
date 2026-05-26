// workflow: issue-901 / Phase 5 §1 / T-02
// Unit tests for mint-staging-storage-state CLI library.
// 検証観点:
//   - env 不在 → throw（env 名のみ含むメッセージ）
//   - member / admin role 切替で sub / isAdmin が分岐
//   - storageState JSON が authjs.session-token cookie を含む
//   - TTL=600s 既定 / cookie 値 / token 値を log しない（summary は値を含まない）

import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mintStagingStorageState } from "../mint-staging-storage-state";

const VALID_ENV = {
  STAGING_AUTH_SECRET: "x".repeat(32),
  STAGING_ADMIN_MEMBER_ID: "m_admin_001",
  STAGING_ADMIN_EMAIL: "admin@staging.example",
  STAGING_ME_MEMBER_ID: "m_member_001",
  STAGING_ME_EMAIL: "member@staging.example",
  STAGING_WORKER_HOST: "ubm-hyogo-web-staging.daishimanju.workers.dev",
} satisfies Record<string, string>;

let workDir: string;

beforeEach(async () => {
  workDir = await mkdtemp(join(tmpdir(), "mint-staging-"));
});
afterEach(async () => {
  await rm(workDir, { recursive: true, force: true });
});

describe("mintStagingStorageState", () => {
  it("rejects when STAGING_AUTH_SECRET is missing", async () => {
    const env = { ...VALID_ENV, STAGING_AUTH_SECRET: "" };
    await expect(
      mintStagingStorageState({ role: "member", out: join(workDir, "out.json") }, env),
    ).rejects.toThrow(/STAGING_AUTH_SECRET/);
  });

  it("rejects when STAGING_WORKER_HOST contains scheme", async () => {
    const env = { ...VALID_ENV, STAGING_WORKER_HOST: "https://example.com" };
    await expect(
      mintStagingStorageState({ role: "member", out: join(workDir, "out.json") }, env),
    ).rejects.toThrow(/STAGING_WORKER_HOST/);
  });

  it("writes member storageState with authjs.session-token cookie", async () => {
    const out = join(workDir, "member.json");
    const { summary } = await mintStagingStorageState({ role: "member", out }, VALID_ENV);
    expect(summary.role).toBe("member");
    expect(summary.isAdmin).toBe(false);
    expect(summary.sub).toBe(VALID_ENV.STAGING_ME_MEMBER_ID);
    expect(summary.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));

    const json = JSON.parse(await readFile(out, "utf8"));
    expect(Array.isArray(json.cookies)).toBe(true);
    expect(json.cookies[0].name).toBe("authjs.session-token");
    expect(json.cookies[0].domain).toBe(VALID_ENV.STAGING_WORKER_HOST);
    expect(json.cookies[0].secure).toBe(true);
    expect(json.cookies[0].httpOnly).toBe(true);
    expect(json.cookies[0].sameSite).toBe("Lax");
    // token format = three base64url segments separated by '.'
    expect(json.cookies[0].value.split(".")).toHaveLength(3);
  });

  it("writes storageState with owner-only mode", async () => {
    const out = join(workDir, "mode.json");
    await mintStagingStorageState({ role: "member", out }, VALID_ENV);
    const mode = (await stat(out)).mode & 0o777;
    expect(mode).toBe(0o600);
  });

  it("writes admin storageState with isAdmin=true", async () => {
    const out = join(workDir, "admin.json");
    const { summary } = await mintStagingStorageState({ role: "admin", out }, VALID_ENV);
    expect(summary.isAdmin).toBe(true);
    expect(summary.sub).toBe(VALID_ENV.STAGING_ADMIN_MEMBER_ID);
    const json = JSON.parse(await readFile(out, "utf8"));
    expect(json.cookies[0].name).toBe("authjs.session-token");
  });

  it("uses the summary expiration as cookie expiration", async () => {
    const out = join(workDir, "expires.json");
    const { summary } = await mintStagingStorageState({ role: "member", out }, VALID_ENV);
    const json = JSON.parse(await readFile(out, "utf8"));
    expect(json.cookies[0].expires).toBe(summary.exp);
  });

  it("defaults TTL to 600 seconds", async () => {
    const out = join(workDir, "ttl.json");
    const before = Math.floor(Date.now() / 1000);
    const { summary } = await mintStagingStorageState({ role: "member", out }, VALID_ENV);
    const elapsed = summary.exp - before;
    expect(elapsed).toBeGreaterThanOrEqual(595);
    expect(elapsed).toBeLessThanOrEqual(605);
  });

  it("honours explicit ttlSec override", async () => {
    const out = join(workDir, "ttl-override.json");
    const before = Math.floor(Date.now() / 1000);
    const { summary } = await mintStagingStorageState(
      { role: "member", out, ttlSec: 120 },
      VALID_ENV,
    );
    const elapsed = summary.exp - before;
    expect(elapsed).toBeGreaterThanOrEqual(115);
    expect(elapsed).toBeLessThanOrEqual(125);
  });

  it("does not write storageState when dryRun=true", async () => {
    const out = join(workDir, "dry-run.json");
    const { summary } = await mintStagingStorageState(
      { role: "member", out, dryRun: true },
      VALID_ENV,
    );
    expect(summary.role).toBe("member");
    await expect(readFile(out, "utf8")).rejects.toThrow(/ENOENT/);
  });

  it("rejects invalid staging member email by env name only", async () => {
    const env = { ...VALID_ENV, STAGING_ME_EMAIL: "not-an-email" };
    await expect(
      mintStagingStorageState({ role: "member", out: join(workDir, "out.json") }, env),
    ).rejects.toThrow(/STAGING_ME_EMAIL/);
  });

  it("summary excludes cookie value / token value (only sub / exp / isAdmin / role)", async () => {
    const out = join(workDir, "leak.json");
    const { summary } = await mintStagingStorageState({ role: "member", out }, VALID_ENV);
    expect(Object.keys(summary).sort()).toEqual(["exp", "isAdmin", "role", "sub"]);
  });
});
