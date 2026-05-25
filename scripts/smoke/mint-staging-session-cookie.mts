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

const DEFAULT_TTL_SECONDS = 600;
const DEFAULT_COOKIE_NAME = "__Secure-authjs.session-token";

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
  const required = {
    STAGING_AUTH_SECRET: process.env.STAGING_AUTH_SECRET,
    STAGING_ADMIN_MEMBER_ID: process.env.STAGING_ADMIN_MEMBER_ID,
    STAGING_ADMIN_EMAIL: process.env.STAGING_ADMIN_EMAIL,
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
    authSecret: required.STAGING_AUTH_SECRET!,
    memberId: required.STAGING_ADMIN_MEMBER_ID!,
    email: required.STAGING_ADMIN_EMAIL!,
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
