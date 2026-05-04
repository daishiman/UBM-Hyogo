import { z } from "zod";
import { STABLE_KEY_LIST } from "@ubm-hyogo/shared";

export const SYNC_JOB_TYPES = ["schema_sync", "response_sync"] as const;
export type SyncJobKind = (typeof SYNC_JOB_TYPES)[number];

export const SCHEMA_SYNC = "schema_sync" satisfies SyncJobKind;
export const RESPONSE_SYNC = "response_sync" satisfies SyncJobKind;

export const SYNC_LOCK_TTL_MINUTES = 10;
export const SYNC_LOCK_TTL_MS = SYNC_LOCK_TTL_MINUTES * 60 * 1000;

export const PII_FORBIDDEN_KEYS = [
  "email",
  "responseEmail",
  "response_email",
  "name",
  "rawAnswersByQuestionId",
  "answersByStableKey",
  ...STABLE_KEY_LIST,
] as const;

export const metricsJsonBaseSchema = z
  .object({
    cursor: z.string().nullable().optional(),
    processed: z.number().int().nonnegative().optional(),
    processed_count: z.number().int().nonnegative().optional(),
    writes: z.number().int().nonnegative().optional(),
    write_count: z.number().int().nonnegative().optional(),
    error_count: z.number().int().nonnegative().optional(),
    skipped: z.union([z.boolean(), z.literal(0), z.literal(1)]).optional(),
    reason: z.string().optional(),
    lock_acquired_at: z.string().datetime().nullable().optional(),
  })
  .passthrough()
  .superRefine((value, ctx) => {
    const forbiddenPath = findPiiKeyPath(value);
    if (forbiddenPath) {
      ctx.addIssue({
        code: "custom",
        message: `metrics_json must not include PII key: ${forbiddenPath}`,
      });
    }
  });

export const responseSyncMetricsSchema = metricsJsonBaseSchema.safeExtend({
  cursor: z.string().nullable().optional(),
});

export const schemaSyncMetricsSchema = metricsJsonBaseSchema.safeExtend({
  writes: z.number().int().nonnegative().optional(),
  write_count: z.number().int().nonnegative().optional(),
});

export function assertNoPii(value: unknown): void {
  const forbiddenPath = findPiiKeyPath(value);
  if (forbiddenPath) {
    throw new Error(`metrics_json must not include PII key: ${forbiddenPath}`);
  }
}

export function parseMetricsJson<T>(
  metricsJson: string | null,
  schema: z.ZodType<T>,
  fallback: T,
): T {
  if (metricsJson === null || metricsJson === "") return fallback;
  try {
    const parsed = JSON.parse(metricsJson) as unknown;
    return schema.parse(parsed);
  } catch {
    return fallback;
  }
}

function findPiiKeyPath(value: unknown, path = ""): string | null {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      const found = findPiiKeyPath(value[i], `${path}[${i}]`);
      if (found) return found;
    }
    return null;
  }
  if (value === null || typeof value !== "object") return null;
  for (const [key, child] of Object.entries(value)) {
    const childPath = path ? `${path}.${key}` : key;
    if ((PII_FORBIDDEN_KEYS as readonly string[]).includes(key)) {
      return childPath;
    }
    const found = findPiiKeyPath(child, childPath);
    if (found) return found;
  }
  return null;
}
