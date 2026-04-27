// D1Database型は@cloudflare/workers-typesで提供されるが、
// テストでは使えないため独自のinterfaceで抽象化する

export interface D1Stmt {
  bind(...values: unknown[]): D1Stmt;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<{ results: T[] }>;
  run(): Promise<{ success: boolean }>;
}

export interface D1Db {
  prepare(sql: string): D1Stmt;
  exec(sql: string): Promise<{ count: number; duration: number }>;
}

export interface DbCtx {
  readonly db: D1Db;
}

export const ctx = (env: { DB: D1Db }): DbCtx => ({ db: env.DB });
