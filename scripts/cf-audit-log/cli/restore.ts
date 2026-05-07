#!/usr/bin/env tsx
// CLI ラッパー: scripts/cf.sh r2 restore 経由で起動される薄い層。
// 実 R2/D1 binding は Workers runtime からのみ利用可能（Phase 11 runtime gate）。

import { parseArgs } from "./parse-args.ts";

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  // eslint-disable-next-line no-console
  console.log(
    `[cf-audit-log/restore] env=${args.env} randomPick=${args.randomPick} verify=${args.verify} force=${args.force}`,
  );
  // eslint-disable-next-line no-console
  console.log(
    "[cf-audit-log/restore] CLI skeleton. Actual R2 GET / D1 tmp restore runs in Workers context.",
  );
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
