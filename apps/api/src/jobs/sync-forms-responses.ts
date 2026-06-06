// 03b: forms-response-sync ジョブ entry。
// AC-1〜AC-10 を集約する。`forms.responses.list` を cursor pagination で
// 取得し、stableKey 経由で answers を正規化、unknown は schema_diff_queue に
// 集約、current_response を email 単位で切り替え、consent snapshot を
// member_status に反映する。
//
// 不変条件:
//   #2 consent キー (publicConsent / rulesConsent) のみ
//   #3 responseEmail = system field
//   #4 既存 response 本文は同 responseId の upsert のみ許容
//   #7 ResponseId / MemberId は brand 型
//   #10 per-sync write < 200 行

import {
  acquireSyncLock,
  releaseSyncLock,
  type SyncLock,
} from "./sync-lock";
import { readLastCursor } from "./cursor-store";
import {
  RESPONSE_SYNC,
  SYNC_LOCK_TTL_MS,
} from "./_shared/sync-jobs-schema";
import { normalizeResponse } from "./mappers/normalize-response";
import { extractConsent } from "./mappers/extract-consent";

import {
  asMemberId,
  asResponseEmail,
  asResponseId,
  asStableKey,
} from "@ubm-hyogo/shared";
import type {
  MemberId,
  MemberResponse,
  ResponseId,
  SyncTriggerType,
} from "@ubm-hyogo/shared";

import { ctx } from "../repository/_shared/db";
import {
  findIdentityByEmail,
  updateCurrentResponse,
} from "../repository/identities";
import { upsertMember } from "../repository/members";
import { upsertResponse } from "../repository/responses";
import {
  upsertExtraField,
  upsertKnownField,
} from "../repository/responseFields";
import {
  ensureMemberStatusRow,
  getStatus,
  setConsentSnapshot,
} from "../repository/status";
import {
  decidePublishState,
  isAdminOverrideStatus,
  normalizeConsentValue,
  normalizePublishState,
} from "../lib/policies/auto-publish";
import { enqueue as enqueueDiff } from "../repository/schemaDiffQueue";
import {
  enqueueTagCandidate,
  parsePaused,
} from "../workflows/tagCandidateEnqueue";
import { start, succeed, fail } from "../repository/syncJobs";
import {
  evaluateConsecutiveCapHits,
  emitConsecutiveCapHitEvent,
  CAP_ALERT_DEFAULT_WINDOW,
} from "./cap-alert";

import type { GoogleFormsClient } from "@ubm-hyogo/integrations";

export interface ResponseSyncEnv {
  readonly DB: D1Database;
  readonly GOOGLE_FORM_ID?: string;
  readonly RESPONSE_SYNC_WRITE_CAP?: string;
  readonly TAG_QUEUE_PAUSED?: string;
  // 03b-followup-006: per-sync write cap 連続到達検知の event emit 先
  readonly SYNC_ALERTS?: AnalyticsEngineDataset;
  // members-not-displaying-form-sync-investigation Task B:
  // "true" のとき consent 反映後に publish_state を auto-publish policy で更新する。
  readonly MEMBERS_AUTO_PUBLISH_ON_CONSENT?: string;
}

export interface ResponseSyncOptions {
  readonly trigger: SyncTriggerType;
  readonly fullSync?: boolean;
  readonly cursor?: string;
  readonly client: GoogleFormsClient;
  readonly formId?: string;
  readonly now?: () => Date;
  readonly runId?: string;
  readonly lockTtlMs?: number;
}

export interface ResponseSyncResult {
  readonly status: "succeeded" | "failed" | "skipped";
  readonly jobId: string;
  readonly processedCount: number;
  readonly writeCount: number;
  readonly cursor: string | null;
  readonly durationMs: number;
  readonly skippedReason?: string;
  readonly error?: string;
}

// issue-1089: 全件 backfill 承認前の影響件数プレビュー（dry-run / count-only）。
// run の "succeeded"/"failed"/"skipped" と区別する固定リテラル status="preview"。
export interface ResponseSyncPreview {
  readonly status: "preview";
  readonly dryRun: true;
  readonly responseCount: number; // 実数: 処理対象になる response 数
  readonly estimatedWrites: number; // 推定: 対象 response の estimateResponseWrites 合計
  readonly pagesScanned: number; // 走査ページ数（capped 判定の根拠）
  readonly capped: boolean; // safetyCounter 上限(100)で打ち切ったか
}

export interface ResponseSyncPreviewOptions {
  readonly fullSync?: boolean;
  readonly cursor?: string;
  readonly client: GoogleFormsClient;
  readonly formId?: string;
}

const DEFAULT_WRITE_CAP = 200;
const LOCK_ID = "response-sync";
const PREVIEW_PAGE_CAP = 100;

export async function runResponseSync(
  env: ResponseSyncEnv,
  options: ResponseSyncOptions,
): Promise<ResponseSyncResult> {
  const now = options.now ?? (() => new Date());
  const startedAt = now().getTime();
  const durationMs = () => Math.max(0, now().getTime() - startedAt);
  const writeCap = parseIntOrDefault(
    env.RESPONSE_SYNC_WRITE_CAP,
    DEFAULT_WRITE_CAP,
  );
  const formId = options.formId ?? env.GOOGLE_FORM_ID;
  if (!formId) {
    throw new Error("GOOGLE_FORM_ID 未設定");
  }

  // sync_jobs ledger を先に start し、job_id を確定させる
  const dbCtx = ctx({ DB: env.DB });
  const jobRow = await start(dbCtx, RESPONSE_SYNC);
  const jobId = jobRow.jobId;

  // 二重起動防止 lock
  let lock: SyncLock | null = null;
  try {
    lock = await acquireSyncLock(env.DB, {
      lockId: LOCK_ID,
      holder: jobId,
      triggerType: options.trigger,
      ttlMs: options.lockTtlMs ?? SYNC_LOCK_TTL_MS,
      now,
    });
  } catch (_err) {
    lock = null;
  }
  if (!lock) {
    // 既に同種 sync が走っている → skipped で ledger close
    await succeed(dbCtx, jobId, {
      cursor: null,
      writes: 0,
      processed: 0,
      skipped: true,
      writeCapHit: false,
      reason: "another response sync is in progress",
    });
    return {
      status: "skipped",
      jobId,
      processedCount: 0,
      writeCount: 0,
      cursor: null,
      durationMs: durationMs(),
      skippedReason: "another response sync is in progress",
    };
  }

  let processed = 0;
  let writes = 0;
  let writeCapHit = false;
  let cursor: string | null;
  if (options.fullSync) {
    cursor = null;
  } else if (options.cursor !== undefined) {
    cursor = options.cursor;
  } else {
    cursor = await readLastCursor(env.DB);
  }
  let highWater = parseHighWaterCursor(cursor);
  const tagQueuePaused = parsePaused(env);
  const autoPublishEnabled = parseAutoPublishFlag(env);

  try {
    let nextPageToken: string | undefined;
    let stopDueToCap = false;
    let safetyCounter = 0;
    while (true) {
      safetyCounter += 1;
      if (safetyCounter > 100) throw new Error("response sync loop overflow");

      const page = await options.client.listResponses(formId, {
        ...(nextPageToken !== undefined ? { pageToken: nextPageToken } : {}),
        ...(highWater !== null ? { since: highWater.submittedAt } : {}),
      });
      for (const resp of page.responses) {
        if (highWater && !isAfterHighWater(resp, highWater)) continue;
        const estimatedWrites = estimateResponseWrites(resp, autoPublishEnabled);
        if (processed > 0 && writes + estimatedWrites >= writeCap) {
          cursor = formatHighWaterCursor(highWater);
          stopDueToCap = true;
          break;
        }
        const stats = await processResponse(env.DB, resp, {
          tagQueuePaused,
          autoPublishEnabled,
        });
        processed += 1;
        writes += stats.writeCount;
        highWater = maxHighWater(highWater, resp);
        cursor = formatHighWaterCursor(highWater);
        if (writes >= writeCap) break;
      }
      if (stopDueToCap) break;
      if (writes >= writeCap) break;
      nextPageToken = page.nextPageToken;
      if (!nextPageToken) break;
      if (writes >= writeCap) break;
    }
    writeCapHit = stopDueToCap || writes >= writeCap;
  } catch (err) {
    await fail(dbCtx, jobId, {
      code: classifyError(err),
      message: redact(err instanceof Error ? err.message : String(err)),
      payload: { kind: RESPONSE_SYNC },
    });
    if (lock) {
      await releaseSyncLock(env.DB, lock).catch(() => undefined);
    }
    return {
      status: "failed",
      jobId,
      processedCount: processed,
      writeCount: writes,
      cursor,
      durationMs: durationMs(),
      error: err instanceof Error ? err.message : String(err),
    };
  }

  await succeed(dbCtx, jobId, {
    cursor,
    writes,
    processed,
    writeCapHit,
  });
  if (writeCapHit) {
    try {
      const capAlertEnv = env.SYNC_ALERTS
        ? { DB: env.DB, SYNC_ALERTS: env.SYNC_ALERTS }
        : { DB: env.DB };
      const evalResult = await evaluateConsecutiveCapHits(capAlertEnv, {
        window: CAP_ALERT_DEFAULT_WINDOW,
        jobKind: RESPONSE_SYNC,
      });
      if (evalResult.shouldEmit) {
        await emitConsecutiveCapHitEvent(capAlertEnv, {
          jobId,
          jobKind: RESPONSE_SYNC,
          consecutiveHits: evalResult.consecutiveHits,
          windowSize: evalResult.windowSize,
        });
      }
    } catch (err) {
      console.warn(
        "[cap-alert] detector/emit failed",
        err instanceof Error ? err.message : String(err),
      );
    }
  }
  if (lock) {
    await releaseSyncLock(env.DB, lock).catch(() => undefined);
  }
  return {
    status: "succeeded",
    jobId,
    processedCount: processed,
    writeCount: writes,
    cursor,
    durationMs: durationMs(),
  };
}

/**
 * issue-1089: 全件 backfill の影響件数を read-only で集計する dry-run 経路。
 *
 * 不変条件 #3（read-only）を厳守する:
 *   - acquireSyncLock を呼ばない（preview は二重起動防止対象外）
 *   - start / succeed / fail（sync_jobs ledger）を呼ばない
 *   - processResponse を呼ばない（D1 write ゼロ）
 *   - PII（responseEmail / responseId / questionId）を返さない（件数のみ）
 *
 * cursor 決定・highWater フィルタ・estimateResponseWrites は runResponseSync と
 * 同一ロジックを共有し、「実際に処理対象になる response 数」と整合させる。
 */
export async function previewResponseSync(
  env: ResponseSyncEnv,
  options: ResponseSyncPreviewOptions,
): Promise<ResponseSyncPreview> {
  // 1. formId 解決（runResponseSync と同一・未設定 throw）
  const formId = options.formId ?? env.GOOGLE_FORM_ID;
  if (!formId) {
    throw new Error("GOOGLE_FORM_ID 未設定");
  }

  // 2. cursor 決定（runResponseSync と同一・読取のみ）
  let cursor: string | null;
  if (options.fullSync) {
    cursor = null;
  } else if (options.cursor !== undefined) {
    cursor = options.cursor;
  } else {
    cursor = await readLastCursor(env.DB);
  }
  const highWater = parseHighWaterCursor(cursor);
  const autoPublishEnabled = parseAutoPublishFlag(env);

  let responseCount = 0;
  let estimatedWrites = 0;
  let pagesScanned = 0;
  let capped = false;
  let nextPageToken: string | undefined;
  let safetyCounter = 0;

  while (true) {
    safetyCounter += 1;
    // capped: 100 page 上限で打ち切り（runResponseSync の overflow guard と同値・DD6）
    if (safetyCounter > PREVIEW_PAGE_CAP) {
      capped = true;
      break;
    }
    const page = await options.client.listResponses(formId, {
      ...(nextPageToken !== undefined ? { pageToken: nextPageToken } : {}),
      ...(highWater !== null ? { since: highWater.submittedAt } : {}),
    });
    pagesScanned += 1;
    for (const resp of page.responses) {
      // highWater フィルタ（runResponseSync と同条件）
      if (highWater && !isAfterHighWater(resp, highWater)) continue;
      // responseEmail 無は processResponse が skip（writeCount 0）→ 数えない（実挙動整合）
      if (!resp.responseEmail) continue;
      responseCount += 1;
      estimatedWrites += estimateResponseWrites(resp, autoPublishEnabled);
    }
    nextPageToken = page.nextPageToken;
    if (!nextPageToken) break;
  }

  return {
    status: "preview",
    dryRun: true,
    responseCount,
    estimatedWrites,
    pagesScanned,
    capped,
  };
}

interface PerResponseStats {
  readonly writeCount: number;
}

export async function processResponse(
  db: D1Database,
  resp: MemberResponse,
  options: {
    readonly tagQueuePaused?: boolean;
    readonly autoPublishEnabled?: boolean;
  } = {},
): Promise<PerResponseStats> {
  const dbCtx = ctx({ DB: db });
  const responseId = resp.responseId as ResponseId;
  let writeCount = 0;

  // 1. member_identities 解決（responseEmail がない response は skip）
  if (!resp.responseEmail) {
    return { writeCount: 0 };
  }
  const responseEmail = resp.responseEmail;

  const existingIdentity = await findIdentityByEmail(dbCtx, responseEmail);
  let memberId: MemberId;
  let isFirstResponse = false;
  if (existingIdentity) {
    memberId = asMemberId(existingIdentity.member_id);
  } else {
    memberId = asMemberId(crypto.randomUUID());
    isFirstResponse = true;
    await upsertMember(dbCtx, {
      memberId,
      responseEmail,
      currentResponseId: responseId,
      firstResponseId: responseId,
      lastSubmittedAt: resp.submittedAt,
    });
    await ensureMemberStatusRow(dbCtx, memberId);
    // upsertMember + ensureMemberStatusRow の 2 write
    writeCount += 2;
  }

  // 2. member_responses upsert（responseEmail を system field 列に保存）
  await upsertResponse(dbCtx, {
    responseId,
    formId: resp.formId,
    revisionId: resp.revisionId,
    schemaHash: resp.schemaHash,
    responseEmail: asResponseEmail(responseEmail),
    submittedAt: resp.submittedAt,
    editResponseUrl: resp.editResponseUrl,
    answersJson: JSON.stringify(resp.answersByStableKey),
    rawAnswersJson: JSON.stringify(resp.rawAnswersByQuestionId),
    extraFieldsJson: JSON.stringify(resp.extraFields),
    unmappedQuestionIdsJson: JSON.stringify(resp.unmappedQuestionIds),
    searchText: resp.searchText,
  });
  writeCount += 1;

  // 3. response_fields upsert（known + extra）
  const normalized = normalizeResponse(resp);
  for (const known of normalized.known.values()) {
    await upsertKnownField(
      dbCtx,
      responseId,
      asStableKey(known.stableKey),
      known.valueJson,
      known.rawValueJson,
    );
    writeCount += 1;
  }
  for (const u of normalized.unknown.values()) {
    await upsertExtraField(dbCtx, responseId, u.questionId, u.rawValueJson);
    writeCount += 1;
    // 4. schema_diff_queue 投入（重複 enqueue は SQL UNIQUE 制約 + try/catch で no-op）
    try {
      await enqueueDiff(dbCtx, {
        diffId: `${resp.revisionId}:${u.questionId}`,
        revisionId: resp.revisionId,
        type: "added",
        questionId: u.questionId,
        stableKey: null,
        label: u.questionId,
        suggestedStableKey: null,
      });
      writeCount += 1;
    } catch (_e) {
      // 既存 (status='queued') と衝突した場合は no-op（AC-2）
    }
  }

  // 5. current_response 切替（既存 identity の場合のみ。新規は upsert で完了）
  if (!isFirstResponse && existingIdentity) {
    const shouldUpdate = decideShouldUpdate(
      existingIdentity.last_submitted_at,
      existingIdentity.current_response_id,
      resp.submittedAt,
      resp.responseId,
    );
    if (shouldUpdate) {
      await updateCurrentResponse(
        dbCtx,
        memberId,
        responseId,
        resp.submittedAt,
      );
      writeCount += 1;
    }
  }

  // 6. consent snapshot（is_deleted=true は skip）
  const consents = extractConsent(resp);
  const status = await getStatus(dbCtx, memberId);
  if (!status || status.is_deleted !== 1) {
    await setConsentSnapshot(
      dbCtx,
      memberId,
      consents.publicConsent,
      consents.rulesConsent,
    );
    writeCount += 1;

    // 6b. auto-publish policy（flag 有効時のみ）
    if (options.autoPublishEnabled === true) {
      const after = await getStatus(dbCtx, memberId);
      const currentPublishState = normalizePublishState(
        after?.publish_state as string | null | undefined,
      );
      const updatedBy =
        (after?.updated_by as string | null | undefined) ?? null;
      const isOverride = isAdminOverrideStatus({
        currentPublishState,
        updatedBy,
      });
      const nextState = decidePublishState({
        currentPublishState,
        publicConsent: normalizeConsentValue(consents.publicConsent),
        hasAdminExplicitOverride: isOverride,
        flagEnabled: true,
      });
      if (!isOverride && nextState !== currentPublishState) {
        await db
          .prepare(
            `UPDATE member_status
             SET publish_state = ?1,
                 updated_by = 'system:sync',
                 updated_at = datetime('now')
             WHERE member_id = ?2`,
          )
          .bind(nextState, memberId as unknown as string)
          .run();
        writeCount += 1;
      }
    }
  }

  // 7. tag candidate 自動投入（07a hook）
  //    member_tags 空 + 未解決 queue 無し のときだけ candidate 行を 1 件作る。
  //    削除済み member は skip（不変条件 #13 + AC-7 の precaution）。
  if (!status || status.is_deleted !== 1) {
    const result = await enqueueTagCandidate(dbCtx, {
      memberId,
      responseId,
    }, options.tagQueuePaused === true);
    if (result.enqueued) writeCount += 1;
  }

  return { writeCount };
}

/**
 * AC-1: submittedAt 降順 / 同値なら responseId lex max を current_response に採用
 */
export function decideShouldUpdate(
  currentSubmittedAt: string,
  currentResponseId: string,
  newSubmittedAt: string,
  newResponseId: string,
): boolean {
  if (newSubmittedAt > currentSubmittedAt) return true;
  if (newSubmittedAt < currentSubmittedAt) return false;
  return newResponseId > currentResponseId;
}

function parseIntOrDefault(value: string | undefined, def: number): number {
  if (!value) return def;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : def;
}

interface HighWaterCursor {
  readonly submittedAt: string;
  readonly responseId: string;
}

function parseHighWaterCursor(cursor: string | null): HighWaterCursor | null {
  if (!cursor) return null;
  const [submittedAt, responseId] = cursor.split("|");
  if (!submittedAt || !responseId) return null;
  return { submittedAt, responseId };
}

function formatHighWaterCursor(cursor: HighWaterCursor | null): string | null {
  return cursor ? `${cursor.submittedAt}|${cursor.responseId}` : null;
}

function isAfterHighWater(
  resp: MemberResponse,
  cursor: HighWaterCursor,
): boolean {
  if (resp.submittedAt > cursor.submittedAt) return true;
  if (resp.submittedAt < cursor.submittedAt) return false;
  return resp.responseId > cursor.responseId;
}

function maxHighWater(
  current: HighWaterCursor | null,
  resp: MemberResponse,
): HighWaterCursor {
  const next = {
    submittedAt: resp.submittedAt,
    responseId: resp.responseId,
  };
  if (!current) return next;
  return isAfterHighWater(resp, current) ? next : current;
}

function estimateResponseWrites(
  resp: MemberResponse,
  autoPublishEnabled = false,
): number {
  const knownCount = Object.keys(resp.answersByStableKey).length;
  const unknownCount = resp.unmappedQuestionIds.length;
  // member/member_response/status ensure/consent/tag candidate の基礎 write + known fields + unknown field/diff。
  // auto-publish policy 有効時は publish_state UPDATE 用に +1 を見込む。
  return 5 + knownCount + unknownCount * 2 + (autoPublishEnabled ? 1 : 0);
}

function parseAutoPublishFlag(env: ResponseSyncEnv): boolean {
  const raw = env.MEMBERS_AUTO_PUBLISH_ON_CONSENT;
  if (!raw) return false;
  return raw.toLowerCase() === "true";
}

function classifyError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (/429|quota|rate/i.test(message)) return "QUOTA";
  if (/401|unauth/i.test(message)) return "FORMS_AUTH";
  if (/5\d\d/.test(message)) return "FORMS_5XX";
  if (/cursor|pageToken/i.test(message)) return "CURSOR_INVALID";
  if (/UNIQUE|constraint/i.test(message)) return "EMAIL_CONFLICT";
  if (/timeout/i.test(message)) return "DB_TIMEOUT";
  return "INTERNAL";
}

/** PII (responseEmail / responseId / questionId) を payload・log に出さないよう redact */
function redact(s: string): string {
  return s
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "<email>")
    .slice(0, 500);
}
