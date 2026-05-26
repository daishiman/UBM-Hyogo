// workflow: issue-901-authenticated-profile-admin-staging-visual / Phase 5 §1
// Mint a Playwright storageState JSON containing an authjs.session-token cookie
// signed with the staging AUTH_SECRET. Used by the staging-visual-authenticated
// project to capture authenticated profile / admin runtime baselines.
//
// 不変条件:
//   - cookie 値 / token 値を log / stdout に出さない（env 名のみ参照可）
//   - 出力 JSON は git にコミットしない（apps/web/.gitignore で playwright/.auth/ を除外）
//   - TTL は既存 runtime smoke (mint-staging-bearers.mts) と同じ 600s に統一

import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { asMemberId, signSessionJwt } from "@ubm-hyogo/shared";
import { z } from "zod";

const EnvSchema = z.object({
  STAGING_AUTH_SECRET: z.string().min(32),
  STAGING_ADMIN_MEMBER_ID: z.string().min(1),
  STAGING_ADMIN_EMAIL: z.string().email(),
  STAGING_ME_MEMBER_ID: z.string().min(1),
  STAGING_ME_EMAIL: z.string().email(),
  STAGING_WORKER_HOST: z
    .string()
    .min(1)
    .regex(/^[a-z0-9.-]+$/, "STAGING_WORKER_HOST must be a bare host (no scheme / port)"),
});

export type Role = "member" | "admin";

export interface MintArgs {
  readonly role: Role;
  readonly out: string;
  readonly ttlSec?: number;
  readonly dryRun?: boolean;
}

export interface MintSummary {
  readonly role: Role;
  readonly sub: string;
  readonly exp: number;
  readonly isAdmin: boolean;
}

export interface MintResult {
  readonly summary: MintSummary;
}

const COOKIE_NAME = "authjs.session-token";
const DEFAULT_TTL_SEC = 600;

export async function mintStagingStorageState(
  args: MintArgs,
  env: Readonly<Record<string, string | undefined>> = process.env,
): Promise<MintResult> {
  const parsed = EnvSchema.safeParse(env);
  if (!parsed.success) {
    const missing = parsed.error.issues
      .map((issue) => issue.path.join("."))
      .filter((name) => name.length > 0);
    const message =
      missing.length > 0
        ? `mint-staging-storage-state: missing/invalid env: ${missing.join(", ")}`
        : "mint-staging-storage-state: env validation failed";
    throw new Error(message);
  }
  const e = parsed.data;

  const sub = args.role === "admin" ? e.STAGING_ADMIN_MEMBER_ID : e.STAGING_ME_MEMBER_ID;
  const email = args.role === "admin" ? e.STAGING_ADMIN_EMAIL : e.STAGING_ME_EMAIL;
  const isAdmin = args.role === "admin";

  const iat = Math.floor(Date.now() / 1000);
  const ttl = args.ttlSec ?? DEFAULT_TTL_SEC;
  const exp = iat + ttl;

  const token = await signSessionJwt(e.STAGING_AUTH_SECRET, {
    memberId: asMemberId(sub),
    email,
    isAdmin,
    nowSeconds: iat,
    ttlSeconds: ttl,
  });

  const storage = {
    cookies: [
      {
        name: COOKIE_NAME,
        value: token,
        domain: e.STAGING_WORKER_HOST,
        path: "/",
        expires: exp,
        httpOnly: true,
        secure: true,
        sameSite: "Lax" as const,
      },
    ],
    origins: [] as const,
  };

  if (!args.dryRun) {
    await mkdir(dirname(args.out), { recursive: true });
    await writeFile(args.out, JSON.stringify(storage), { mode: 0o600 });
  }

  return { summary: { role: args.role, sub, exp, isAdmin } };
}

function parseArgv(argv: readonly string[]): { role: Role; out: string; ttlSec?: number; dryRun: boolean } {
  let role: Role | undefined;
  let out: string | undefined;
  let ttlSec: number | undefined;
  let dryRun = false;
  for (const raw of argv) {
    if (raw.startsWith("--role=")) {
      const v = raw.slice("--role=".length);
      if (v !== "member" && v !== "admin") throw new Error("--role must be 'member' | 'admin'");
      role = v;
    } else if (raw.startsWith("--out=")) {
      out = raw.slice("--out=".length);
    } else if (raw.startsWith("--ttl=")) {
      ttlSec = Number(raw.slice("--ttl=".length));
      if (!Number.isFinite(ttlSec) || ttlSec <= 0) throw new Error("--ttl must be positive integer");
    } else if (raw === "--dry-run") {
      dryRun = true;
    }
  }
  if (!role) throw new Error("--role=member|admin is required");
  if (!out) throw new Error("--out=<path> is required");
  return { role, out, ...(ttlSec !== undefined ? { ttlSec } : {}), dryRun };
}

const isDirectInvocation =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectInvocation) {
  (async () => {
    const args = parseArgv(process.argv.slice(2));
    const { summary } = await mintStagingStorageState(args);
    // 値 / token は出力しない。sub / exp / isAdmin / role のみ。
    process.stdout.write(`${JSON.stringify(summary)}\n`);
  })().catch((err) => {
    process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
  });
}
