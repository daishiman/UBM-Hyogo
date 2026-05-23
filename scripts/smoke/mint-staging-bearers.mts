// CI 実行時に staging runtime smoke 用の短命 session JWT を mint する helper。
// 静的 bearer secret は 24h TTL で必ず失効するため、署名鍵 (STAGING_AUTH_SECRET) から
// 実行毎に TTL=600s の JWT を発行し、失効を原理的に起こさない。
// JWT 文字列は console / stdout に絶対 echo せず、GITHUB_OUTPUT への追記のみ行う。
// mask は呼び出し元 workflow が GITHUB_OUTPUT 消費前に ::add-mask:: を適用する。

import { appendFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { signSessionJwt } from "@ubm-hyogo/shared";
import type { MemberId } from "@ubm-hyogo/shared";

interface MintedBearers {
  readonly adminBearer: string;
  readonly meBearer: string;
  readonly memberId: string;
}

const DEFAULT_TTL_SECONDS = 600;

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
  return { adminBearer, meBearer, memberId: env.adminMemberId };
}

async function main(): Promise<void> {
  const required = {
    STAGING_AUTH_SECRET: process.env.STAGING_AUTH_SECRET,
    STAGING_ADMIN_MEMBER_ID: process.env.STAGING_ADMIN_MEMBER_ID,
    STAGING_ADMIN_EMAIL: process.env.STAGING_ADMIN_EMAIL,
    STAGING_ME_MEMBER_ID: process.env.STAGING_ME_MEMBER_ID,
    STAGING_ME_EMAIL: process.env.STAGING_ME_EMAIL,
  };
  const missing = Object.entries(required)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length > 0) {
    // 値ではなく env 名のみを stderr に出す（JWT / 鍵を露出しない）。
    process.stderr.write(`mint-staging-bearers: missing env: ${missing.join(", ")}\n`);
    process.exit(2);
  }

  const ttlSeconds = process.env.MINT_TTL_SECONDS
    ? Number(process.env.MINT_TTL_SECONDS)
    : DEFAULT_TTL_SECONDS;

  const minted = await mintStagingBearers({
    authSecret: required.STAGING_AUTH_SECRET!,
    adminMemberId: required.STAGING_ADMIN_MEMBER_ID!,
    adminEmail: required.STAGING_ADMIN_EMAIL!,
    meMemberId: required.STAGING_ME_MEMBER_ID!,
    meEmail: required.STAGING_ME_EMAIL!,
    ttlSeconds,
  });

  // GITHUB_OUTPUT へ key=value 追記のみ。console / stdout への JWT echo は禁止。
  const out = process.env.GITHUB_OUTPUT;
  if (out) {
    appendFileSync(out, `admin_bearer=${minted.adminBearer}\n`);
    appendFileSync(out, `me_bearer=${minted.meBearer}\n`);
    appendFileSync(out, `member_id=${minted.memberId}\n`);
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
