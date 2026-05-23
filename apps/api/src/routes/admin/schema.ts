// 04c + 07b: GET /admin/schema/diff, POST /admin/schema/aliases
// 不変条件 #14: schema 変更は /admin/schema/* のみ。
// 07b 拡張: dryRun query, recommendedStableKeys 同梱, collision 409, idempotent
import { Hono } from "hono";
import { z } from "zod";
import { requireAdmin, type RequireAuthVariables } from "../../middleware/require-admin";
import { ctx } from "../../repository/_shared/db";
import { adminEmail, asAdminId } from "../../repository/_shared/brand";
import type { AdminEmail, AdminId } from "../../repository/_shared/brand";
import { list as listDiffs, findById as findDiffById } from "../../repository/schemaDiffQueue";
import { listRecentResolvedAliases } from "../../repository/schemaAliases";
import {
  recommendAliases,
  type RecommendExistingInput,
} from "../../services/aliasRecommendation";
import {
  schemaAliasAssign,
  SchemaAliasAssignFailure,
} from "../../workflows/schemaAliasAssign";
import type {
  SchemaAliasAssignInput,
  SchemaAliasAssignResult,
  SchemaAliasBackfillResult,
} from "../../workflows/schemaAliasAssign";
import { resolveBackfillCursorModeWithLog } from "../../workflows/schemaAliasBackfillBatch";
import { enqueueBackfill } from "../../workflows/schemaAliasEnqueue";
import {
  schemaAliasRollback,
  SchemaAliasRollbackFailure,
} from "../../workflows/schemaAliasRollback";
import type { AdminRouteEnv } from "./_shared";

const RollbackBodyZ = z.object({
  reason: z.string().max(500).optional(),
});

const IF_MATCH_PATTERN = /version=(\d+)/;

const parseIfMatch = (header: string | undefined): number | null => {
  if (!header) return null;
  const m = IF_MATCH_PATTERN.exec(header);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
};

const AliasBodyZ = z.object({
  diffId: z.string().min(1).optional(),
  questionId: z.string().min(1),
  stableKey: z
    .string()
    .min(1)
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "stableKey must match /^[a-zA-Z][a-zA-Z0-9_]*$/"),
  dryRun: z.boolean().optional(),
});

const BackfillTriggerBodyZ = z.object({
  source: z.literal("issue-504-50k-trial").optional(),
});

interface FixtureBackfillRow {
  diff_id: string;
  question_id: string | null;
  suggested_stable_key: string | null;
}

const queueProducer = (
  queue: AdminRouteEnv["SCHEMA_ALIAS_BACKFILL_QUEUE"],
): { send(m: unknown): Promise<void> } | null =>
  queue
    ? {
        send: async (message: unknown) => {
          await queue.send(message);
        },
      }
    : null;

interface ExistingQuestionRow {
  stable_key: string;
  label: string;
  section_key: string;
  position: number;
}

interface DiffEnrichmentInput {
  questionId: string | null;
  label: string;
}

const buildRecommendations = async (
  db: AdminRouteEnv["DB"],
  diffs: ReadonlyArray<DiffEnrichmentInput>,
): Promise<Map<string, string[]>> => {
  if (diffs.length === 0) return new Map();
  const r = await db
    .prepare(
      "SELECT stable_key, label, section_key, position FROM schema_questions WHERE stable_key != 'unknown'",
    )
    .all<ExistingQuestionRow>();
  const existing: RecommendExistingInput[] = (r.results ?? []).map((row) => ({
    stableKey: row.stable_key,
    label: row.label,
    sectionKey: row.section_key,
    position: row.position,
  }));
  const out = new Map<string, string[]>();
  for (const d of diffs) {
    if (!d.questionId) continue;
    // diff の section_key / position は queue にないので、現行 schema_questions から引く
    let sectionKey: string | null = null;
    let position: number | null = null;
    const detail = await db
      .prepare(
        "SELECT section_key, position FROM schema_questions WHERE question_id = ? ORDER BY revision_id DESC LIMIT 1",
      )
      .bind(d.questionId)
      .first<{ section_key: string; position: number }>();
    if (detail) {
      sectionKey = detail.section_key;
      position = detail.position;
    }
    out.set(
      d.questionId,
      recommendAliases({ label: d.label, sectionKey, position }, existing, 5),
    );
  }
  return out;
};

// UT-07B-FU-01: 既存 SchemaAliasBackfillResult を v2 公開契約 status に射影
//   completed → completed
//   exhausted → exhausted
//   updated=0 で completed → completed（remaining=0 由来）
//   route 側で remaining も合わせて返す（remaining=updated 直後では未確定なので 0 とする）
const mapBackfillToV2 = (
  b: SchemaAliasBackfillResult,
): { status: "pending" | "running" | "exhausted" | "completed"; remaining: number } => {
  if (b.status === "completed") return { status: "completed", remaining: 0 };
  // exhausted: cursor が文字列の updated 位置。実残件は consumer 側で COUNT で再評価する
  return { status: "exhausted", remaining: -1 };
};

const failureToHttp = (
  err: SchemaAliasAssignFailure,
): { status: 404 | 409 | 422; body: Record<string, unknown> } => {
  switch (err.detail.kind) {
    case "question_not_found":
      return { status: 404, body: { ok: false, error: "question not found" } };
    case "diff_not_found":
      return { status: 404, body: { ok: false, error: "diff not found" } };
    case "diff_question_mismatch":
      return {
        status: 409,
        body: { ok: false, error: "diff question mismatch" },
      };
    case "manual_actor_required":
      return { status: 409, body: { ok: false, error: "manual actor required" } };
    case "alias_conflict":
      return {
        status: 409,
        body: {
          ok: false,
          error: "alias already assigned",
          existingStableKey: err.detail.existingStableKey,
        },
      };
    case "collision":
      return {
        status: 409,
        body: {
          ok: false,
          code: "stable_key_collision",
          error: "stableKey collision",
          existingQuestionIds: err.detail.existingQuestionIds,
        },
      };
  }
};

export const createAdminSchemaRoute = () => {
  const app = new Hono<{ Bindings: AdminRouteEnv; Variables: RequireAuthVariables }>();
  app.use("*", requireAdmin);

  app.get("/schema/diff", async (c) => {
    const db = ctx({ DB: c.env.DB });
    const [items, resolvedAliases] = await Promise.all([
      listDiffs(db),
      listRecentResolvedAliases(db, 10),
    ]);
    const recommendations = await buildRecommendations(c.env.DB, items);
    const enriched = items.map((it) => ({
      ...it,
      recommendedStableKeys: it.questionId
        ? (recommendations.get(it.questionId) ?? [])
        : [],
    }));
    return c.json({
      total: enriched.length,
      items: enriched,
      resolvedAliases: resolvedAliases.map((alias) => ({
        id: alias.id,
        revisionId: alias.revisionId,
        stableKey: alias.stableKey,
        aliasQuestionId: alias.aliasQuestionId,
        aliasLabel: alias.aliasLabel,
        resolvedAt: alias.resolvedAt,
        resolvedBy: alias.resolvedBy,
        version: alias.version,
        impact: {
          affectedResponseCount: alias.affectedResponseCount,
          recomputeRequired: alias.affectedResponseCount > 0,
        },
      })),
    }, 200);
  });

  app.post("/schema/aliases", async (c) => {
    let raw: unknown;
    try {
      raw = await c.req.json();
    } catch {
      return c.json({ ok: false, error: "invalid json" }, 400);
    }
    const parsed = AliasBodyZ.safeParse(raw);
    if (!parsed.success) {
      return c.json({ ok: false, error: parsed.error.message }, 422);
    }
    const dryRun = c.req.query("dryRun") === "true" || parsed.data.dryRun === true;
    const db = ctx({ DB: c.env.DB });

    const authUser = c.get("authUser");
    const actorId: AdminId | null = authUser?.memberId
      ? asAdminId(authUser.memberId as unknown as string)
      : null;
    const actorEmail: AdminEmail | null = authUser?.email
      ? adminEmail(authUser.email)
      : null;
    const parsedBackfillCpuBudgetMs = c.env.UT07B_BACKFILL_CPU_BUDGET_MS
      ? Number(c.env.UT07B_BACKFILL_CPU_BUDGET_MS)
      : undefined;
    const backfillCpuBudgetMs =
      parsedBackfillCpuBudgetMs !== undefined && Number.isFinite(parsedBackfillCpuBudgetMs)
        ? parsedBackfillCpuBudgetMs
        : null;

    try {
      const backfillMode = resolveBackfillCursorModeWithLog(c.env.BACKFILL_CURSOR_MODE);
      const input: SchemaAliasAssignInput = {
        questionId: parsed.data.questionId,
        stableKey: parsed.data.stableKey,
        ...(parsed.data.diffId ? { diffId: parsed.data.diffId } : {}),
        dryRun,
        actorId,
        actorEmail,
        backfillMode,
      };
      if (backfillCpuBudgetMs !== null) {
        input.backfillCpuBudgetMs = backfillCpuBudgetMs;
      }
      const result = await schemaAliasAssign(db, input);
      // UT-07B-FU-01: apply 時は backfill exhausted で Queue / Cron に再開 job を enqueue
      // し、API response に confirmed / backfill.status を分離して返す。
      if (result.mode === "apply") {
        const lastProcessedAt = new Date().toISOString();
        const v2Backfill = mapBackfillToV2(result.backfill);
        let enqueueInfo: { dedupeKey: string; alreadyEnqueued: boolean; sent: boolean } | null = null;
        if (
          parsed.data.diffId &&
          (v2Backfill.status === "exhausted" || v2Backfill.status === "pending")
        ) {
          enqueueInfo = await enqueueBackfill(
            db,
            queueProducer(c.env.SCHEMA_ALIAS_BACKFILL_QUEUE),
            {
              diffId: parsed.data.diffId,
              questionId: input.questionId,
              newStableKey: input.stableKey,
            },
          );
        }
        const status =
          v2Backfill.status === "completed" || v2Backfill.status === "running"
            ? 200
            : 202;
        return c.json(
          {
            ok: true,
            ...result,
            confirmed: true,
            backfill: {
              ...result.backfill,
              status: v2Backfill.status,
              remaining: v2Backfill.remaining,
              lastProcessedAt,
              ...(enqueueInfo
                ? { dedupeKey: enqueueInfo.dedupeKey, enqueued: enqueueInfo.sent }
                : {}),
            },
          },
          status,
        );
      }
      return c.json({ ok: true, ...result }, 200);
    } catch (err) {
      if (err instanceof SchemaAliasAssignFailure) {
        const { status, body } = failureToHttp(err);
        return c.json(body, status);
      }
      throw err;
    }
  });

  // Issue #504: staging-only trigger for the 50k fixture stress trial.
  // This endpoint converts prepared synthetic schema_diff_queue rows into Queue jobs.
  app.post("/schema/backfill/trigger", async (c) => {
    if (c.env.ENVIRONMENT === "production") {
      return c.json(
        { ok: false, error: "production schema backfill trigger is banned" },
        403,
      );
    }
    let raw: unknown = {};
    try {
      raw = await c.req.json();
    } catch {
      raw = {};
    }
    const parsed = BackfillTriggerBodyZ.safeParse(raw);
    if (!parsed.success) {
      return c.json({ ok: false, error: parsed.error.message }, 422);
    }
    const db = ctx({ DB: c.env.DB });
    const rowsResult = await c.env.DB
      .prepare(
        `SELECT diff_id, question_id, suggested_stable_key
           FROM schema_diff_queue
          WHERE dedupe_key LIKE 'ubm-test-fixture-50k-%'
            AND status = 'queued'
            AND question_id IS NOT NULL
            AND suggested_stable_key IS NOT NULL
            AND (backfill_status IS NULL OR backfill_status IN ('exhausted', 'failed'))
          ORDER BY created_at ASC, diff_id ASC`,
      )
      .all<FixtureBackfillRow>();
    const rows = rowsResult.results ?? [];
    let sent = 0;
    let alreadyEnqueued = 0;
    for (const row of rows) {
      if (!row.question_id || !row.suggested_stable_key) continue;
      const enqueue = await enqueueBackfill(
        db,
        queueProducer(c.env.SCHEMA_ALIAS_BACKFILL_QUEUE),
        {
          diffId: row.diff_id,
          questionId: row.question_id,
          newStableKey: row.suggested_stable_key,
        },
      );
      if (enqueue.alreadyEnqueued) alreadyEnqueued += 1;
      if (enqueue.sent) sent += 1;
    }
    return c.json(
      {
        ok: true,
        source: parsed.data.source ?? "issue-504-50k-trial",
        selected: rows.length,
        queueEnqueued: sent,
        alreadyEnqueued,
        queueBindingPresent: Boolean(c.env.SCHEMA_ALIAS_BACKFILL_QUEUE),
      },
      202,
    );
  });

  // Issue #778: POST /admin/schema/aliases/:aliasId/rollback
  // - If-Match: version=<N> 必須（楽観ロック）
  // - body: { reason?: string (<=500) }
  // - 成功: 200 { aliasId, rolledBackAt, relatedAuditId, newVersion, impact }
  // - 失敗: 400 / 404 / 409 / 500
  app.post("/schema/aliases/:aliasId/rollback", async (c) => {
    const aliasId = c.req.param("aliasId");
    if (!aliasId) {
      return c.json({ error: "bad_request", message: "aliasId required" }, 400);
    }
    const expectedVersion = parseIfMatch(c.req.header("If-Match"));
    if (expectedVersion === null) {
      return c.json(
        {
          error: "bad_request",
          message: "If-Match header required, format: version=<N>",
        },
        400,
      );
    }
    let raw: unknown = {};
    try {
      raw = await c.req.json();
    } catch {
      raw = {};
    }
    const parsed = RollbackBodyZ.safeParse(raw);
    if (!parsed.success) {
      return c.json(
        { error: "bad_request", message: parsed.error.message },
        400,
      );
    }

    const authUser = c.get("authUser");
    const actor: string = authUser?.email ?? "unknown";
    const db = ctx({ DB: c.env.DB });

    try {
      const result = await schemaAliasRollback(db, {
        aliasId,
        expectedVersion,
        actor,
        reason: parsed.data.reason ?? null,
      });
      return c.json(result, 200);
    } catch (err) {
      if (err instanceof SchemaAliasRollbackFailure) {
        const status =
          err.kind === "version_mismatch"
            ? 409
            : err.kind === "not_found" || err.kind === "already_deleted"
              ? 404
              : 500;
        return c.json({ error: err.kind, message: err.message }, status);
      }
      throw err;
    }
  });

  // UT-07B-FU-01: GET /admin/schema/aliases/:diffId/backfill
  // back-fill 状態（status / remaining / retryCount / lastProcessedAt）を返す。
  app.get("/schema/aliases/:diffId/backfill", async (c) => {
    const diffId = c.req.param("diffId");
    const db = ctx({ DB: c.env.DB });
    const row = await findDiffById(db, diffId);
    if (!row) {
      return c.json({ ok: false, error: "diff not found" }, 404);
    }
    const status: "pending" | "running" | "exhausted" | "completed" =
      row.backfillStatus === "completed"
        ? "completed"
        : row.backfillStatus === "exhausted"
          ? "exhausted"
        : row.backfillStatus === "failed"
            ? "exhausted"
            : row.backfillStatus === "in_progress" || row.backfillStatus === "running"
              ? "running"
              : "pending";
    return c.json(
      {
        ok: true,
        diffId: row.diffId,
        questionId: row.questionId,
        backfill: {
          status,
          remaining: -1,
          retryCount: row.retryCount,
          lastProcessedAt: row.lastProcessedAt,
          lastError: row.lastError,
          internalStatus: row.backfillStatus,
          failedItems: row.failedItemsJson ? JSON.parse(row.failedItemsJson) : [],
        },
      },
      200,
    );
  });

  return app;
};

// 警告抑止（型のみ参照）
export type _SchemaAliasAssignResultRef = SchemaAliasAssignResult;

export const adminSchemaRoute = createAdminSchemaRoute();
