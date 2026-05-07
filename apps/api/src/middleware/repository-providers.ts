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
import type { RepositoryProviderVariables } from "../repository/_shared/provider-context";

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
  c.set("attendanceProvider", createAttendanceProvider(dbCtx));
  await next();
};

export type { RepositoryProviderVariables };
