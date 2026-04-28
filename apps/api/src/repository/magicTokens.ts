// magic_tokens repository（single-use）
// AC-7: 一度 consume したら再利用不可。`used` フラグを楽観 lock UPDATE で守る。
// DDL: magic_tokens(token PK, member_id, email, response_id, created_at, expires_at, used INTEGER)
import type { DbCtx } from "./_shared/db";
import {
  type MagicTokenValue,
  magicTokenValue,
  type MemberId,
  type ResponseId,
} from "./_shared/brand";

export interface MagicTokenRow {
  token: MagicTokenValue;
  memberId: MemberId;
  email: string;
  responseId: ResponseId;
  createdAt: string;
  expiresAt: string;
  used: boolean;
}

export interface IssueMagicTokenInput {
  memberId: MemberId;
  email: string;
  responseId: ResponseId;
  ttlSec: number;
  now?: Date;
}

export type ConsumeResult =
  | { ok: true; row: MagicTokenRow }
  | { ok: false; reason: "not_found" | "expired" | "already_used" };

interface RawTokenRow {
  token: string;
  memberId: string;
  email: string;
  responseId: string;
  createdAt: string;
  expiresAt: string;
  used: number;
}

const SELECT_COLS =
  "token, member_id AS memberId, email, response_id AS responseId, created_at AS createdAt, expires_at AS expiresAt, used";

const toRow = (r: RawTokenRow): MagicTokenRow => ({
  token: r.token as MagicTokenValue,
  memberId: r.memberId as MemberId,
  email: r.email,
  responseId: r.responseId as ResponseId,
  createdAt: r.createdAt,
  expiresAt: r.expiresAt,
  used: r.used === 1,
});

const generateToken = (): string => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
};

export const issue = async (
  c: DbCtx,
  input: IssueMagicTokenInput,
): Promise<MagicTokenRow> => {
  const token = magicTokenValue(generateToken());
  const now = input.now ?? new Date();
  const createdAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + input.ttlSec * 1000).toISOString();
  await c.db
    .prepare(
      "INSERT INTO magic_tokens (token, member_id, email, response_id, created_at, expires_at, used) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 0)",
    )
    .bind(token, input.memberId, input.email, input.responseId, createdAt, expiresAt)
    .run();
  return {
    token,
    memberId: input.memberId,
    email: input.email,
    responseId: input.responseId,
    createdAt,
    expiresAt,
    used: false,
  };
};

export const findByToken = async (
  c: DbCtx,
  token: MagicTokenValue,
): Promise<MagicTokenRow | null> => {
  const r = await c.db
    .prepare(
      `SELECT ${SELECT_COLS} FROM magic_tokens WHERE token = ?1 LIMIT 1`,
    )
    .bind(token)
    .first<RawTokenRow>();
  return r ? toRow(r) : null;
};

export const verify = async (
  c: DbCtx,
  token: MagicTokenValue,
  now: Date = new Date(),
): Promise<MagicTokenRow | null> => {
  const row = await findByToken(c, token);
  if (!row) return null;
  if (row.used) return null;
  if (new Date(row.expiresAt).getTime() < now.getTime()) return null;
  return row;
};

export const consume = async (
  c: DbCtx,
  token: MagicTokenValue,
  now: Date = new Date(),
): Promise<ConsumeResult> => {
  const row = await findByToken(c, token);
  if (!row) return { ok: false, reason: "not_found" };
  if (row.used) return { ok: false, reason: "already_used" };
  if (new Date(row.expiresAt).getTime() < now.getTime()) {
    return { ok: false, reason: "expired" };
  }
  // 楽観 lock: used = 0 のものだけ UPDATE する。並行 consume 時の二重消費を阻止。
  const result = await c.db
    .prepare(
      "UPDATE magic_tokens SET used = 1 WHERE token = ?1 AND used = 0 AND expires_at >= ?2",
    )
    .bind(token, now.toISOString())
    .run();
  if (result.meta.changes === 0) {
    const latest = await findByToken(c, token);
    if (!latest) return { ok: false, reason: "not_found" };
    if (new Date(latest.expiresAt).getTime() < now.getTime()) {
      return { ok: false, reason: "expired" };
    }
    return { ok: false, reason: "already_used" };
  }
  return { ok: true, row: { ...row, used: true } };
};
