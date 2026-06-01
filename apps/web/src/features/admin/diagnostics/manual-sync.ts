import { z } from "zod";

export const SyncResultSchema = z
  .object({
    status: z.enum(["succeeded", "failed", "skipped"]),
    jobId: z.string(),
    processedCount: z.number().int().nonnegative(),
    writeCount: z.number().int().nonnegative(),
    cursor: z.string().nullable(),
    skippedReason: z.string().optional(),
  })
  .strict();

export type SyncResult = z.infer<typeof SyncResultSchema>;

export const SyncRunResponseSchema = z.union([
  z.object({ ok: z.literal(true), result: SyncResultSchema }).strict(),
  z
    .object({
      ok: z.literal(false),
      result: SyncResultSchema.refine((result) => result.status === "skipped"),
    })
    .strict(),
]);

export type SyncRunResponse = z.infer<typeof SyncRunResponseSchema>;

export const SYNC_RESPONSES_PATH = "/api/admin/sync/responses" as const;
