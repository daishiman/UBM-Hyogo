// Phase 5: forms-schema-sync.ts
// runSchemaSync(env, deps) = lock(start) -> fetch -> flatten -> upsert -> ledger close
// AC-1 / AC-2 / AC-4 / AC-5 / AC-6 / AC-8 を統合的に satisfy する。
import type { GoogleFormsClient } from "@ubm-hyogo/integrations-google";
import { mapFormSchema, type RawForm } from "@ubm-hyogo/integrations-google";
import { asStableKey, STABLE_KEY_LIST } from "@ubm-hyogo/shared";
import { ctx as makeCtx, type DbCtx } from "../../repository/_shared/db";
import * as syncJobs from "../../repository/syncJobs";
import * as schemaVersionsRepo from "../../repository/schemaVersions";
import * as schemaQuestionsRepo from "../../repository/schemaQuestions";
import { flatten, countSections } from "./flatten";
import { schemaHash } from "./schema-hash";
import { resolveStableKey, UNKNOWN_SENTINEL } from "./resolve-stable-key";
import { diffQueueWriter } from "./diff-queue-writer";
import {
  ConflictError,
  SyncIntegrityError,
  type FlatQuestion,
  type RunResult,
  type SchemaSyncEnv,
} from "./types";

export interface SchemaSyncDeps {
  readonly ctx: DbCtx;
  readonly formsClient: Pick<GoogleFormsClient, "getForm"> & {
    /** raw RawForm を取得する fetch。AC-1 の section/item 正確性保証のため必須 */
    readonly getRawForm: (formId: string) => Promise<RawForm>;
  };
  readonly now?: () => Date;
}

const EXPECTED_QUESTION_COUNT = 31;
const EXPECTED_SECTION_COUNT = 6;
const SCHEMA_SYNC: syncJobs.SyncJobKind = "schema_sync";

/**
 * 既存 mapper（packages/integrations-google）が管理する label→stableKey マップを取り出す。
 * - mapFormSchema を 1 度呼ぶだけで stableKey が確定する。
 * - mapper は未知 label に対して slug fallback を返すため、shared の STABLE_KEY_LIST に
 *   存在しないキーは「未解決」として null に正規化する（AC-2）。
 * - sync モジュール側に stableKey リテラルを書かないことで AC-7 を担保する。
 */
const KNOWN_KEY_SET: ReadonlySet<string> = new Set<string>(STABLE_KEY_LIST);

const buildLabelToStableKey = (raw: RawForm): Map<string, string> => {
  const schema = mapFormSchema({
    raw,
    schemaHash: "tmp",
    syncedAt: new Date().toISOString(),
  });
  const map = new Map<string, string>();
  for (const f of schema.fields) {
    if (!f.label) continue;
    const key = f.stableKey as unknown as string;
    if (!KNOWN_KEY_SET.has(key)) continue; // slug fallback などは未解決扱い
    map.set(f.label, key);
  }
  return map;
};

/**
 * runSchemaSync: 1 回の schema sync。
 * - 同種 job が running の場合は ConflictError（AC-6）。
 * - revisionId は upsertManifest が冪等に処理（AC-4）。
 * - 31 件 / 6 section が揃わない場合は SyncIntegrityError → failed（AC-1）。
 * - 各 question について known/alias で stable_key を解決し、null は diff queue に enqueue（AC-2）。
 * - sync_jobs に running -> succeeded/failed を記録（AC-5）。
 */
export async function runSchemaSync(
  env: SchemaSyncEnv,
  deps: SchemaSyncDeps,
): Promise<RunResult> {
  // AC-6: 同種 schema_sync が running なら 409
  const latest = await syncJobs.findLatest(deps.ctx, SCHEMA_SYNC);
  if (latest && latest.status === "running") {
    throw new ConflictError(`schema_sync already running: ${latest.jobId}`);
  }

  const job = await syncJobs.start(deps.ctx, SCHEMA_SYNC);
  const formId = env.GOOGLE_FORM_ID ?? "";
  if (!formId) {
    await syncJobs.fail(deps.ctx, job.jobId, {
      code: "MISSING_FORM_ID",
      message: "GOOGLE_FORM_ID is not configured",
    });
    throw new SyncIntegrityError("GOOGLE_FORM_ID not configured");
  }

  try {
    // forms.get → raw 取得。getRawForm fallback は無いと正規化済み schema しか取れない場合があるため、
    // テストでは getRawForm を deps から注入する。
    const raw = await deps.formsClient.getRawForm(formId);

    const sectionCount = countSections(raw.items);
    const flat: FlatQuestion[] = flatten(raw.items);

    if (flat.length !== EXPECTED_QUESTION_COUNT) {
      throw new SyncIntegrityError(
        `item count != ${EXPECTED_QUESTION_COUNT}: got ${flat.length}`,
      );
    }
    if (sectionCount !== EXPECTED_SECTION_COUNT) {
      throw new SyncIntegrityError(
        `section count != ${EXPECTED_SECTION_COUNT}: got ${sectionCount}`,
      );
    }

    const hash = await schemaHash(flat);
    const labelMap = buildLabelToStableKey(raw);

    const revisionId = raw.revisionId ?? "unknown";
    const resolvedQuestions = [];
    for (const q of flat) {
      const resolved = await resolveStableKey(q, {
        ctx: deps.ctx,
        labelToKnownStableKey: (label) => labelMap.get(label) ?? null,
      });
      resolvedQuestions.push({ q, resolved });
    }
    const unknownFieldCount = resolvedQuestions.filter(
      ({ resolved }) => resolved.source === "unknown",
    ).length;

    // schema_versions upsert（AC-4: 同 revisionId は no-op）
    await schemaVersionsRepo.upsertManifest(deps.ctx, {
      formId,
      revisionId,
      schemaHash: hash,
      state: "active",
      sourceUrl:
        raw.responderUri ??
        env.GOOGLE_FORM_RESPONDER_URL ??
        `https://docs.google.com/forms/d/${formId}`,
      fieldCount: flat.length,
      unknownFieldCount,
    });

    // 各 question を upsert + 必要なら diff queue
    let diffEnqueued = 0;
    for (const { q, resolved } of resolvedQuestions) {
      const finalKey = resolved.stableKey ?? UNKNOWN_SENTINEL;
      const questionPk = `${revisionId}:${q.questionId}`;
      await schemaQuestionsRepo.upsertField(deps.ctx, {
        questionPk,
        revisionId,
        stableKey: asStableKey(finalKey),
        questionId: q.questionId,
        itemId: q.itemId,
        sectionKey: `section_${q.sectionIndex + 1}`,
        sectionTitle: q.sectionTitle,
        label: q.title,
        kind: q.kind,
        position: q.position,
        required: q.required,
        visibility: "public",
        searchable: true,
        status: "active",
        choiceLabelsJson: JSON.stringify(q.options ?? []),
      });
      if (resolved.source === "unknown") {
        const r = await diffQueueWriter.enqueue(deps.ctx, {
          revisionId,
          questionId: q.questionId,
          label: q.title,
          diffKind: "unresolved",
        });
        if (r.enqueued) diffEnqueued += 1;
      }
    }

    await syncJobs.succeed(deps.ctx, job.jobId, {
      upserted: flat.length,
      diffEnqueued,
      revisionId,
    });
    return {
      jobId: job.jobId,
      status: "succeeded",
      revisionId,
      upserted: flat.length,
      diffEnqueued,
    };
  } catch (e) {
    const err = normalizeError(e);
    await syncJobs.fail(deps.ctx, job.jobId, err);
    throw e;
  }
}

const normalizeError = (e: unknown): Record<string, unknown> => {
  if (e instanceof Error) {
    return { code: e.name, message: e.message };
  }
  return { code: "UnknownError", message: String(e) };
};

export { ConflictError, SyncIntegrityError } from "./types";

// helper: env → DbCtx
export const ctxFromEnv = (env: SchemaSyncEnv): DbCtx => makeCtx({ DB: env.DB });
