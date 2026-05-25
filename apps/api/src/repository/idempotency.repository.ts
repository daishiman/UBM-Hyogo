import type { DbCtx } from "./_shared/db";
import { isUniqueConstraintError } from "./_shared/db";

export type IdempotencyStatus = "in_flight" | "completed";

export interface IdempotencyScope {
  readonly key: string;
  readonly method: string;
  readonly path: string;
}

export interface IdempotencyRecord extends IdempotencyScope {
  readonly id: string;
  readonly requestFingerprint: string;
  readonly status: IdempotencyStatus;
  readonly responseStatus: number | null;
  readonly responseBody: string | null;
  readonly responseContentType: string | null;
  readonly createdAt: string;
  readonly completedAt: string | null;
  readonly expiresAt: string;
}

interface DbRow {
  id: string;
  idempotency_key: string;
  request_method: string;
  request_path: string;
  request_fingerprint: string;
  status: IdempotencyStatus;
  response_status: number | null;
  response_body: string | null;
  response_content_type: string | null;
  created_at: string;
  completed_at: string | null;
  expires_at: string;
}

export type ReplayDecision =
  | { type: "replay"; record: IdempotencyRecord }
  | { type: "in_flight"; record: IdempotencyRecord }
  | { type: "fingerprint_mismatch"; record: IdempotencyRecord }
  | { type: "expired"; record: IdempotencyRecord };

const SELECT_COLS =
  "SELECT id, idempotency_key, request_method, request_path, request_fingerprint, status, response_status, response_body, response_content_type, created_at, completed_at, expires_at FROM idempotency_keys";

const map = (row: DbRow): IdempotencyRecord => ({
  id: row.id,
  key: row.idempotency_key,
  method: row.request_method,
  path: row.request_path,
  requestFingerprint: row.request_fingerprint,
  status: row.status,
  responseStatus: row.response_status,
  responseBody: row.response_body,
  responseContentType: row.response_content_type,
  createdAt: row.created_at,
  completedAt: row.completed_at,
  expiresAt: row.expires_at,
});

export const isExpired = (
  row: Pick<IdempotencyRecord, "expiresAt">,
  nowIso: string,
): boolean => Date.parse(row.expiresAt) <= Date.parse(nowIso);

export const shouldReplay = (
  row: IdempotencyRecord,
  fingerprint: string,
  nowIso: string,
): ReplayDecision => {
  if (isExpired(row, nowIso)) return { type: "expired", record: row };
  if (row.requestFingerprint !== fingerprint) {
    return { type: "fingerprint_mismatch", record: row };
  }
  if (row.status === "in_flight") return { type: "in_flight", record: row };
  return { type: "replay", record: row };
};

export const findExistingByScope = async (
  ctx: DbCtx,
  scope: IdempotencyScope,
): Promise<IdempotencyRecord | null> => {
  const row = await ctx.db
    .prepare(
      `${SELECT_COLS} WHERE idempotency_key = ? AND request_method = ? AND request_path = ?`,
    )
    .bind(scope.key, scope.method, scope.path)
    .first<DbRow>();
  return row ? map(row) : null;
};

export const pruneExpired = async (
  ctx: DbCtx,
  nowIso: string,
): Promise<void> => {
  await ctx.db
    .prepare("DELETE FROM idempotency_keys WHERE expires_at <= ?")
    .bind(nowIso)
    .run();
};

export class IdempotencyConflictError extends Error {
  constructor() {
    super("idempotency scope already exists");
    this.name = "IdempotencyConflictError";
  }
}

export const insertInFlight = async (
  ctx: DbCtx,
  input: IdempotencyScope & {
    readonly id: string;
    readonly requestFingerprint: string;
    readonly nowIso: string;
    readonly expiresAt: string;
  },
): Promise<IdempotencyRecord> => {
  try {
    await ctx.db
      .prepare(
        "INSERT INTO idempotency_keys (id, idempotency_key, request_method, request_path, request_fingerprint, status, created_at, expires_at) VALUES (?, ?, ?, ?, ?, 'in_flight', ?, ?)",
      )
      .bind(
        input.id,
        input.key,
        input.method,
        input.path,
        input.requestFingerprint,
        input.nowIso,
        input.expiresAt,
      )
      .run();
  } catch (err) {
    if (isUniqueConstraintError(err)) throw new IdempotencyConflictError();
    throw err;
  }
  const inserted = await findExistingByScope(ctx, input);
  if (!inserted) throw new Error(`idempotency insert failed for ${input.id}`);
  return inserted;
};

export const saveResult = async (
  ctx: DbCtx,
  input: {
    readonly id: string;
    readonly responseStatus: number;
    readonly responseBody: string;
    readonly responseContentType: string;
    readonly completedAt: string;
  },
): Promise<void> => {
  await ctx.db
    .prepare(
      "UPDATE idempotency_keys SET status = 'completed', response_status = ?, response_body = ?, response_content_type = ?, completed_at = ? WHERE id = ?",
    )
    .bind(
      input.responseStatus,
      input.responseBody,
      input.responseContentType,
      input.completedAt,
      input.id,
    )
    .run();
};

export const deleteInFlight = async (
  ctx: DbCtx,
  id: string,
): Promise<void> => {
  await ctx.db
    .prepare("DELETE FROM idempotency_keys WHERE id = ? AND status = 'in_flight'")
    .bind(id)
    .run();
};

export const deleteById = async (ctx: DbCtx, id: string): Promise<void> => {
  await ctx.db.prepare("DELETE FROM idempotency_keys WHERE id = ?").bind(id).run();
};
