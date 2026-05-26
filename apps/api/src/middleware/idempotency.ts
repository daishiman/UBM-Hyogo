import type { MiddlewareHandler } from "hono";
import { ctx as dbCtx } from "../repository/_shared/db";
import {
  deleteById,
  deleteInFlight,
  findExistingByScope,
  IdempotencyConflictError,
  insertInFlight,
  pruneExpired,
  saveResult,
  shouldReplay,
  type IdempotencyScope,
} from "../repository/idempotency.repository";

const IDEMPOTENT_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_REPLAY_BODY_BYTES = 64 * 1024;

export interface IdempotencyEnv {
  readonly DB: D1Database;
  readonly IDEMPOTENCY_TTL_SECONDS?: string;
}

export const buildScopeKey = (
  key: string,
  method: string,
  path: string,
): IdempotencyScope => ({
  key,
  method: method.toUpperCase(),
  path,
});

export const resolveTtlMs = (raw?: string): number => {
  const seconds = raw ? Number(raw) : Number.NaN;
  if (Number.isFinite(seconds) && seconds > 0) return seconds * 1000;
  return DEFAULT_TTL_MS;
};

export const isJsonContentType = (value: string | null): boolean =>
  Boolean(value?.toLowerCase().split(";")[0]?.trim().endsWith("/json") ||
    value?.toLowerCase().split(";")[0]?.trim() === "application/json" ||
    value?.toLowerCase().split(";")[0]?.trim().endsWith("+json"));

const toHex = (bytes: ArrayBuffer): string =>
  Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

export const computeFingerprint = async (
  method: string,
  path: string,
  body: string,
): Promise<string> => {
  const data = new TextEncoder().encode(
    JSON.stringify({ method: method.toUpperCase(), path, body }),
  );
  return toHex(await crypto.subtle.digest("SHA-256", data));
};

const replayResponse = (
  status: number,
  body: string,
  contentType: string | null,
): Response =>
  new Response(body, {
    status,
    headers: {
      "content-type": contentType ?? "application/json",
      "x-idempotency-replayed": "true",
    },
  });

export const idempotency = (): MiddlewareHandler<{
  Bindings: IdempotencyEnv;
}> => {
  return async (c, next) => {
    const method = c.req.method.toUpperCase();
    const key = c.req.header("idempotency-key")?.trim();
    if (!key || !IDEMPOTENT_METHODS.has(method)) {
      await next();
      return;
    }

    const path = new URL(c.req.url).pathname;
    const scope = buildScopeKey(key, method, path);
    const body = await c.req.raw.clone().text();
    const fingerprint = await computeFingerprint(method, path, body);
    const nowIso = new Date().toISOString();
    const expiresAt = new Date(
      Date.parse(nowIso) + resolveTtlMs(c.env.IDEMPOTENCY_TTL_SECONDS),
    ).toISOString();
    const db = dbCtx({ DB: c.env.DB });

    await pruneExpired(db, nowIso);

    let record = await findExistingByScope(db, scope);
    if (record) {
      const decision = shouldReplay(record, fingerprint, nowIso);
      if (decision.type === "fingerprint_mismatch") {
        return c.json({ ok: false, error: "idempotency_key_reused" }, 422);
      }
      if (decision.type === "in_flight") {
        return c.json({ ok: false, error: "idempotency_in_flight" }, 409);
      }
      if (decision.type === "replay") {
        return replayResponse(
          record.responseStatus ?? 200,
          record.responseBody ?? "{}",
          record.responseContentType,
        );
      }
      await deleteById(db, record.id);
    }

    try {
      record = await insertInFlight(db, {
        ...scope,
        id: crypto.randomUUID(),
        requestFingerprint: fingerprint,
        nowIso,
        expiresAt,
      });
    } catch (err) {
      if (!(err instanceof IdempotencyConflictError)) throw err;
      const existing = await findExistingByScope(db, scope);
      if (!existing) throw err;
      const decision = shouldReplay(existing, fingerprint, nowIso);
      if (decision.type === "fingerprint_mismatch") {
        return c.json({ ok: false, error: "idempotency_key_reused" }, 422);
      }
      if (decision.type === "replay") {
        return replayResponse(
          existing.responseStatus ?? 200,
          existing.responseBody ?? "{}",
          existing.responseContentType,
        );
      }
      return c.json({ ok: false, error: "idempotency_in_flight" }, 409);
    }

    try {
      await next();
    } catch (err) {
      await deleteInFlight(db, record.id);
      throw err;
    }

    const response = c.res;
    const contentType = response.headers.get("content-type");
    if (response.status >= 500 || !isJsonContentType(contentType)) {
      await deleteInFlight(db, record.id);
      return;
    }

    const responseBody = await response.clone().text();
    if (new TextEncoder().encode(responseBody).byteLength > MAX_REPLAY_BODY_BYTES) {
      await deleteInFlight(db, record.id);
      return;
    }

    try {
      await saveResult(db, {
        id: record.id,
        responseStatus: response.status,
        responseBody,
        responseContentType: contentType ?? "application/json",
        completedAt: new Date().toISOString(),
      });
    } catch (err) {
      await deleteInFlight(db, record.id);
      console.error("failed to persist idempotency response", err);
    }
    return;
  };
};
