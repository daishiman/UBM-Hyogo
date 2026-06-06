import { z } from "zod";

export const SyncResultSchema = z
  .object({
    status: z.enum(["succeeded", "failed", "skipped"]),
    jobId: z.string(),
    processedCount: z.number().int().nonnegative(),
    writeCount: z.number().int().nonnegative(),
    cursor: z.string().nullable(),
    durationMs: z.number().int().nonnegative().optional(),
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

// issue-1089: 全件 backfill 承認前の影響件数プレビュー（dry-run / count-only）。
// 既存 SyncResultSchema / SyncRunResponseSchema は不変（AC-3）。
export const SyncPreviewResultSchema = z
  .object({
    status: z.literal("preview"),
    dryRun: z.literal(true),
    responseCount: z.number().int().nonnegative(),
    estimatedWrites: z.number().int().nonnegative(),
    pagesScanned: z.number().int().nonnegative(),
    capped: z.boolean(),
  })
  .strict();

export type SyncPreviewResult = z.infer<typeof SyncPreviewResultSchema>;

export const SyncPreviewRunResponseSchema = z
  .object({ ok: z.literal(true), preview: SyncPreviewResultSchema })
  .strict();

export type SyncPreviewRunResponse = z.infer<
  typeof SyncPreviewRunResponseSchema
>;

export const SYNC_RESPONSES_PATH = "/api/admin/sync/responses" as const;
