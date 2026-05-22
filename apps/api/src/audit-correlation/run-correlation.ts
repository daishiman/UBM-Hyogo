import { correlate } from './correlate';
import { loadCloudflareAuditEvents } from './cloudflare-store';
import { fetchGitHubAuditEvents } from './github-fetch';
import { notifyHighFindingsToSlack } from './notify-slack';
import { persistFindings } from './persist';
import { redactGitHub } from './redact';
import type { NormalizedAuditEvent, RawGitHubAuditEvent } from './types';

export interface AuditCorrelationRuntimeEnv {
  readonly DB: D1Database;
  readonly GITHUB_AUDIT_PAT: string;
  readonly SLACK_AUDIT_INCIDENT_WEBHOOK_URL: string;
  readonly AUDIT_CORRELATION_SALT: string;
  readonly AUDIT_CORRELATION_INTERNAL_TOKEN: string;
  readonly AUDIT_CORRELATION_RUNBOOK_BASE_URL: string;
  readonly AUDIT_CORRELATION_GITHUB_ORG: string;
  readonly ENVIRONMENT?: 'development' | 'staging' | 'production';
}

export interface RunCorrelationDeps {
  readonly env: AuditCorrelationRuntimeEnv;
  readonly now?: () => Date;
  readonly fetchImpl?: typeof fetch;
  readonly windowMinutes?: number;
}

export interface RunCorrelationResult {
  readonly fetched: number;
  readonly cloudflareLoaded: number;
  readonly correlated: number;
  readonly persisted: number;
  readonly notifiedHigh: number;
}

const DEFAULT_WINDOW_MINUTES = 30;
const REQUIRED_KEYS: ReadonlyArray<keyof AuditCorrelationRuntimeEnv> = [
  'DB',
  'GITHUB_AUDIT_PAT',
  'SLACK_AUDIT_INCIDENT_WEBHOOK_URL',
  'AUDIT_CORRELATION_SALT',
  'AUDIT_CORRELATION_INTERNAL_TOKEN',
  'AUDIT_CORRELATION_RUNBOOK_BASE_URL',
  'AUDIT_CORRELATION_GITHUB_ORG',
];

export class AuditCorrelationEnvError extends Error {
  constructor(missing: ReadonlyArray<string>) {
    super(`audit-correlation env missing: ${missing.join(',')}`);
    this.name = 'AuditCorrelationEnvError';
  }
}

function validateEnv(env: AuditCorrelationRuntimeEnv): void {
  const missing: string[] = [];
  for (const key of REQUIRED_KEYS) {
    const v = env[key];
    if (v === undefined || v === null || v === '') missing.push(String(key));
  }
  if ((env.AUDIT_CORRELATION_SALT?.length ?? 0) < 16) missing.push('AUDIT_CORRELATION_SALT(min:16)');
  if ((env.AUDIT_CORRELATION_INTERNAL_TOKEN?.length ?? 0) < 32) {
    missing.push('AUDIT_CORRELATION_INTERNAL_TOKEN(min:32)');
  }
  if (missing.length > 0) throw new AuditCorrelationEnvError(missing);
}

export async function runCorrelation(deps: RunCorrelationDeps): Promise<RunCorrelationResult> {
  validateEnv(deps.env);
  const now = (deps.now ?? (() => new Date()))();
  const windowMinutes = deps.windowMinutes ?? DEFAULT_WINDOW_MINUTES;
  const since = new Date(now.getTime() - windowMinutes * 60 * 1000);

  const rawGitHub: ReadonlyArray<RawGitHubAuditEvent> = await fetchGitHubAuditEvents({
    since,
    until: now,
    orgSlug: deps.env.AUDIT_CORRELATION_GITHUB_ORG,
    pat: deps.env.GITHUB_AUDIT_PAT,
    fetchImpl: deps.fetchImpl,
  });

  const normalizedGitHub: NormalizedAuditEvent[] = [];
  for (const ev of rawGitHub) {
    normalizedGitHub.push(await redactGitHub(ev, { salt: deps.env.AUDIT_CORRELATION_SALT }));
  }

  const normalizedCloudflare = await loadCloudflareAuditEvents({
    db: deps.env.DB,
    since,
    until: now,
    salt: deps.env.AUDIT_CORRELATION_SALT,
  });
  const findings = correlate(normalizedGitHub, normalizedCloudflare);

  const persistResult = await persistFindings(findings, {
    db: deps.env.DB,
    ...(deps.now ? { now: deps.now } : {}),
  });

  const slackResult = await notifyHighFindingsToSlack(findings, {
    webhookUrl: deps.env.SLACK_AUDIT_INCIDENT_WEBHOOK_URL,
    runbookBaseUrl: deps.env.AUDIT_CORRELATION_RUNBOOK_BASE_URL,
    environment: deps.env.ENVIRONMENT ?? 'development',
    ...(deps.fetchImpl ? { fetchImpl: deps.fetchImpl } : {}),
  });

  return {
    fetched: rawGitHub.length,
    cloudflareLoaded: normalizedCloudflare.length,
    correlated: findings.length,
    persisted: persistResult.inserted,
    notifiedHigh: slackResult.succeeded,
  };
}
