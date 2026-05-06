import type { AuditLogEvent, Baseline } from "./types.ts";
import { recentEventsInWindow, saveBaseline } from "./d1-client.ts";
import type { D1Like } from "./d1-client.ts";

export function trimmedP95(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  const trim = Math.floor(sorted.length * 0.05);
  const trimmed = sorted.slice(trim, sorted.length - trim);
  if (trimmed.length === 0) return sorted[sorted.length - 1] ?? 0;
  const idx = Math.min(trimmed.length - 1, Math.floor(trimmed.length * 0.95));
  return trimmed[idx] ?? 0;
}

export function hourlyCounts(
  events: AuditLogEvent[],
  result: "success" | "failure",
): number[] {
  const buckets = new Map<string, number>();
  for (const e of events) {
    if (e.action.result !== result) continue;
    const d = new Date(e.when);
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}-${d.getUTCHours()}`;
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return Array.from(buckets.values());
}

export function offHoursRatio(events: AuditLogEvent[]): number {
  if (events.length === 0) return 0;
  let off = 0;
  for (const e of events) {
    const utcHour = new Date(e.when).getUTCHours();
    const jstHour = (utcHour + 9) % 24;
    if (jstHour < 9 || jstHour >= 22) off++;
  }
  return off / events.length;
}

export async function computeBaseline(
  db: D1Like,
  days: number,
): Promise<Baseline> {
  const untilMs = Date.now();
  const sinceMs = untilMs - days * 86_400_000;
  const events = await recentEventsInWindow(db, sinceMs, untilMs);
  return {
    successPerHourP95: trimmedP95(hourlyCounts(events, "success")),
    failurePerHourP95: trimmedP95(hourlyCounts(events, "failure")),
    offHoursRatio: offHoursRatio(events),
    computedAt: new Date().toISOString(),
    windowDays: days,
  };
}

export async function runBaselineMain(
  db: D1Like,
  days: number,
): Promise<Baseline> {
  const b = await computeBaseline(db, days);
  await saveBaseline(db, b);
  return b;
}
