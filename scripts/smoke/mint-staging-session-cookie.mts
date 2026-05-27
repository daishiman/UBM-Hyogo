// CI runtime smoke 用に authenticated /admin probe の短命 session cookie を mint する。
// 値は stdout に出さず、CLI 実行時は GITHUB_OUTPUT へだけ追記する。

import { appendFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { encodeAuthSessionJwt } from "@ubm-hyogo/shared";

export interface MintSessionCookieInput {
  readonly authSecret: string;
  readonly memberId: string;
  readonly email: string;
  readonly isAdmin: boolean;
  readonly ttlSeconds?: number;
  readonly cookieName?: string;
}

export type RuntimeSmokeEnv = "staging" | "production";

const DEFAULT_TTL_SECONDS = 600;
const DEFAULT_COOKIE_NAME = "__Secure-authjs.session-token";

export function resolveEnvPrefix(env: string): string {
  if (env === "staging") return "STAGING";
  if (env === "production") return "PRODUCTION";
  throw new Error(`unsupported runtime smoke env: ${env}`);
}

export async function mintStagingSessionCookie(
  input: MintSessionCookieInput,
): Promise<string> {
  if (!input.authSecret) throw new Error("AUTH_SECRET missing");
  if (!input.memberId) throw new Error("memberId missing");
  if (!input.email) throw new Error("email missing");
  const cookieName = input.cookieName ?? DEFAULT_COOKIE_NAME;
  const token = await encodeAuthSessionJwt(
    input.authSecret,
    {
      memberId: input.memberId,
      sub: input.memberId,
      email: input.email,
      isAdmin: input.isAdmin,
    },
    input.ttlSeconds ?? DEFAULT_TTL_SECONDS,
  );
  return `${cookieName}=${token}`;
}

async function main(): Promise<void> {
  const runtimeEnv = (process.argv[2] ?? "staging") as RuntimeSmokeEnv;
  let prefix: string;
  try {
    prefix = resolveEnvPrefix(runtimeEnv);
  } catch (error) {
    process.stderr.write(`mint-staging-session-cookie: ${(error as Error).message}\n`);
    process.exit(2);
  }

  const authSecretName = `${prefix}_AUTH_SECRET`;
  const memberIdName = `${prefix}_ADMIN_MEMBER_ID`;
  const emailName = `${prefix}_ADMIN_EMAIL`;
  const required = {
    [authSecretName]: process.env[authSecretName],
    [memberIdName]: process.env[memberIdName],
    [emailName]: process.env[emailName],
  };
  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([name]) => name);
  if (missing.length > 0) {
    process.stderr.write(`mint-staging-session-cookie: missing env: ${missing.join(", ")}\n`);
    process.exit(2);
  }

  const ttlSeconds = process.env.MINT_TTL_SECONDS
    ? Number(process.env.MINT_TTL_SECONDS)
    : DEFAULT_TTL_SECONDS;
  const cookie = await mintStagingSessionCookie({
    authSecret: required[authSecretName]!,
    memberId: required[memberIdName]!,
    email: required[emailName]!,
    isAdmin: true,
    ttlSeconds,
    cookieName: process.env.SESSION_COOKIE_NAME || DEFAULT_COOKIE_NAME,
  });

  const out = process.env.GITHUB_OUTPUT;
  if (out) {
    appendFileSync(out, `admin_session_cookie=${cookie}\n`);
  } else {
    process.stderr.write("mint-staging-session-cookie: GITHUB_OUTPUT is not set; nothing written\n");
  }
}

const entry = process.argv[1] ?? "";
const isCliEntry = entry !== "" && import.meta.url === pathToFileURL(entry).href;

if (isCliEntry) {
  await main();
}
