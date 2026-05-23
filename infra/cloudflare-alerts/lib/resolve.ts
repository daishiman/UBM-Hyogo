/**
 * UT-17-Followup-004: resolve
 *
 * webhook destination の name → id 解決と、percentage × quotaBase の閾値算出を担う純関数。
 * Phase 7 §7-4 R1〜R6 を満たす。
 */
import type { WebhookListEntry } from "./types.ts";

export function resolveWebhookId(name: string, list: WebhookListEntry[]): string {
  const hits = list.filter((w) => w.name === name);
  if (hits.length === 0) {
    throw new Error(`webhook not found: ${name}`);
  }
  if (hits.length > 1) {
    throw new Error(`ambiguous webhook name: ${name} (${hits.length} matches)`);
  }
  return hits[0].id;
}

export function computeThreshold(percentage: number, base: number): number {
  if (!Number.isFinite(base) || base <= 0) {
    throw new RangeError(`base must be > 0, got ${base}`);
  }
  if (!Number.isFinite(percentage) || percentage <= 0 || percentage >= 1) {
    throw new RangeError(`percentage must be in (0, 1), got ${percentage}`);
  }
  return Math.floor(base * percentage);
}
