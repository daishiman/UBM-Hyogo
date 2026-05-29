// members-not-displaying-form-sync-investigation Task C:
// `POST /admin/sync/backfill-publish-state?dryRun=true|false`
// auto-publish policy を全 member_status に適用する backfill。
// 入力契約は phase-04-data-contract.md を正本とする。

import { Hono } from "hono";
import {
  requireSyncAdmin,
  type SyncAdminEnv,
} from "../../middleware/require-sync-admin";
import {
  decidePublishState,
  isAdminOverrideStatus,
  normalizeConsentValue,
  normalizePublishState,
  type PublishState,
} from "../../lib/policies/auto-publish";

interface BackfillEnv extends SyncAdminEnv {
  readonly DB: D1Database;
}

interface StatusRow {
  member_id: string;
  public_consent: string | null;
  publish_state: string | null;
  updated_by: string | null;
  is_deleted: number | null;
}

export interface BackfillResult {
  dryRun: boolean;
  policy: "auto-publish-on-consent";
  scanned: number;
  candidates: number;
  applied: number;
  skipped: {
    alreadyPublic: number;
    adminExplicit: number;
    consentNotMet: number;
    deleted: number;
  };
}

export const adminSyncBackfillPublishStateRoute = new Hono<{
  Bindings: BackfillEnv;
}>();

adminSyncBackfillPublishStateRoute.post(
  "/sync/backfill-publish-state",
  requireSyncAdmin,
  async (c) => {
    const dryRunParam = c.req.query("dryRun");
    const dryRun = dryRunParam !== "false"; // default = true
    const result = await runBackfillPublishState(c.env.DB, { dryRun });
    return c.json(result, 200);
  },
);

export async function runBackfillPublishState(
  db: D1Database,
  options: { readonly dryRun: boolean },
): Promise<BackfillResult> {
  const rows = await db
    .prepare(
      `SELECT member_id, public_consent, publish_state, updated_by, is_deleted
       FROM member_status`,
    )
    .all<StatusRow>();
  const all = rows.results ?? [];

  const result: BackfillResult = {
    dryRun: options.dryRun,
    policy: "auto-publish-on-consent",
    scanned: all.length,
    candidates: 0,
    applied: 0,
    skipped: {
      alreadyPublic: 0,
      adminExplicit: 0,
      consentNotMet: 0,
      deleted: 0,
    },
  };

  const toApply: Array<{ memberId: string; nextState: PublishState }> = [];

  for (const row of all) {
    if ((row.is_deleted ?? 0) === 1) {
      result.skipped.deleted += 1;
      continue;
    }
    const currentPublishState = normalizePublishState(row.publish_state);
    const isOverride = isAdminOverrideStatus({
      currentPublishState,
      updatedBy: row.updated_by ?? null,
    });
    if (currentPublishState === "public") {
      result.skipped.alreadyPublic += 1;
      continue;
    }
    if (isOverride) {
      result.skipped.adminExplicit += 1;
      continue;
    }
    const consent = normalizeConsentValue(row.public_consent);
    const nextState = decidePublishState({
      currentPublishState,
      publicConsent: consent,
      hasAdminExplicitOverride: false,
      flagEnabled: true,
    });
    if (nextState === currentPublishState) {
      // consent 未達 (declined/unknown) は member_only のまま
      result.skipped.consentNotMet += 1;
      continue;
    }
    result.candidates += 1;
    toApply.push({ memberId: row.member_id, nextState });
  }

  if (!options.dryRun && toApply.length > 0) {
    const BATCH = 200;
    for (let i = 0; i < toApply.length; i += BATCH) {
      const batch = toApply.slice(i, i + BATCH);
      const stmts = batch.map((entry) =>
        db
          .prepare(
            `UPDATE member_status
             SET publish_state = ?1,
                 updated_by = 'system:backfill',
                 updated_at = datetime('now')
             WHERE member_id = ?2`,
          )
          .bind(entry.nextState, entry.memberId),
      );
      await db.batch(stmts);
      result.applied += batch.length;
    }
  }

  return result;
}
