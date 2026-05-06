import type { AuditLogEvent, Baseline, Severity } from "./types.ts";

export interface ClassifierContext {
  githubIpRanges: string[];
  businessHoursJst: { start: number; end: number };
  recentFailuresInHour: number;
  rotationWindowMs: { start: number; end: number } | null;
  failureSpikeMultiplier?: number;
}

export interface ClassifyResult {
  severity: Severity;
  reason: string;
}

export function classify(
  event: AuditLogEvent,
  baseline: Baseline | null,
  ctx: ClassifierContext,
): ClassifyResult | null {
  if (!baseline) return null;

  if (ctx.rotationWindowMs) {
    const t = Date.parse(event.when);
    if (t >= ctx.rotationWindowMs.start && t <= ctx.rotationWindowMs.end) {
      return null;
    }
  }

  if (
    event.action.result === "success" &&
    event.actor.ip &&
    !isInCidrList(event.actor.ip, ctx.githubIpRanges)
  ) {
    return {
      severity: "HIGH",
      reason: `foreign-ip success from ${event.actor.ip}`,
    };
  }

  if (
    event.action.result === "failure" &&
    event.action.result_code === 403 &&
    ctx.recentFailuresInHour >=
      Math.max(2, baseline.failurePerHourP95 * (ctx.failureSpikeMultiplier ?? 1.5))
  ) {
    return {
      severity: "MEDIUM",
      reason: `403 burst ${ctx.recentFailuresInHour}/h`,
    };
  }

  if (event.action.result === "success") {
    const utcHour = new Date(event.when).getUTCHours();
    const jstHour = (utcHour + 9) % 24;
    if (
      jstHour < ctx.businessHoursJst.start ||
      jstHour >= ctx.businessHoursJst.end
    ) {
      return {
        severity: "LOW",
        reason: `off-hours success at JST ${jstHour}:00`,
      };
    }
  }
  return null;
}

export function isInCidrList(ip: string, cidrs: string[]): boolean {
  for (const cidr of cidrs) {
    if (isInCidr(ip, cidr)) return true;
  }
  return false;
}

function isInCidr(ip: string, cidr: string): boolean {
  const slash = cidr.indexOf("/");
  if (slash < 0) return ip === cidr;
  const network = cidr.slice(0, slash);
  const bits = Number(cidr.slice(slash + 1));
  if (ip.includes(":") || network.includes(":")) {
    return matchIpv6(ip, network, bits);
  }
  return matchIpv4(ip, network, bits);
}

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    const v = Number(p);
    if (!Number.isInteger(v) || v < 0 || v > 255) return null;
    n = (n * 256) + v;
  }
  return n >>> 0;
}

function matchIpv4(ip: string, network: string, bits: number): boolean {
  if (bits < 0 || bits > 32) return false;
  const a = ipv4ToInt(ip);
  const b = ipv4ToInt(network);
  if (a === null || b === null) return false;
  if (bits === 0) return true;
  const mask = (0xffffffff << (32 - bits)) >>> 0;
  return ((a & mask) >>> 0) === ((b & mask) >>> 0);
}

function ipv6ToBigInt(ip: string): bigint | null {
  const expanded = expandIpv6(ip);
  if (!expanded) return null;
  let n = 0n;
  for (const segment of expanded) {
    n = (n << 16n) | BigInt(segment);
  }
  return n;
}

function expandIpv6(ip: string): number[] | null {
  const dq = ip.indexOf("::");
  let head: string[] = [];
  let tail: string[] = [];
  if (dq >= 0) {
    head = ip.slice(0, dq) === "" ? [] : ip.slice(0, dq).split(":");
    tail = ip.slice(dq + 2) === "" ? [] : ip.slice(dq + 2).split(":");
    const fillCount = 8 - head.length - tail.length;
    if (fillCount < 0) return null;
    head = head.concat(new Array(fillCount).fill("0"));
  } else {
    head = ip.split(":");
    if (head.length !== 8) return null;
  }
  const all = head.concat(tail);
  const segments: number[] = [];
  for (const h of all) {
    if (!/^[0-9a-fA-F]{1,4}$/.test(h)) return null;
    segments.push(parseInt(h, 16));
  }
  return segments;
}

function matchIpv6(ip: string, network: string, bits: number): boolean {
  if (bits < 0 || bits > 128) return false;
  const a = ipv6ToBigInt(ip);
  const b = ipv6ToBigInt(network);
  if (a === null || b === null) return false;
  if (bits === 0) return true;
  const shift = BigInt(128 - bits);
  return (a >> shift) === (b >> shift);
}
