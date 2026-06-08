// CI 実行時に staging runtime smoke 用の短命 session JWT を mint する helper。
// 静的 bearer secret は 24h TTL で必ず失効するため、署名鍵 (STAGING_AUTH_SECRET) から
// 実行毎に TTL=600s の JWT を発行し、失効を原理的に起こさない。
// JWT 文字列は console / stdout に絶対 echo せず、GITHUB_OUTPUT への追記のみ行う。
// mask は呼び出し元 workflow が GITHUB_OUTPUT 消費前に ::add-mask:: を適用する。

import { appendFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { signSessionJwt, verifySessionJwt } from "@ubm-hyogo/shared";
import type { MemberId } from "@ubm-hyogo/shared";

interface MintedBearers {
  readonly adminBearer: string;
  readonly meBearer: string;
  readonly memberId: string;
}

const DEFAULT_TTL_SECONDS = 600;
export const MINT_ROLES = ["admin", "me"] as const;
export type MintRole = (typeof MINT_ROLES)[number];
export const COMMON_REQUIRED_ENV = ["STAGING_AUTH_SECRET"] as const;
export const ROLE_REQUIRED_ENV = {
  admin: ["STAGING_ADMIN_MEMBER_ID", "STAGING_ADMIN_EMAIL"],
  me: ["STAGING_ME_MEMBER_ID", "STAGING_ME_EMAIL"],
} as const satisfies Record<MintRole, readonly string[]>;

export interface MintRoleResult {
  readonly adminBearer?: string;
  readonly meBearer?: string;
  readonly memberId?: string;
}

type EnvMap = Record<string, string | undefined>;

export function parseRoles(value: string | undefined): MintRole[] {
  if (!value || value.trim() === "") return [...MINT_ROLES];
  const seen = new Set<MintRole>();
  for (const raw of value.split(",")) {
    const role = raw.trim();
    if (role !== "admin" && role !== "me") {
      throw new Error(`unknown role: ${role || "(empty)"}`);
    }
    seen.add(role);
  }
  const roles = MINT_ROLES.filter((role) => seen.has(role));
  if (roles.length === 0) {
    throw new Error("at least one mint role is required");
  }
  return roles;
}

export function requiredEnvForRoles(roles: readonly MintRole[]): string[] {
  return [...new Set([
    ...COMMON_REQUIRED_ENV,
    ...roles.flatMap((role) => ROLE_REQUIRED_ENV[role]),
  ])];
}

export function findMissingEnv(requiredNames: readonly string[], env: EnvMap): string[] {
  return requiredNames.filter((name) => !env[name]);
}

// 純粋関数: env を引数で受け取り JWT を返す。process.env を直接読まない（test 可能化）。
export async function mintStagingBearers(env: {
  authSecret: string;
  adminMemberId: string;
  adminEmail: string;
  meMemberId: string;
  meEmail: string;
  ttlSeconds?: number;
}): Promise<MintedBearers> {
  const ttlSeconds = env.ttlSeconds ?? DEFAULT_TTL_SECONDS;
  const adminBearer = await signSessionJwt(env.authSecret, {
    memberId: env.adminMemberId as MemberId,
    email: env.adminEmail,
    isAdmin: true,
    ttlSeconds,
  });
  const meBearer = await signSessionJwt(env.authSecret, {
    memberId: env.meMemberId as MemberId,
    email: env.meEmail,
    isAdmin: false,
    ttlSeconds,
  });
  const [adminClaims, meClaims] = await Promise.all([
    verifySessionJwt(adminBearer, env.authSecret),
    verifySessionJwt(meBearer, env.authSecret),
  ]);
  if (
    !adminClaims ||
    !meClaims ||
    adminClaims.memberId !== env.adminMemberId ||
    adminClaims.isAdmin !== true ||
    meClaims.memberId !== env.meMemberId ||
    meClaims.isAdmin !== false
  ) {
    throw new Error("minted bearer self verification failed");
  }
  return { adminBearer, meBearer, memberId: env.adminMemberId };
}

export async function mintStagingBearersForRoles(
  roles: readonly MintRole[],
  env: EnvMap & { ttlSeconds?: number },
): Promise<MintRoleResult> {
  const ttlSeconds = env.ttlSeconds ?? DEFAULT_TTL_SECONDS;
  const result: {
    adminBearer?: string;
    meBearer?: string;
    memberId?: string;
  } = {};
  const authSecret = env.STAGING_AUTH_SECRET!;

  if (roles.includes("admin")) {
    const adminBearer = await signSessionJwt(authSecret, {
      memberId: env.STAGING_ADMIN_MEMBER_ID! as MemberId,
      email: env.STAGING_ADMIN_EMAIL!,
      isAdmin: true,
      ttlSeconds,
    });
    const adminClaims = await verifySessionJwt(adminBearer, authSecret);
    if (
      !adminClaims ||
      adminClaims.memberId !== env.STAGING_ADMIN_MEMBER_ID ||
      adminClaims.isAdmin !== true
    ) {
      throw new Error("minted admin bearer self verification failed");
    }
    result.adminBearer = adminBearer;
    result.memberId = env.STAGING_ADMIN_MEMBER_ID;
  }

  if (roles.includes("me")) {
    const meBearer = await signSessionJwt(authSecret, {
      memberId: env.STAGING_ME_MEMBER_ID! as MemberId,
      email: env.STAGING_ME_EMAIL!,
      isAdmin: false,
      ttlSeconds,
    });
    const meClaims = await verifySessionJwt(meBearer, authSecret);
    if (
      !meClaims ||
      meClaims.memberId !== env.STAGING_ME_MEMBER_ID ||
      meClaims.isAdmin !== false
    ) {
      throw new Error("minted me bearer self verification failed");
    }
    result.meBearer = meBearer;
    if (!result.memberId) result.memberId = env.STAGING_ME_MEMBER_ID;
  }

  return result;
}

function rolesFromArgs(args: readonly string[]): string | undefined {
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--roles") return args[index + 1];
    if (arg?.startsWith("--roles=")) return arg.slice("--roles=".length);
  }
  return undefined;
}

async function main(): Promise<void> {
  let roles: MintRole[];
  try {
    roles = parseRoles(rolesFromArgs(process.argv.slice(2)) ?? process.env.MINT_ROLES);
  } catch (error) {
    process.stderr.write(`mint-staging-bearers: ${(error as Error).message}\n`);
    process.exit(2);
  }

  const requiredNames = requiredEnvForRoles(roles);
  const missing = findMissingEnv(requiredNames, process.env);
  if (missing.length > 0) {
    // 値ではなく env 名のみを stderr に出す（JWT / 鍵を露出しない）。
    if (process.env.RUNTIME_SMOKE_MINT_DEGRADE === "1") {
      process.stderr.write(
        `mint-staging-bearers: degraded (missing env: ${missing.join(", ")}); skipping mint\n`,
      );
      const out = process.env.GITHUB_OUTPUT;
      if (out) appendFileSync(out, "mint_degraded=1\n");
      process.exit(0);
    }
    process.stderr.write(
      `mint-staging-bearers: missing env: ${missing.join(", ")}\n`,
    );
    process.exit(2);
  }

  const ttlSeconds = process.env.MINT_TTL_SECONDS
    ? Number(process.env.MINT_TTL_SECONDS)
    : DEFAULT_TTL_SECONDS;

  const minted = await mintStagingBearersForRoles(roles, {
    STAGING_AUTH_SECRET: process.env.STAGING_AUTH_SECRET,
    STAGING_ADMIN_MEMBER_ID: process.env.STAGING_ADMIN_MEMBER_ID,
    STAGING_ADMIN_EMAIL: process.env.STAGING_ADMIN_EMAIL,
    STAGING_ME_MEMBER_ID: process.env.STAGING_ME_MEMBER_ID,
    STAGING_ME_EMAIL: process.env.STAGING_ME_EMAIL,
    ttlSeconds,
  });

  // GITHUB_OUTPUT へ key=value 追記のみ。console / stdout への JWT echo は禁止。
  const out = process.env.GITHUB_OUTPUT;
  if (out) {
    if (minted.adminBearer) appendFileSync(out, `admin_bearer=${minted.adminBearer}\n`);
    if (minted.meBearer) appendFileSync(out, `me_bearer=${minted.meBearer}\n`);
    if (minted.memberId) appendFileSync(out, `member_id=${minted.memberId}\n`);
  } else {
    process.stderr.write("mint-staging-bearers: GITHUB_OUTPUT is not set; nothing written\n");
  }
}

// import.meta.main 相当の guard。test import 時は走らせず、tsx 直接実行時のみ main を走らせる。
// パスに非 ASCII（例: 日本語ディレクトリ）が含まれても一致するよう pathToFileURL で正規化する。
const entry = process.argv[1] ?? "";
const isCliEntry = entry !== "" && import.meta.url === pathToFileURL(entry).href;

if (isCliEntry) {
  await main();
}
