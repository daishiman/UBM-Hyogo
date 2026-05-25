import fs from "node:fs";
import path from "node:path";
import type { CanonicalSentryPolicy, SentryAlertAction, SentryRuleListEntry } from "./types.ts";
import { minutesToInterval } from "./canonicalize.ts";

const API_BASE = "https://sentry.io/api/0";

function mockDir(): string | undefined {
  return process.env.SENTRY_ALERTS_MOCK_DIR || undefined;
}

function readMockJson<T = unknown>(name: string): T {
  const dir = mockDir();
  if (!dir) throw new Error("SENTRY_ALERTS_MOCK_DIR is not set");
  return JSON.parse(fs.readFileSync(path.join(dir, name), "utf-8")) as T;
}

function appendMockWrite(method: string, route: string, body: unknown): void {
  const dir = mockDir();
  if (!dir) return;
  fs.appendFileSync(path.join(dir, "write-log.txt"), `${method} ${route} ${JSON.stringify(body)}\n`);
}

function sentryConfig(): { org: string; project: string; token: string } {
  const org = process.env.SENTRY_ORG;
  const project = process.env.SENTRY_PROJECT;
  const token = process.env.SENTRY_AUTH_TOKEN || process.env.SENTRY_AUTH_TOKEN_READ;
  if (!org || !project || !token) {
    throw new Error("SENTRY_ORG, SENTRY_PROJECT, and SENTRY_AUTH_TOKEN or SENTRY_AUTH_TOKEN_READ are required");
  }
  return { org, project, token };
}

async function sentryFetch<T>(route: string, init?: RequestInit): Promise<T> {
  const { token } = sentryConfig();
  const response = await fetch(`${API_BASE}${route}`, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    throw new Error(`Sentry API ${response.status} for ${route}: ${await response.text()}`);
  }
  return (await response.json()) as T;
}

export async function listAlertRules(): Promise<SentryRuleListEntry[]> {
  if (mockDir()) return readMockJson<SentryRuleListEntry[]>("rules.json");
  const { org, project } = sentryConfig();
  return sentryFetch<SentryRuleListEntry[]>(`/projects/${org}/${project}/rules/`);
}

function envValue(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function toApiAction(action: SentryAlertAction): Record<string, unknown> {
  const workspace = envValue(action.workspace_id_env);
  const channelId = action.channel_id_env ? envValue(action.channel_id_env) : undefined;
  return {
    id: "sentry.integrations.slack.notify_action.SlackNotifyServiceAction",
    workspace,
    channel: action.target,
    ...(channelId ? { channel_id: channelId } : {}),
    ...(action.tags.length > 0 ? { tags: action.tags.join(",") } : {}),
  };
}

function toIssueAlertBody(policy: CanonicalSentryPolicy): Record<string, unknown> {
  return {
    name: policy.name,
    actionMatch: policy.action_match,
    filterMatch: policy.filter_match,
    frequency: policy.notification_interval_minutes,
    environment: policy.environment,
    conditions: [
      {
        id: "sentry.rules.conditions.event_frequency.EventFrequencyCondition",
        value: policy.frequency.threshold,
        interval: minutesToInterval(policy.frequency.window_minutes),
      },
    ],
    filters: policy.filters.map((filter) => ({
      id: "sentry.rules.filters.tagged_event.TaggedEventFilter",
      key: filter.field,
      match: "eq",
      value: filter.value,
    })),
    actions: policy.actions.map(toApiAction),
  };
}

export async function createAlertRule(body: CanonicalSentryPolicy): Promise<void> {
  const apiBody = toIssueAlertBody(body);
  if (mockDir()) {
    appendMockWrite("POST", "/rules", apiBody);
    return;
  }
  const { org, project } = sentryConfig();
  await sentryFetch(`/projects/${org}/${project}/rules/`, {
    method: "POST",
    body: JSON.stringify(apiBody),
  });
}

export async function updateAlertRule(id: string, body: CanonicalSentryPolicy): Promise<void> {
  const apiBody = toIssueAlertBody(body);
  if (mockDir()) {
    appendMockWrite("PUT", `/rules/${id}`, apiBody);
    return;
  }
  const { org, project } = sentryConfig();
  await sentryFetch(`/projects/${org}/${project}/rules/${id}/`, {
    method: "PUT",
    body: JSON.stringify(apiBody),
  });
}
