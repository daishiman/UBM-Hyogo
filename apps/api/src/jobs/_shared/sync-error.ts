/**
 * Shared sync error helpers.
 *
 * Owner table: docs/30-workflows/_design/sync-shared-modules-owner.md
 * Owner: 03a / co-owner: 03b.
 */
export type SyncErrorCode =
  | "lock-conflict"
  | "fetch-failed"
  | "d1-write-failed"
  | "unknown";

const PII_KEYS = new Set([
  "email",
  "memberEmail",
  "questionId",
  "responseEmail",
  "responseId",
]);

export function classifySyncError(err: unknown): SyncErrorCode {
  const message = err instanceof Error ? err.message : String(err);
  if (/lock|already held|busy/i.test(message)) return "lock-conflict";
  if (/fetch|network|timeout|429|quota|rate|5\d\d/i.test(message)) {
    return "fetch-failed";
  }
  if (/D1|database|SQLITE|UNIQUE|constraint|write/i.test(message)) {
    return "d1-write-failed";
  }
  return "unknown";
}

export function redactMetricsJson(
  json: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(json).filter(([key]) => !PII_KEYS.has(key)),
  );
}
