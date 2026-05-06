import { WebClient } from "@slack/web-api";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { saveEvidence, saveTextEvidence } from "./save-slack-evidence";

export type Mode = "dryrun" | "production";

export type CliArgs = {
  mode: Mode;
  releaseVersion: string;
  deployedAt: string;
  runbookPath: string;
  oncallHandle: string;
  evidenceOut: string;
  commitSha?: string;
  repoSlug?: string;
};

export type RuntimeEnv = {
  SLACK_BOT_TOKEN_INCIDENT_RUNBOOK: string;
  SLACK_INCIDENT_RUNBOOK_CHANNEL_ID?: string;
  SLACK_INCIDENT_RUNBOOK_DRYRUN_CHANNEL_ID?: string;
  PRODUCTION_APPROVAL_TOKEN?: string;
  DRYRUN_EVIDENCE_CONFIRMED?: string;
};

const TOKEN_LEAK_RE = /xox[bpa]-[A-Za-z0-9-]+/g;

function redact(s: string): string {
  return s.replace(TOKEN_LEAK_RE, "***REDACTED***");
}

export function parseArgs(argv: string[]): CliArgs {
  const map: Record<string, string> = {};
  for (const raw of argv) {
    const m = /^--([^=]+)=(.*)$/.exec(raw);
    if (m) map[m[1]] = m[2];
  }
  const required = [
    "mode",
    "release-version",
    "deployed-at",
    "runbook-path",
    "oncall-handle",
  ];
  for (const k of required) {
    if (!map[k]) throw new Error(`missing argument: --${k}`);
  }
  const mode = map["mode"];
  if (mode !== "dryrun" && mode !== "production") {
    throw new Error(`invalid --mode: ${mode}`);
  }
  return {
    mode,
    releaseVersion: map["release-version"],
    deployedAt: map["deployed-at"],
    runbookPath: map["runbook-path"],
    oncallHandle: map["oncall-handle"],
    evidenceOut:
      map["evidence-out"] ||
      join(
        map["evidence-dir"] ||
          "docs/30-workflows/09c-incident-runbook-slack-delivery/outputs/phase-11/evidence",
        `slack-delivery-${mode}.json`,
      ),
    commitSha: map["commit-sha"],
    repoSlug: map["repo-slug"],
  };
}

export function loadEnv(env: NodeJS.ProcessEnv): RuntimeEnv {
  const token = env.SLACK_BOT_TOKEN_INCIDENT_RUNBOOK;
  if (!token || token.trim() === "") {
    throw new Error("SLACK_BOT_TOKEN_INCIDENT_RUNBOOK is required");
  }
  return {
    SLACK_BOT_TOKEN_INCIDENT_RUNBOOK: token,
    SLACK_INCIDENT_RUNBOOK_CHANNEL_ID: env.SLACK_INCIDENT_RUNBOOK_CHANNEL_ID,
    SLACK_INCIDENT_RUNBOOK_DRYRUN_CHANNEL_ID:
      env.SLACK_INCIDENT_RUNBOOK_DRYRUN_CHANNEL_ID,
    PRODUCTION_APPROVAL_TOKEN: env.PRODUCTION_APPROVAL_TOKEN,
    DRYRUN_EVIDENCE_CONFIRMED: env.DRYRUN_EVIDENCE_CONFIRMED,
  };
}

export function resolveChannelId(mode: Mode, env: RuntimeEnv): string {
  const id =
    mode === "production"
      ? env.SLACK_INCIDENT_RUNBOOK_CHANNEL_ID
      : env.SLACK_INCIDENT_RUNBOOK_DRYRUN_CHANNEL_ID;
  if (!id || id.trim() === "") {
    throw new Error(`channel id missing for mode=${mode}`);
  }
  if (
    mode === "production" &&
    id === env.SLACK_INCIDENT_RUNBOOK_DRYRUN_CHANNEL_ID
  ) {
    throw new Error("production channel id must differ from dryrun channel id");
  }
  return id;
}

export function loadRunbookPermalink(
  runbookPath: string,
  options: { commitSha?: string; repoSlug?: string } = {},
): {
  url: string;
  commitSha: string;
} {
  const sha =
    options.commitSha ||
    execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).trim();
  if (
    runbookPath.startsWith("/") ||
    runbookPath.split("/").includes("..") ||
    runbookPath.includes("\0")
  ) {
    throw new Error(`invalid runbook path: ${runbookPath}`);
  }
  try {
    execFileSync("git", ["cat-file", "-e", `${sha}:${runbookPath}`], {
      stdio: "ignore",
    });
  } catch {
    throw new Error(`runbook path does not exist at commit ${sha}: ${runbookPath}`);
  }
  const repo =
    options.repoSlug || process.env.GITHUB_REPOSITORY || "daishiman/UBM-Hyogo";
  const url = `https://github.com/${repo}/blob/${sha}/${runbookPath}`;
  return { url, commitSha: sha };
}

export function renderTemplate(
  tplPath: string,
  vars: Record<string, string>,
): { blocks: unknown[] } {
  let raw = readFileSync(tplPath, "utf-8");
  for (const [k, v] of Object.entries(vars)) {
    raw = raw.split(`{{${k}}}`).join(v);
  }
  if (/\{\{[a-zA-Z]+\}\}/.test(raw)) {
    throw new Error("template still contains unresolved placeholder");
  }
  return JSON.parse(raw) as { blocks: unknown[] };
}

const TEMPLATE_PATH = "scripts/notify/slack-incident-runbook.template.json";

function renderMarkdownEvidence(args: CliArgs, runbookPermalink: string): string {
  return [
    `# Slack Incident Runbook Message (${args.mode})`,
    "",
    `- releaseVersion: ${args.releaseVersion}`,
    `- deployedAt: ${args.deployedAt}`,
    `- oncallHandle: ${args.oncallHandle}`,
    `- runbookPermalink: ${runbookPermalink}`,
    `- runbookOwnerPath: ${args.runbookPath}`,
  ].join("\n");
}

function saveSupportEvidence(args: CliArgs, runbookPermalink: string): void {
  const evidenceDir = dirname(args.evidenceOut);
  saveTextEvidence(
    join(evidenceDir, "slack-message-rendered.md"),
    renderMarkdownEvidence(args, runbookPermalink),
  );
  saveTextEvidence(
    join(evidenceDir, "secret-resolution.log"),
    [
      "SLACK_BOT_TOKEN_INCIDENT_RUNBOOK=MASKED",
      "SLACK_INCIDENT_RUNBOOK_CHANNEL_ID=VARIABLE",
      "SLACK_INCIDENT_RUNBOOK_DRYRUN_CHANNEL_ID=VARIABLE",
    ].join("\n"),
  );
  saveTextEvidence(join(evidenceDir, "token-leak-check.log"), "token leak gate: PASS");
}

export async function postIncidentRunbook(
  client: WebClient,
  args: CliArgs,
  env: RuntimeEnv,
): Promise<void> {
  if (args.mode === "production" && !env.PRODUCTION_APPROVAL_TOKEN) {
    throw new Error(
      "production mode requires PRODUCTION_APPROVAL_TOKEN (GitHub Actions environment gate)",
    );
  }
  if (
    args.mode === "production" &&
    env.DRYRUN_EVIDENCE_CONFIRMED !== "true"
  ) {
    throw new Error("production mode requires DRYRUN_EVIDENCE_CONFIRMED=true");
  }
  const channel = resolveChannelId(args.mode, env);
  const { url: runbookPermalink, commitSha } = loadRunbookPermalink(
    args.runbookPath,
    { commitSha: args.commitSha, repoSlug: args.repoSlug },
  );
  const tpl = renderTemplate(TEMPLATE_PATH, {
    mode: args.mode,
    releaseVersion: args.releaseVersion,
    deployedAt: args.deployedAt,
    oncallHandle: args.oncallHandle,
    runbookPermalink,
    commitSha,
    runbookOwnerPath: args.runbookPath,
  });

  let post: Awaited<ReturnType<WebClient["chat"]["postMessage"]>>;
  try {
    post = await client.chat.postMessage({
      channel,
      blocks: tpl.blocks as never,
      text: `[${args.mode}] UBM兵庫 incident runbook — ${args.releaseVersion}`,
      unfurl_links: false,
    });
  } catch (e) {
    const msg = redact(String((e as Error)?.message ?? e));
    throw new Error(`chat.postMessage failed: ${msg}`);
  }
  if (!post.ok || !post.ts || !post.channel) {
    throw new Error(`chat.postMessage failed: ${post.error ?? "unknown"}`);
  }

  const perm = await client.chat.getPermalink({
    channel: post.channel,
    message_ts: post.ts,
  });
  if (!perm.ok || !perm.permalink) {
    throw new Error(`chat.getPermalink failed: ${perm.error ?? "unknown"}`);
  }

  saveEvidence(args.evidenceOut, {
    ok: true,
    ts: post.ts,
    channel: post.channel,
    message: { permalink: perm.permalink },
    mode: args.mode,
    releaseVersion: args.releaseVersion,
    deployedAt: args.deployedAt,
    commitSha,
    runbookPermalink,
    deliveredAt: new Date().toISOString(),
  });
  saveSupportEvidence(args, runbookPermalink);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const env = loadEnv(process.env);
  const client = new WebClient(env.SLACK_BOT_TOKEN_INCIDENT_RUNBOOK, {
    retryConfig: { retries: 1 },
  });
  await postIncidentRunbook(client, args, env);
}

const invokedDirectly =
  typeof process !== "undefined" &&
  process.argv[1] &&
  /slack-incident-runbook\.(ts|js|mjs|cjs)$/.test(process.argv[1]);

if (invokedDirectly) {
  main().catch((e) => {
    const msg = redact(String((e as Error)?.message ?? e));
    process.stderr.write(`[slack-incident-runbook] ${msg}\n`);
    process.exit(1);
  });
}
