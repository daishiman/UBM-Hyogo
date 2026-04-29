// visibility filter (04a)
// 不変条件 #1 (schema 固定禁止) — schema_questions の visibility 列を真実とする。
// FieldVisibility = 'public' のみ残す。

export interface VisibilityIndexEntry {
  readonly stableKey: string;
  readonly visibility: string;
  readonly sectionKey: string;
  readonly sectionTitle: string;
  readonly label: string;
  readonly kind: string;
  readonly position: number;
}

export type VisibilityIndex = ReadonlyMap<string, VisibilityIndexEntry>;

export const buildVisibilityIndex = (
  rows: readonly VisibilityIndexEntry[],
): VisibilityIndex => {
  const map = new Map<string, VisibilityIndexEntry>();
  for (const row of rows) {
    map.set(row.stableKey, row);
  }
  return map;
};

export const isPublicVisibility = (
  stableKey: string,
  index: VisibilityIndex,
): boolean => index.get(stableKey)?.visibility === "public";

export const keepPublicFields = <F extends { stableKey: string }>(
  fields: readonly F[],
  index: VisibilityIndex,
): F[] => fields.filter((f) => isPublicVisibility(f.stableKey, index));
