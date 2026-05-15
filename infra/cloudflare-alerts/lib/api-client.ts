/**
 * UT-17-Followup-004: api-client
 *
 * Cloudflare API (alerting/v3) と mock fixture の切替層。
 * CF_ALERTS_MOCK_DIR が設定されていれば、その dir 配下の fixture を返し、
 * write 系は `write-log.txt` に追記するのみで実 API を呼ばない。
 *
 * Phase 8 §8-9。
 */
import fs from "node:fs";
import path from "node:path";
import type { WebhookListEntry } from "./types.ts";

const API_BASE = "https://api.cloudflare.com/client/v4";
let tokenMode: "read" | "apply" = "read";

export function setAlertTokenMode(mode: "read" | "apply"): void {
  tokenMode = mode;
}

function mockDir(): string | undefined {
  return process.env.CF_ALERTS_MOCK_DIR || undefined;
}

function readMockJson<T = unknown>(name: string): T {
  const dir = mockDir();
  if (!dir) throw new Error("mock dir not set");
  const p = path.join(dir, name);
  return JSON.parse(fs.readFileSync(p, "utf-8")) as T;
}

function writeMockJson(name: string, value: unknown): void {
  const dir = mockDir();
  if (!dir) throw new Error("mock dir not set");
  fs.writeFileSync(path.join(dir, name), `${JSON.stringify(value, null, 2)}\n`);
}

function appendLog(method: string, p: string, body?: unknown): void {
  const dir = mockDir();
  if (!dir) return;
  const logPath = path.join(dir, "write-log.txt");
  const line = `${method} ${p} ${body === undefined ? "" : JSON.stringify(body)}\n`;
  fs.appendFileSync(logPath, line);
}

export function clearMockWriteLog(): void {
  const dir = mockDir();
  if (!dir) return;
  const logPath = path.join(dir, "write-log.txt");
  if (fs.existsSync(logPath)) fs.unlinkSync(logPath);
}

function accountId(): string {
  const v = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!v) {
    throw new Error("CLOUDFLARE_ACCOUNT_ID is required");
  }
  return v;
}

function readToken(): string {
  const v = process.env.CLOUDFLARE_ALERTS_TOKEN_READ;
  if (!v) {
    throw new Error("CLOUDFLARE_ALERTS_TOKEN_READ is required");
  }
  return v;
}

function applyToken(): string {
  const v = process.env.CLOUDFLARE_ALERTS_TOKEN_APPLY;
  if (!v) {
    throw new Error("CLOUDFLARE_ALERTS_TOKEN_APPLY is required");
  }
  return v;
}

function tokenFor(method: string): string {
  if (tokenMode === "apply" || ["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return applyToken();
  }
  return readToken();
}

interface CfEnvelope<T> {
  result: T;
  success: boolean;
  errors: unknown[];
  messages: unknown[];
}

async function cfRequest<T = unknown>(
  method: string,
  apiPath: string,
  body?: unknown,
): Promise<CfEnvelope<T>> {
  const res = await fetch(`${API_BASE}${apiPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${tokenFor(method)}`,
      "Content-Type": "application/json",
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = (await res.json()) as CfEnvelope<T>;
  if (!res.ok || !json.success) {
    throw new Error(
      `Cloudflare API ${method} ${apiPath} failed: ${res.status} ${JSON.stringify(json.errors)}`,
    );
  }
  return json;
}

export async function listPolicies(): Promise<unknown[]> {
  if (mockDir()) {
    return readMockJson<CfEnvelope<unknown[]>>("api-list-policies.json").result;
  }
  const r = await cfRequest<unknown[]>(
    "GET",
    `/accounts/${accountId()}/alerting/v3/policies`,
  );
  return r.result;
}

export async function listWebhooks(): Promise<WebhookListEntry[]> {
  if (mockDir()) {
    return readMockJson<CfEnvelope<WebhookListEntry[]>>("api-list-webhooks.json").result;
  }
  const r = await cfRequest<WebhookListEntry[]>(
    "GET",
    `/accounts/${accountId()}/alerting/v3/destinations/webhooks`,
  );
  return r.result;
}

export async function createPolicy(body: unknown): Promise<void> {
  if (mockDir()) {
    appendLog("POST", "/alerting/v3/policies", body);
    const envelope = readMockJson<CfEnvelope<Record<string, unknown>[]>>("api-list-policies.json");
    envelope.result.push({ id: `mock-policy-${envelope.result.length + 1}`, ...(body as Record<string, unknown>) });
    writeMockJson("api-list-policies.json", envelope);
    return;
  }
  await cfRequest("POST", `/accounts/${accountId()}/alerting/v3/policies`, body);
}

export async function updatePolicy(id: string, body: unknown): Promise<void> {
  if (mockDir()) {
    appendLog("PUT", `/alerting/v3/policies/${id}`, body);
    const envelope = readMockJson<CfEnvelope<Record<string, unknown>[]>>("api-list-policies.json");
    const idx = envelope.result.findIndex((p) => String(p.id) === id);
    if (idx >= 0) envelope.result[idx] = { id, ...(body as Record<string, unknown>) };
    writeMockJson("api-list-policies.json", envelope);
    return;
  }
  await cfRequest("PUT", `/accounts/${accountId()}/alerting/v3/policies/${id}`, body);
}

export async function createWebhook(body: unknown): Promise<void> {
  if (mockDir()) {
    appendLog("POST", "/alerting/v3/destinations/webhooks", body);
    const envelope = readMockJson<CfEnvelope<WebhookListEntry[]>>("api-list-webhooks.json");
    envelope.result.push({
      id: `mock-webhook-${envelope.result.length + 1}`,
      ...(body as WebhookListEntry),
    });
    writeMockJson("api-list-webhooks.json", envelope);
    return;
  }
  await cfRequest(
    "POST",
    `/accounts/${accountId()}/alerting/v3/destinations/webhooks`,
    body,
  );
}

export async function updateWebhook(id: string, body: unknown): Promise<void> {
  if (mockDir()) {
    appendLog("PUT", `/alerting/v3/destinations/webhooks/${id}`, body);
    const envelope = readMockJson<CfEnvelope<WebhookListEntry[]>>("api-list-webhooks.json");
    const idx = envelope.result.findIndex((w) => w.id === id);
    if (idx >= 0) envelope.result[idx] = { id, ...(body as WebhookListEntry) };
    writeMockJson("api-list-webhooks.json", envelope);
    return;
  }
  await cfRequest(
    "PUT",
    `/accounts/${accountId()}/alerting/v3/destinations/webhooks/${id}`,
    body,
  );
}
