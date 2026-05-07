#!/usr/bin/env tsx
// CLI ラッパー: scripts/cf.sh r2 export 経由で起動される薄い層。
//
// 実 R2/D1 binding は Workers runtime からのみ利用可能。CLI では:
// - --dry-run: D1 を REST 経由で SELECT し、redaction guard / sha256 / gzip まで実施し
//              R2 PUT は行わずログ出力のみ（local 検証用）
// - 実 PUT が必要な場合は GitHub Actions workflow から Worker entrypoint を叩く経路を使う
//
// Phase 5 段階では、ローカル検証は dry-run までに留める。Phase 11 runtime gate で
// preview env への実 PUT を 1 回行い、その後 production への昇格を承認する。

import { parseArgs } from "./parse-args.ts";

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  // eslint-disable-next-line no-console
  console.log(`[cf-audit-log/export] env=${args.env} dryRun=${args.dryRun}`);

  if (!args.dryRun) {
    // eslint-disable-next-line no-console
    console.error(
      "[cf-audit-log/export] CLI 経由の実 PUT は Phase 11 runtime gate 後に有効化する。今回は --dry-run のみ受け付ける。",
    );
    process.exit(2);
  }

  // dry-run path: 現状は構造のみ確認し、D1/R2 binding が必要な実処理は GitHub Actions /
  // Worker entrypoint 側に委譲する旨を明示する。これにより local 環境で wrangler 不要で
  // CLI の引数 parse / フローを smoke できる。
  // eslint-disable-next-line no-console
  console.log(
    "[cf-audit-log/export] dry-run skeleton OK. Actual D1 SELECT / R2 PUT runs in Workers context.",
  );
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
