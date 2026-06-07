import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { asMemberId, signSessionJwt } from "@ubm-hyogo/shared";

interface Manifest {
  readonly members: readonly {
    readonly memberId: string;
    readonly email: string;
    readonly fullName: string;
    readonly loginable: boolean;
    readonly storageStateName: string;
  }[];
  readonly admins: readonly {
    readonly adminId: string;
    readonly email: string;
    readonly displayName: string;
    readonly active: boolean;
    readonly storageStateName: string;
  }[];
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const repoRoot = resolve(root, "../..");
const manifestPath = resolve(repoRoot, "apps/api/migrations/seed/test-accounts.manifest.json");

const readManifest = async (): Promise<Manifest> =>
  JSON.parse(await readFile(manifestPath, "utf8")) as Manifest;

const storageState = (token: string) => ({
  cookies: [
    {
      name: "authjs.session-token",
      value: token,
      domain: "localhost",
      path: "/",
      expires: -1,
      httpOnly: true,
      secure: false,
      sameSite: "Lax" as const,
    },
  ],
  origins: [],
});

const main = async (): Promise<void> => {
  const accountId = process.argv[2];
  const outArg = process.argv[3];
  const secret = process.env.AUTH_SECRET;
  if (!accountId) throw new Error("account id required");
  if (!secret) throw new Error("AUTH_SECRET required");

  const manifest = await readManifest();
  const member = manifest.members.find((item) => item.memberId === accountId);
  const admin = manifest.admins.find((item) => item.adminId === accountId);
  if (!member && !admin) throw new Error(`unknown test account: ${accountId}`);
  if (member && !member.loginable) throw new Error(`member is not loginable: ${accountId}`);
  if (admin && !admin.active) throw new Error(`admin is not active: ${accountId}`);

  const token = await signSessionJwt(secret, {
    memberId: asMemberId(member?.memberId ?? admin!.adminId),
    email: member?.email ?? admin!.email,
    name: member?.fullName ?? admin!.displayName,
    isAdmin: Boolean(admin),
  });
  const out = resolve(root, outArg ?? `playwright/.auth/${member?.storageStateName ?? admin!.storageStateName}`);
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, `${JSON.stringify(storageState(token), null, 2)}\n`, { mode: 0o600 });
  console.log(`wrote ${out}`);
};

await main();
