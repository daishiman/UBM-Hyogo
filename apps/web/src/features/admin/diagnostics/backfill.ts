import { z } from "zod";

export const BackfillResultSchema = z
  .object({
    dryRun: z.boolean(),
    policy: z.literal("auto-publish-on-consent"),
    scanned: z.number().int().nonnegative(),
    candidates: z.number().int().nonnegative(),
    applied: z.number().int().nonnegative(),
    skipped: z
      .object({
        alreadyPublic: z.number().int().nonnegative(),
        adminExplicit: z.number().int().nonnegative(),
        consentNotMet: z.number().int().nonnegative(),
        deleted: z.number().int().nonnegative(),
      })
      .strict(),
  })
  .strict();

export type BackfillResult = z.infer<typeof BackfillResultSchema>;

export const BACKFILL_PUBLISH_STATE_PATH =
  "/api/admin/sync/backfill-publish-state" as const;
