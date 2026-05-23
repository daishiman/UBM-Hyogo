/**
 * UT-17-Followup-004: CLI
 *
 * `cf.sh alerts {list|diff|plan|apply}` から exec される Node CLI 本体。
 * Phase 8 §8-8。
 *
 * exit codes:
 *   0 — success / no drift / dry-run
 *   2 — drift detected (diff)
 *  64 — usage error
 *  78 — config error (e.g. missing env)
 */
import { loadExpected } from "./load.ts";
import {
  listPolicies,
  listWebhooks,
  createPolicy,
  updatePolicy,
  createWebhook,
  updateWebhook,
  setAlertTokenMode,
} from "./api-client.ts";
import { canonicalizePolicy, canonicalizeWebhook } from "./canonicalize.ts";
import { diffPolicy, diffWebhook, type Drift } from "./diff.ts";
import { resolveWebhookId } from "./resolve.ts";
import { execFileSync } from "node:child_process";
import type { CanonicalPolicy, CanonicalWebhook, WebhookListEntry } from "./types.ts";

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

function resolveRef(ref: string): string {
  // op:// 参照を op CLI で読み出す。CF_ALERTS_MOCK_DIR が設定されていればダミー値を返す。
  if (process.env.CF_ALERTS_MOCK_DIR) {
    if (ref.endsWith("/url")) return "https://relay-worker-host.example.invalid/internal/alert-relay";
    return `mock:${ref}`;
  }
  if (ref === "op://UBM-Hyogo/UT-17 Alert Relay/url" && process.env.CLOUDFLARE_ALERT_RELAY_URL) {
    return process.env.CLOUDFLARE_ALERT_RELAY_URL;
  }
  if (process.env.CF_ALERTS_CI_MODE === "1") {
    throw new Error(`CI mode cannot resolve ${ref}; provide CLOUDFLARE_ALERT_RELAY_URL`);
  }
  if (!ref.startsWith("op://")) {
    throw new Error(`refusing non-op:// reference: ${ref}`);
  }
  try {
    const out = execFileSync("op", ["read", ref], { encoding: "utf-8" });
    return out.trim();
  } catch (err) {
    throw new Error(`op read failed for ${ref}: ${(err as Error).message}`);
  }
}

function renderPolicyPayload(
  p: CanonicalPolicy,
  webhooks: WebhookListEntry[],
): Record<string, unknown> {
  const webhookRefs = p.mechanisms.webhooks.map((w) => ({ id: resolveWebhookId(w.name, webhooks) }));
  return {
    name: p.name,
    description: p.description,
    alert_type: p.alert_type,
    enabled: p.enabled,
    conditions: p.conditions,
    mechanisms: { webhooks: webhookRefs },
  };
}

function renderWebhookPayload(
  w: CanonicalWebhook,
): Record<string, unknown> {
  const url = w.urlRef ? resolveRef(w.urlRef) : w.url;
  if (!url) throw new Error(`webhook ${w.name} missing url`);
  const body: Record<string, unknown> = {
    name: w.name,
    type: w.type,
    url,
  };
  if (w.secretHeader?.valueRef) {
    body.secret = resolveRef(w.secretHeader.valueRef);
  }
  return body;
}

function resolveComparableWebhook(w: CanonicalWebhook): CanonicalWebhook {
  const out: CanonicalWebhook = { ...w };
  if (w.urlRef) {
    out.url = resolveRef(w.urlRef);
  }
  return out;
}

function printList(
  expectedP: CanonicalPolicy[],
  actualP: CanonicalPolicy[],
  expectedW: CanonicalWebhook[],
  actualW: WebhookListEntry[],
  flags: Flags,
): void {
  if (flags.json) {
    console.log(JSON.stringify({ expectedP, actualP, expectedW, actualW }, null, 2));
    return;
  }
  console.log("# expected policies");
  for (const p of expectedP) console.log(`policy: ${p.name}`);
  console.log("# actual policies");
  for (const p of actualP) console.log(`policy: ${p.name}`);
  console.log("# expected webhooks");
  for (const w of expectedW) console.log(`webhook: ${w.name}`);
  console.log("# actual webhooks");
  for (const w of actualW) console.log(`webhook: ${w.name}`);
}

function printDrifts(drifts: Drift[], flags: Flags): void {
  if (flags.json) {
    console.log(JSON.stringify(drifts));
    return;
  }
  if (drifts.length === 0) {
    console.log("no drift detected");
    return;
  }
  console.log(`drift detected: ${drifts.length} item(s)`);
  for (const d of drifts) {
    if (d.kind === "missing") console.log(`  - missing: ${d.name}`);
    else if (d.kind === "extra") console.log(`  - extra: ${d.name}`);
    else
      console.log(
        `  - changed: ${d.name} ${d.path} expected=${JSON.stringify(d.expected)} actual=${JSON.stringify(d.actual)}`,
      );
  }
}

async function loadActual(): Promise<{
  actualPolicies: CanonicalPolicy[];
  actualWebhooksRaw: WebhookListEntry[];
  actualWebhooks: CanonicalWebhook[];
  idToName: Record<string, string>;
}> {
  const webhookList = await listWebhooks();
  const idToName = Object.fromEntries(webhookList.map((w) => [w.id, w.name]));
  const rawPolicies = await listPolicies();
  const actualPolicies = rawPolicies.map((p) => canonicalizePolicy(p, idToName));
  const actualWebhooks = webhookList.map(canonicalizeWebhook);
  return { actualPolicies, actualWebhooksRaw: webhookList, actualWebhooks, idToName };
}

async function cmdList(flags: Flags): Promise<number> {
  setAlertTokenMode("read");
  const { policies: exp, webhooks } = loadExpected(process.cwd());
  const expW = webhooks.map(resolveComparableWebhook);
  const { actualPolicies, actualWebhooksRaw } = await loadActual();
  printList(exp, actualPolicies, expW, actualWebhooksRaw, flags);
  return 0;
}

async function cmdDiff(flags: Flags, isPlan: boolean): Promise<number> {
  setAlertTokenMode("read");
  const { policies: exp, webhooks } = loadExpected(process.cwd());
  const expW = webhooks.map(resolveComparableWebhook);
  const { actualPolicies, actualWebhooks } = await loadActual();
  const drifts: Drift[] = [
    ...diffWebhook(expW, actualWebhooks),
    ...diffPolicy(exp, actualPolicies),
  ];
  printDrifts(drifts, flags);
  if (isPlan) return 0;
  return drifts.length === 0 ? 0 : 2;
}

async function cmdApply(flags: Flags): Promise<number> {
  setAlertTokenMode("apply");
  const { policies: exp, webhooks: expW } = loadExpected(process.cwd());

  // 1) webhook destination upsert (先)
  let webhookList = await listWebhooks();
  for (const w of expW) {
    const payload = renderWebhookPayload(w);
    const existing = webhookList.find((x) => x.name === w.name);
    if (!flags.yes) {
      console.log(`[dry-run] ${existing ? "PUT" : "POST"} webhook ${w.name}`);
      continue;
    }
    if (existing) {
      await updateWebhook(existing.id, payload);
    } else {
      await createWebhook(payload);
    }
  }

  // 2) policy upsert (webhook id 解決後)
  webhookList = await listWebhooks();
  const policyList = await listPolicies();
  const idToName = Object.fromEntries(webhookList.map((w) => [w.id, w.name]));
  const policyByName = new Map(
    policyList.map((p) => {
      const c = canonicalizePolicy(p, idToName);
      return [c.name, p as Record<string, unknown>];
    }),
  );
  for (const p of exp) {
    const payload = renderPolicyPayload(p, webhookList);
    const existing = policyByName.get(p.name);
    if (!flags.yes) {
      console.log(`[dry-run] ${existing ? "PUT" : "POST"} policy ${p.name}`);
      continue;
    }
    if (existing) {
      await updatePolicy(String(existing.id), payload);
    } else {
      await createPolicy(payload);
    }
  }
  return 0;
}

function usage(): void {
  process.stderr.write(
    [
      "usage: cf.sh alerts {list|diff|apply|plan} [--json] [--yes] [--ci]",
      "  list             expected (repo) と actual (Cloudflare) を一覧表示",
      "  diff             expected と actual を比較。drift があれば exit 2",
      "  plan             diff と同じ判定だが exit 常に 0 (CI plan 出力用)",
      "  apply            webhook destination → policy の順に冪等適用 (dry-run by default)",
      "                   --yes で実適用 / --ci で op run をスキップ",
      "",
    ].join("\n"),
  );
}

export async function runCli(argv: string[]): Promise<number> {
  if (argv.length === 0) {
    usage();
    return 64;
  }
  const cmd = argv[0];
  const flags = parseFlags(argv.slice(1));
  switch (cmd) {
    case "list":
      return cmdList(flags);
    case "diff":
      return cmdDiff(flags, false);
    case "plan":
      return cmdDiff(flags, true);
    case "apply":
      return cmdApply(flags);
    default:
      process.stderr.write(`[cf.sh] unknown subcommand: ${cmd}\n`);
      usage();
      return 64;
  }
}

// 直接実行された場合のみ走らせる (vitest からは import のみされる)
const isEntry =
  typeof process !== "undefined" &&
  process.argv[1] &&
  (process.argv[1].endsWith("/cli.ts") || process.argv[1].endsWith("\\cli.ts"));

if (isEntry) {
  runCli(process.argv.slice(2))
    .then((code) => process.exit(code))
    .catch((err) => {
      process.stderr.write(`[cf.sh alerts] error: ${(err as Error).message}\n`);
      process.exit(1);
    });
}
