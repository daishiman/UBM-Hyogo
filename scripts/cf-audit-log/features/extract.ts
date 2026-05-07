import { createHash } from "node:crypto";
import type { AuditLogEvent } from "../types.ts";
import type {
  ActionCategory,
  RedactedFeatures,
  StatusClass,
  UserAgentCategory,
} from "./schema.ts";

export function extractFeatures(
  event: AuditLogEvent,
  opts: { redactSecret: string },
): RedactedFeatures {
  if (!opts.redactSecret || opts.redactSecret.length < 8) {
    throw new Error("redactSecret is required");
  }
  const when = new Date(event.when);
  if (Number.isNaN(when.getTime())) {
    throw new Error(`invalid event timestamp: ${event.when}`);
  }
  return {
    ipBucket: bucketIp(event.actor.ip),
    hourOfDay: when.getUTCHours(),
    dayOfWeek: when.getUTCDay(),
    actionCategory: categorizeAction(event.action.type),
    statusClass: classifyStatus(event.action.result_code),
    actorRoleHash: createHash("sha256")
      .update(`${opts.redactSecret}:${event.actor.email ?? "unknown"}`)
      .digest("hex")
      .slice(0, 16),
    userAgentCategory: categorizeUserAgent(event.actor.user_agent),
    tokenIdPresent: event.action.type.toLowerCase().includes("token"),
  };
}

export function bucketIp(ip: string | undefined): string {
  if (!ip) return "unknown";
  if (ip.includes(":")) {
    const parts = ip.split(":").filter(Boolean);
    return `${parts.slice(0, 3).join(":")}::/48`;
  }
  const parts = ip.split(".");
  if (parts.length !== 4) return "unknown";
  return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
}

export function categorizeAction(actionType: string | undefined): ActionCategory {
  const value = (actionType ?? "").toLowerCase();
  if (value.includes("login") || value.includes("auth")) return "auth";
  if (value.includes("token")) return "tokens";
  if (value.includes("dns")) return "dns";
  if (value.includes("worker")) return "workers";
  if (value.includes("d1")) return "d1";
  if (value.includes("kv")) return "kv";
  if (value.includes("r2")) return "r2";
  return "other";
}

export function classifyStatus(code: number | undefined): StatusClass {
  if (code === undefined) return "unknown";
  if (code >= 200 && code < 300) return "2xx";
  if (code >= 300 && code < 400) return "3xx";
  if (code >= 400 && code < 500) return "4xx";
  if (code >= 500 && code < 600) return "5xx";
  return "unknown";
}

export function categorizeUserAgent(
  userAgent: string | undefined,
): UserAgentCategory {
  const value = (userAgent ?? "").toLowerCase();
  if (value.includes("wrangler")) return "cli-wrangler";
  if (value.includes("githubactions") || value.includes("github-actions")) {
    return "gh-actions";
  }
  if (value.includes("mozilla") || value.includes("chrome")) return "browser";
  return "unknown";
}

