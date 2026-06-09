# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: visual-staging-authenticated/setup.staging-auth.ts >> mint member storageState
- Location: playwright/tests/visual-staging-authenticated/setup.staging-auth.ts:16:1

# Error details

```
Error: mint-staging-storage-state: missing/invalid env: STAGING_AUTH_SECRET, STAGING_ADMIN_MEMBER_ID, STAGING_ADMIN_EMAIL, STAGING_ME_MEMBER_ID, STAGING_ME_EMAIL, STAGING_WORKER_HOST
```

# Test source

```ts
  1   | // workflow: issue-901-authenticated-profile-admin-staging-visual / Phase 5 §1
  2   | // Mint a Playwright storageState JSON containing an authjs.session-token cookie
  3   | // signed with the staging AUTH_SECRET. Used by the staging-visual-authenticated
  4   | // project to capture authenticated profile / admin runtime baselines.
  5   | //
  6   | // 不変条件:
  7   | //   - cookie 値 / token 値を log / stdout に出さない（env 名のみ参照可）
  8   | //   - 出力 JSON は git にコミットしない（apps/web/.gitignore で playwright/.auth/ を除外）
  9   | //   - TTL は既存 runtime smoke (mint-staging-bearers.mts) と同じ 600s に統一
  10  | 
  11  | import { mkdir, writeFile } from "node:fs/promises";
  12  | import { dirname } from "node:path";
  13  | import { pathToFileURL } from "node:url";
  14  | import { asMemberId, signSessionJwt } from "@ubm-hyogo/shared";
  15  | import { z } from "zod";
  16  | 
  17  | const EnvSchema = z.object({
  18  |   STAGING_AUTH_SECRET: z.string().min(32),
  19  |   STAGING_ADMIN_MEMBER_ID: z.string().min(1),
  20  |   STAGING_ADMIN_EMAIL: z.string().email(),
  21  |   STAGING_ME_MEMBER_ID: z.string().min(1),
  22  |   STAGING_ME_EMAIL: z.string().email(),
  23  |   STAGING_WORKER_HOST: z
  24  |     .string()
  25  |     .min(1)
  26  |     .regex(/^[a-z0-9.-]+$/, "STAGING_WORKER_HOST must be a bare host (no scheme / port)"),
  27  | });
  28  | 
  29  | export type Role = "member" | "admin";
  30  | 
  31  | export interface MintArgs {
  32  |   readonly role: Role;
  33  |   readonly out: string;
  34  |   readonly ttlSec?: number;
  35  |   readonly dryRun?: boolean;
  36  | }
  37  | 
  38  | export interface MintSummary {
  39  |   readonly role: Role;
  40  |   readonly sub: string;
  41  |   readonly exp: number;
  42  |   readonly isAdmin: boolean;
  43  | }
  44  | 
  45  | export interface MintResult {
  46  |   readonly summary: MintSummary;
  47  | }
  48  | 
  49  | const COOKIE_NAME = "authjs.session-token";
  50  | const DEFAULT_TTL_SEC = 600;
  51  | 
  52  | export async function mintStagingStorageState(
  53  |   args: MintArgs,
  54  |   env: Readonly<Record<string, string | undefined>> = process.env,
  55  | ): Promise<MintResult> {
  56  |   const parsed = EnvSchema.safeParse(env);
  57  |   if (!parsed.success) {
  58  |     const missing = parsed.error.issues
  59  |       .map((issue) => issue.path.join("."))
  60  |       .filter((name) => name.length > 0);
  61  |     const message =
  62  |       missing.length > 0
  63  |         ? `mint-staging-storage-state: missing/invalid env: ${missing.join(", ")}`
  64  |         : "mint-staging-storage-state: env validation failed";
> 65  |     throw new Error(message);
      |           ^ Error: mint-staging-storage-state: missing/invalid env: STAGING_AUTH_SECRET, STAGING_ADMIN_MEMBER_ID, STAGING_ADMIN_EMAIL, STAGING_ME_MEMBER_ID, STAGING_ME_EMAIL, STAGING_WORKER_HOST
  66  |   }
  67  |   const e = parsed.data;
  68  | 
  69  |   const sub = args.role === "admin" ? e.STAGING_ADMIN_MEMBER_ID : e.STAGING_ME_MEMBER_ID;
  70  |   const email = args.role === "admin" ? e.STAGING_ADMIN_EMAIL : e.STAGING_ME_EMAIL;
  71  |   const isAdmin = args.role === "admin";
  72  | 
  73  |   const iat = Math.floor(Date.now() / 1000);
  74  |   const ttl = args.ttlSec ?? DEFAULT_TTL_SEC;
  75  |   const exp = iat + ttl;
  76  | 
  77  |   const token = await signSessionJwt(e.STAGING_AUTH_SECRET, {
  78  |     memberId: asMemberId(sub),
  79  |     email,
  80  |     isAdmin,
  81  |     nowSeconds: iat,
  82  |     ttlSeconds: ttl,
  83  |   });
  84  | 
  85  |   const storage = {
  86  |     cookies: [
  87  |       {
  88  |         name: COOKIE_NAME,
  89  |         value: token,
  90  |         domain: e.STAGING_WORKER_HOST,
  91  |         path: "/",
  92  |         expires: exp,
  93  |         httpOnly: true,
  94  |         secure: true,
  95  |         sameSite: "Lax" as const,
  96  |       },
  97  |     ],
  98  |     origins: [] as const,
  99  |   };
  100 | 
  101 |   if (!args.dryRun) {
  102 |     await mkdir(dirname(args.out), { recursive: true });
  103 |     await writeFile(args.out, JSON.stringify(storage), { mode: 0o600 });
  104 |   }
  105 | 
  106 |   return { summary: { role: args.role, sub, exp, isAdmin } };
  107 | }
  108 | 
  109 | function parseArgv(argv: readonly string[]): { role: Role; out: string; ttlSec?: number; dryRun: boolean } {
  110 |   let role: Role | undefined;
  111 |   let out: string | undefined;
  112 |   let ttlSec: number | undefined;
  113 |   let dryRun = false;
  114 |   for (const raw of argv) {
  115 |     if (raw.startsWith("--role=")) {
  116 |       const v = raw.slice("--role=".length);
  117 |       if (v !== "member" && v !== "admin") throw new Error("--role must be 'member' | 'admin'");
  118 |       role = v;
  119 |     } else if (raw.startsWith("--out=")) {
  120 |       out = raw.slice("--out=".length);
  121 |     } else if (raw.startsWith("--ttl=")) {
  122 |       ttlSec = Number(raw.slice("--ttl=".length));
  123 |       if (!Number.isFinite(ttlSec) || ttlSec <= 0) throw new Error("--ttl must be positive integer");
  124 |     } else if (raw === "--dry-run") {
  125 |       dryRun = true;
  126 |     }
  127 |   }
  128 |   if (!role) throw new Error("--role=member|admin is required");
  129 |   if (!out) throw new Error("--out=<path> is required");
  130 |   return { role, out, ...(ttlSec !== undefined ? { ttlSec } : {}), dryRun };
  131 | }
  132 | 
  133 | const isDirectInvocation =
  134 |   typeof process !== "undefined" &&
  135 |   Array.isArray(process.argv) &&
  136 |   process.argv[1] !== undefined &&
  137 |   import.meta.url === pathToFileURL(process.argv[1]).href;
  138 | 
  139 | if (isDirectInvocation) {
  140 |   (async () => {
  141 |     const args = parseArgv(process.argv.slice(2));
  142 |     const { summary } = await mintStagingStorageState(args);
  143 |     // 値 / token は出力しない。sub / exp / isAdmin / role のみ。
  144 |     process.stdout.write(`${JSON.stringify(summary)}\n`);
  145 |   })().catch((err) => {
  146 |     process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  147 |     process.exit(1);
  148 |   });
  149 | }
  150 | 
```