import { loadExpected } from "./load.ts";
import { canonicalizeSentryPolicy } from "./canonicalize.ts";
import { diffPolicy } from "./diff.ts";
import { createAlertRule, listAlertRules, updateAlertRule } from "./api-client.ts";
import path from "node:path";
import { fileURLToPath } from "node:url";

interface Flags {
  json: boolean;
  yes: boolean;
  ci: boolean;
}

function parseFlags(argv: string[]): Flags {
  return {
    json: argv.includes("--json"),
    yes: argv.includes("--yes"),
    ci: argv.includes("--ci"),
  };
}

function print(value: unknown, flags: Flags): void {
  if (flags.json) console.log(JSON.stringify(value, null, 2));
  else console.log(typeof value === "string" ? value : JSON.stringify(value, null, 2));
}

async function loadActual() {
  return (await listAlertRules()).map(canonicalizeSentryPolicy);
}

async function cmdList(flags: Flags): Promise<number> {
  print({ expected: loadExpected(process.cwd()), actual: await loadActual() }, flags);
  return 0;
}

async function cmdDiff(flags: Flags, plan: boolean): Promise<number> {
  const drifts = diffPolicy(loadExpected(process.cwd()), await loadActual());
  print(drifts.length === 0 && !flags.json ? "no drift detected" : drifts, flags);
  return plan || drifts.length === 0 ? 0 : 2;
}

async function cmdApply(flags: Flags): Promise<number> {
  if (flags.ci) {
    console.error("apply is forbidden in --ci mode");
    return 78;
  }
  const actual = await listAlertRules();
  const byName = new Map(actual.map((rule) => [rule.name, rule]));
  for (const policy of loadExpected(process.cwd())) {
    const existing = byName.get(policy.name);
    if (!flags.yes) {
      console.log(`[dry-run] ${existing ? "PUT" : "POST"} ${policy.name}`);
      continue;
    }
    if (existing?.id) await updateAlertRule(existing.id, policy);
    else await createAlertRule(policy);
  }
  return 0;
}

export async function runCli(argv: string[]): Promise<number> {
  const [cmd, ...rest] = argv;
  const flags = parseFlags(rest);
  try {
    if (cmd === "list") return await cmdList(flags);
    if (cmd === "diff") return await cmdDiff(flags, false);
    if (cmd === "plan") return await cmdDiff(flags, true);
    if (cmd === "apply") return await cmdApply(flags);
    console.error("usage: sentry-alerts {list|diff|plan|apply} [--json] [--ci] [--yes]");
    return 64;
  } catch (error) {
    console.error((error as Error).message);
    return 78;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  void runCli(process.argv.slice(2)).then((code) => {
    process.exitCode = code;
  });
}
