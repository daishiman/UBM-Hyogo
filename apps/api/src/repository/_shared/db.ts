export interface D1Stmt {
  bind(...values: unknown[]): D1Stmt;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<{ results: T[] }>;
  run(): Promise<{ success: boolean; meta: { changes: number; last_row_id: number } }>;
}

export interface D1Db {
  prepare(sql: string): D1Stmt;
  exec(sql: string): Promise<{ count: number; duration: number }>;
}

export interface DbCtx {
  readonly db: D1Db;
}

export const ctx = (env: { DB: D1Db }): DbCtx => ({ db: env.DB });

export const isUniqueConstraintError = (err: unknown): boolean => {
  if (!(err instanceof Error)) return false;
  const m = err.message;
  return m.includes("UNIQUE constraint") || m.includes("constraint failed");
};

export const intToBool = (v: number | null | undefined): boolean => v === 1;
export const boolToInt = (v: boolean): number => (v ? 1 : 0);
