#!/usr/bin/env tsx
import process from "node:process";
import { writeFileSync } from "node:fs";
import { runBaselineMain } from "./baseline.ts";
import { WranglerD1 } from "./d1-client.ts";
import { parseArgs } from "./cli-args.ts";

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const days = typeof args.days === "string" ? Number(args.days) : 7;
  const db = new WranglerD1(
    process.env.CF_AUDIT_DB ?? "ubm-hyogo-db-prod",
    "production",
  );
  const b = await runBaselineMain(db, days);
  const json = JSON.stringify(b, null, 2) + "\n";
  if (typeof args.output === "string") {
    writeFileSync(args.output, json);
  }
  process.stdout.write(json);
}

main().catch((e: unknown) => {
  process.stderr.write(
    `${e instanceof Error ? e.stack ?? e.message : String(e)}\n`,
  );
  process.exit(1);
});
