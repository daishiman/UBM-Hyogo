import type { Env } from "../env";
import { ctx } from "../repository/_shared/db";
import {
  incrementRetryWithDlqAudit,
  listPending,
  moveToDlqWithAudit,
  TAG_QUEUE_SYSTEM_ACTOR_EMAIL,
  TAG_QUEUE_TICK_BATCH_SIZE,
  TAG_QUEUE_TICK_MAX_RUNTIME_MS,
  type TagAssignmentQueueRow,
} from "../repository/tagQueue";

const RETRY_ELIGIBLE_REASON = "retry_tick";

export class NonRetryableTagQueueError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NonRetryableTagQueueError";
  }
}

export interface RetryTickDeps {
  now?: () => string;
  batchSize?: number;
  maxRuntimeMs?: number;
  processRow?: (row: TagAssignmentQueueRow) => Promise<void>;
  systemActorEmail?: string;
  clockMs?: () => number;
}

export interface RetryTickResult {
  scanned: number;
  retried: number;
  movedToDlq: number;
  noop: number;
  skipped: number;
  abortedByTimeout: boolean;
  elapsedMs: number;
}

const validateRetryPayload = async (row: TagAssignmentQueueRow): Promise<void> => {
  try {
    JSON.parse(row.suggestedTagsJson);
  } catch {
    throw new NonRetryableTagQueueError("invalid suggested_tags_json");
  }
};

const isRetryTickEligible = (row: TagAssignmentQueueRow): boolean =>
  row.reason === RETRY_ELIGIBLE_REASON ||
  row.attemptCount > 0 ||
  row.lastError !== null ||
  row.nextVisibleAt !== null;

export async function runTagQueueRetryTick(
  env: Pick<Env, "DB">,
  deps: RetryTickDeps = {},
): Promise<RetryTickResult> {
  const db = ctx(env);
  const now = deps.now ?? (() => new Date().toISOString());
  const batchSize = deps.batchSize ?? TAG_QUEUE_TICK_BATCH_SIZE;
  const maxRuntimeMs = deps.maxRuntimeMs ?? TAG_QUEUE_TICK_MAX_RUNTIME_MS;
  const processRow = deps.processRow ?? validateRetryPayload;
  const actor = deps.systemActorEmail ?? TAG_QUEUE_SYSTEM_ACTOR_EMAIL;
  const clockMs = deps.clockMs ?? (() => Date.now());
  const startedAt = clockMs();
  const result: RetryTickResult = {
    scanned: 0,
    retried: 0,
    movedToDlq: 0,
    noop: 0,
    skipped: 0,
    abortedByTimeout: false,
    elapsedMs: 0,
  };

  const rows = await listPending(db, { now: now(), limit: batchSize });
  for (const row of rows) {
    if (clockMs() - startedAt > maxRuntimeMs) {
      result.abortedByTimeout = true;
      break;
    }
    result.scanned += 1;

    if (!isRetryTickEligible(row)) {
      result.skipped += 1;
      continue;
    }

    try {
      await processRow(row);
      const moved = await incrementRetryWithDlqAudit(
        db,
        row.queueId,
        row.lastError ?? "retry tick",
        now(),
        actor,
      );
      if (moved.moved === "dlq") result.movedToDlq += 1;
      else if (moved.moved === "retry") result.retried += 1;
      else result.noop += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const moved = error instanceof NonRetryableTagQueueError
        ? await moveToDlqWithAudit(db, row.queueId, message, now(), actor)
        : await incrementRetryWithDlqAudit(db, row.queueId, message, now(), actor);

      if ("changed" in moved) {
        if (moved.changed) result.movedToDlq += 1;
        else result.noop += 1;
      } else if (moved.moved === "dlq") result.movedToDlq += 1;
      else if (moved.moved === "retry") result.retried += 1;
      else result.noop += 1;
    }
  }

  result.elapsedMs = clockMs() - startedAt;
  return result;
}
