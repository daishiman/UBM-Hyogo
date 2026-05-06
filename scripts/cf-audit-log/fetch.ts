#!/usr/bin/env tsx
import process from "node:process";
import { fetchAuditLogs } from "./cloudflare-client.ts";
import { insertEvents, WranglerD1 } from "./d1-client.ts";
import { parseArgs } from "./cli-args.ts";

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const since = args.since;
  const until = args.until;
  if (typeof since !== "string" || typeof until !== "string") {
    process.stderr.write("usage: fetch --since ISO --until ISO\n");
    process.exit(64);
  }
  const accountId = requireEnv("CLOUDFLARE_ACCOUNT_ID");
  const token = requireEnv("CF_AUDIT_TOKEN_PROD");
  const db = new WranglerD1(
    process.env.CF_AUDIT_DB ?? "ubm-hyogo-db-prod",
    "production",
  );
  const buffer = [];
  let total = 0;
  for await (const ev of fetchAuditLogs({
    accountId,
    token,
    since: new Date(since),
    until: new Date(until),
  })) {
    buffer.push(ev);
    if (buffer.length >= 50) {
      await insertEvents(db, buffer.splice(0, buffer.length));
    }
    total++;
  }
  if (buffer.length > 0) await insertEvents(db, buffer);
  process.stdout.write(JSON.stringify({ ok: true, total }) + "\n");
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    process.stderr.write(`missing env: ${name}\n`);
    process.exit(2);
  }
  return v;
}

main().catch((e: unknown) => {
  process.stderr.write(`${e instanceof Error ? e.stack ?? e.message : String(e)}\n`);
  process.exit(1);
});
