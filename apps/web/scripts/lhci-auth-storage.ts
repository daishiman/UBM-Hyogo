import { signSessionJwt, type MemberId } from "@ubm-hyogo/shared";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

type StorageStateCookie = {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite: "Lax" | "Strict" | "None";
};

type StorageState = {
  cookies: StorageStateCookie[];
  origins: [];
};

const TEST_MEMBER_ID = "e2e-lhci-member-0001" as MemberId;
const COOKIE_NAME = "authjs.session-token";
const TTL_SEC = 60 * 60;

export async function main(
  outPath: string = fileURLToPath(
    new URL("../.lhci/storage-state.json", import.meta.url),
  ),
): Promise<void> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required");

  const token = await signSessionJwt(secret, {
    memberId: TEST_MEMBER_ID,
    isAdmin: false,
    name: "LHCI Test Member",
    email: "lhci-test@example.invalid",
    ttlSeconds: TTL_SEC,
  });

  const state: StorageState = {
    cookies: [
      {
        name: COOKIE_NAME,
        value: token,
        domain: "localhost",
        path: "/",
        expires: Math.floor(Date.now() / 1000) + TTL_SEC,
        httpOnly: true,
        secure: false,
        sameSite: "Lax",
      },
    ],
    origins: [],
  };

  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(state, null, 2), "utf8");
  console.log(`[lhci-auth-storage] wrote ${outPath}`);
}

const isDirectInvocation =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectInvocation) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
