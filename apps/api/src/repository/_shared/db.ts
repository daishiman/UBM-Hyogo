// 02c が正本管理する DbCtx 型 + factory（02a / 02b も import する）
// 不変条件 #5: D1 への直接アクセスは apps/api 内に閉じる。apps/web からの import は
// dependency-cruiser / ESLint の no-restricted-imports rule で禁止する。
import type { D1Database } from "@cloudflare/workers-types";

export interface DbCtx {
  readonly db: D1Database;
}

export const ctx = (env: { DB: D1Database }): DbCtx => ({ db: env.DB });
