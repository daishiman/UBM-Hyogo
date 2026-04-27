export interface DbCtx {
  readonly db: D1Database;
}

export const isUniqueConstraintError = (err: unknown): boolean => {
  if (!(err instanceof Error)) return false;
  const m = err.message;
  return m.includes("UNIQUE constraint") || m.includes("constraint failed");
};

export const intToBool = (v: number | null | undefined): boolean => v === 1;
export const boolToInt = (v: boolean): number => (v ? 1 : 0);
