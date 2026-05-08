// issue-371 ut-02a-followup-003: Hono context 経由で repository provider を注入する middleware。
// builder の `deps?` 引数注入経路を撤去し、`c.var.attendanceProvider` 経路へ統一するための土台。
//
// 不変条件 #5: D1 アクセスは apps/api 内 repository に閉じる。
// silent fallback 禁止: provider 未注入時は builder 側で明示的に throw する。

import type { MiddlewareHandler } from "hono";
import { ctx as makeCtx, type DbCtx } from "../repository/_shared/db";
import {
  createAttendanceProvider,
} from "../repository/attendance";
import { createAdminNotesProvider } from "../repository/adminNotes";
import { createAuditLogProvider } from "../repository/auditLog";
import { createMemberTagsProvider } from "../repository/memberTags";
import { createOutboxRepository } from "../repository/notificationOutbox";
import { createTagDefinitionsProvider } from "../repository/tagDefinitions";
import { createTagQueueProvider } from "../repository/tagQueue";
import type {
  RepositoryProviderVariables,
  WriteTagNoteProviderBundle,
  WriteTagNoteProviderVariables,
} from "../repository/_shared/provider-context";

export interface RepositoryProviderEnv {
  readonly DB: D1Database;
}

/**
 * `c.var.attendanceProvider` を bind する middleware。
 *
 * 上流 middleware (sessionGuard 等) が `c.set("ctx", ...)` 済みであればそれを再利用し、
 * 未設定であれば `c.env.DB` から動的に組み立てる（admin route のように sessionGuard を
 * 通らない経路でも動作させるため）。
 */
export const attendanceProviderMiddleware: MiddlewareHandler<{
  Bindings: RepositoryProviderEnv;
  Variables: RepositoryProviderVariables & { ctx?: DbCtx };
}> = async (c, next) => {
  const existing = c.get("ctx");
  const dbCtx: DbCtx = existing ?? makeCtx({ DB: c.env.DB });
  if (!existing) c.set("ctx", dbCtx);
  c.set("attendanceProvider", createAttendanceProvider(dbCtx));
  await next();
};

export const writeTagNoteProviderMiddleware: MiddlewareHandler<{
  Bindings: RepositoryProviderEnv;
  Variables: RepositoryProviderVariables & Partial<WriteTagNoteProviderVariables> & { ctx?: DbCtx };
}> = async (c, next) => {
  const existing = c.get("ctx");
  const dbCtx: DbCtx = existing ?? makeCtx({ DB: c.env.DB });
  if (!existing) c.set("ctx", dbCtx);
  c.set("adminNotesProvider", createAdminNotesProvider(dbCtx));
  c.set("auditLogProvider", createAuditLogProvider(dbCtx));
  c.set("notificationOutboxProvider", createOutboxRepository(dbCtx));
  c.set("tagDefinitionsProvider", createTagDefinitionsProvider(dbCtx));
  c.set("tagQueueProvider", createTagQueueProvider(dbCtx));
  c.set("memberTagsProvider", createMemberTagsProvider(dbCtx));
  await next();
};

export const createWriteTagNoteProviderBundle = (
  dbCtx: DbCtx,
): WriteTagNoteProviderBundle => ({
  adminNotesProvider: createAdminNotesProvider(dbCtx),
  auditLogProvider: createAuditLogProvider(dbCtx),
  notificationOutboxProvider: createOutboxRepository(dbCtx),
  tagDefinitionsProvider: createTagDefinitionsProvider(dbCtx),
  tagQueueProvider: createTagQueueProvider(dbCtx),
  memberTagsProvider: createMemberTagsProvider(dbCtx),
});

export type { RepositoryProviderVariables, WriteTagNoteProviderVariables };
