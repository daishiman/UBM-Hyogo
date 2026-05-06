import { createHash } from "node:crypto";
import type { AuditLogEvent, Finding, Severity } from "./types.ts";

export interface IssueCreateInput {
  owner: string;
  repo: string;
  title: string;
  body: string;
  labels: string[];
}

export interface IssueCreateResult {
  number: number;
}

export interface IssueClient {
  create(input: IssueCreateInput): Promise<IssueCreateResult>;
}

export interface ReportFindingDeps {
  client: IssueClient;
  owner: string;
  repo: string;
  isAlreadyReported: (key: string) => Promise<number | null>;
  recordReported: (key: string, issueNumber: number) => Promise<void>;
  dryRun?: boolean;
  stdout?: { write: (s: string) => void };
}

export interface ReportFindingResult {
  issueNumber: number;
  deduped: boolean;
  dryRun: boolean;
}

export async function reportFinding(
  finding: Finding,
  deps: ReportFindingDeps,
): Promise<ReportFindingResult> {
  const existing = await deps.isAlreadyReported(finding.dedupeKey);
  if (existing !== null) {
    return { issueNumber: existing, deduped: true, dryRun: false };
  }

  const title = `${finding.titlePrefix}${
    finding.event.actor.email ?? "unknown"
  }@${finding.event.when}`;
  const body = renderBody(finding);

  if (deps.dryRun) {
    const out = deps.stdout ?? process.stdout;
    out.write(
      `[DRY-RUN] would create issue: ${title} labels=${
        finding.labels.join(",")
      } hash=${finding.dedupeKey}\n`,
    );
    return { issueNumber: -1, deduped: false, dryRun: true };
  }

  const res = await deps.client.create({
    owner: deps.owner,
    repo: deps.repo,
    title,
    body,
    labels: finding.labels,
  });
  await deps.recordReported(finding.dedupeKey, res.number);
  return { issueNumber: res.number, deduped: false, dryRun: false };
}

export function renderBody(finding: Finding): string {
  const actorIp = finding.event.actor.ip
    ? redactIp(finding.event.actor.ip)
    : "no-ip";
  const resourceRef = [
    finding.event.resource?.type,
    finding.event.resource?.id ? redactIdentifier(finding.event.resource.id) : undefined,
  ].filter(Boolean).join(" / ") || "not-recorded";
  return [
    `## CF Audit Log Finding`,
    ``,
    `- Severity: **${finding.severity}**`,
    `- Reason: ${finding.reason}`,
    `- Actor: ${finding.event.actor.email ?? "unknown"} (${
      actorIp
    })`,
    `- When: ${finding.event.when}`,
    `- Action: ${finding.event.action.type} / ${finding.event.action.result}` +
      (finding.event.action.result_code !== undefined
        ? ` (${finding.event.action.result_code})`
        : ""),
    `- Resource: ${resourceRef}`,
    `- Dedupe hash: \`${finding.dedupeKey}\``,
    ``,
    `Raw audit event is retained only in D1 cf_audit_log.raw_json. Do not paste full IP, user agent, token values, or raw JSON into this Issue.`,
    ``,
    `Runbook: docs/00-getting-started-manual/specs/15-infrastructure-runbook.md`,
  ].join("\n");
}

export function buildFinding(
  event: AuditLogEvent,
  result: { severity: Severity; reason: string },
): Finding {
  const dedupeKey = computeDedupeKey(event, result.severity);
  const labels = labelsFor(result.severity);
  const titlePrefix = `[CF-AUDIT][${result.severity}] `;
  return {
    severity: result.severity,
    reason: result.reason,
    event,
    dedupeKey,
    titlePrefix,
    labels,
  };
}

export function computeDedupeKey(
  event: AuditLogEvent,
  severity: Severity,
): string {
  const bucket = bucketFor(event.when, severity);
  const actor = event.actor.email ?? event.actor.ip ?? "unknown";
  const raw = `${severity}|${actor}|${bucket}`;
  return createHash("sha256").update(raw).digest("hex");
}

function bucketFor(whenIso: string, severity: Severity): string {
  const d = new Date(whenIso);
  if (severity === "MEDIUM") {
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${
      pad(d.getUTCDate())
    }T${pad(d.getUTCHours())}`;
  }
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${
    pad(d.getUTCDate())
  }`;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function redactIp(ip: string): string {
  if (ip.includes(":")) {
    const parts = ip.split(":").filter(Boolean);
    return `${parts.slice(0, 2).join(":") || "ipv6"}::/redacted`;
  }
  const parts = ip.split(".");
  if (parts.length !== 4) return "redacted-ip";
  return `${parts[0]}.${parts[1]}.x.x`;
}

function redactIdentifier(value: string): string {
  if (value.length <= 8) return "redacted";
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

export function labelsFor(severity: Severity): string[] {
  switch (severity) {
    case "HIGH":
      return ["priority:high", "type:security", "cf-audit", "bot:cf-audit-log-monitor"];
    case "MEDIUM":
      return ["priority:medium", "type:security", "cf-audit", "bot:cf-audit-log-monitor"];
    case "LOW":
      return ["priority:low", "type:security", "cf-audit", "bot:cf-audit-log-monitor"];
  }
}
