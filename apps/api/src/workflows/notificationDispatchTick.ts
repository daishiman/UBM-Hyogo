// Issue #401: notification dispatch cron tick
//
// claim → dispatcher → markSent / markRetryableFailure / moveToDlq → ledger
//
// retryable 失敗 + retry_count < maxRetries → status='pending' へ戻し backoff[next_retry] 後に再実行。
// non-retryable または retry_count+1 >= maxRetries → dlq へ遷移し ledger 'dlq' を記録。

import type {
  NotificationOutboxRepository,
  NotificationOutboxRow,
} from "../repository/notificationOutbox";
import {
  sanitizeProviderError,
  type DispatchResult,
  type NotificationDispatcher,
} from "../services/notification/dispatcher";

export interface DispatchTickDeps {
  outbox: NotificationOutboxRepository;
  dispatcher: NotificationDispatcher;
  now: () => Date;
  batchSize?: number;
  maxRetries?: number;
  backoffSchedule?: number[]; // seconds
  claimLeaseSeconds?: number;
}

export interface DispatchTickResult {
  claimed: number;
  sent: number;
  failed: number;
  dlq: number;
}

export const DEFAULT_BACKOFF_SCHEDULE = [30, 120, 600, 3600, 21600];
export const DEFAULT_MAX_RETRIES = 5;
export const DEFAULT_BATCH_SIZE = 20;
export const DEFAULT_CLAIM_LEASE_SECONDS = 15 * 60;

export const runNotificationDispatchTick = async (
  deps: DispatchTickDeps,
): Promise<DispatchTickResult> => {
  const batchSize = deps.batchSize ?? DEFAULT_BATCH_SIZE;
  const maxRetries = deps.maxRetries ?? DEFAULT_MAX_RETRIES;
  const backoff = deps.backoffSchedule ?? DEFAULT_BACKOFF_SCHEDULE;
  const claimLeaseSeconds = deps.claimLeaseSeconds ?? DEFAULT_CLAIM_LEASE_SECONDS;

  const startedAt = deps.now();
  const startedAtIso = startedAt.toISOString();
  const staleDispatchingBeforeIso = new Date(
    startedAt.getTime() - claimLeaseSeconds * 1000,
  ).toISOString();
  const rows = await deps.outbox.claimNextBatch(
    batchSize,
    startedAtIso,
    staleDispatchingBeforeIso,
  );

  const result: DispatchTickResult = {
    claimed: rows.length,
    sent: 0,
    failed: 0,
    dlq: 0,
  };

  for (const row of rows) {
    await dispatchOne(row, deps, maxRetries, backoff, result);
  }
  return result;
};

const dispatchOne = async (
  row: NotificationOutboxRow,
  deps: DispatchTickDeps,
  maxRetries: number,
  backoff: number[],
  result: DispatchTickResult,
): Promise<void> => {
  const nowIso = () => deps.now().toISOString();
  const attempt = row.retryCount + 1;
  await deps.outbox.appendLedger(
    row.notificationId,
    "dispatching",
    attempt,
    null,
    nowIso(),
  );
  const dispatchResult: DispatchResult = await deps.dispatcher.dispatch(row).catch((e) => {
    const sanitized = sanitizeProviderError(
      e instanceof Error ? e.message : String(e),
    );
    const failure: DispatchResult = { ok: false, retryable: true };
    return sanitized === undefined
      ? failure
      : { ...failure, errorMessage: sanitized };
  });

  if (dispatchResult.ok) {
    const providerMessageId = dispatchResult.providerMessageId ?? "";
    await deps.outbox.markSent(row.notificationId, providerMessageId, nowIso());
    await deps.outbox.appendLedger(
      row.notificationId,
      "sent",
      attempt,
      JSON.stringify({ providerMessageId }),
      nowIso(),
    );
    result.sent += 1;
    return;
  }

  const errorMessage = dispatchResult.errorMessage ?? "unknown_error";
  const retryable = dispatchResult.retryable;

  if (!retryable || attempt >= maxRetries) {
    await deps.outbox.moveToDlq(row.notificationId, errorMessage, nowIso());
    await deps.outbox.appendLedger(
      row.notificationId,
      "dlq",
      attempt,
      JSON.stringify({ error: errorMessage, retryable }),
      nowIso(),
    );
    result.dlq += 1;
    return;
  }

  const backoffIdx = Math.min(row.retryCount, backoff.length - 1);
  const backoffSec = backoff[backoffIdx] ?? backoff[backoff.length - 1] ?? 30;
  const nextAttemptAt = new Date(
    deps.now().getTime() + backoffSec * 1000,
  ).toISOString();

  await deps.outbox.markRetryableFailure(
    row.notificationId,
    errorMessage,
    nextAttemptAt,
    nowIso(),
  );
  await deps.outbox.appendLedger(
    row.notificationId,
    "failed",
    attempt,
    JSON.stringify({ error: errorMessage, nextAttemptAt }),
    nowIso(),
  );
  result.failed += 1;
};
