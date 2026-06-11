import type { TagDefinitionItem } from "./tagCatalogLifecycle";

export interface TagDefinitionListView {
  readonly total: number;
  readonly items: readonly TagDefinitionItem[];
}

type RawTagDefinition = {
  readonly tagId?: unknown;
  readonly code?: unknown;
  readonly label?: unknown;
  readonly category?: unknown;
  readonly active?: unknown;
};

type RawTagDefinitionList = {
  readonly total?: unknown;
  readonly items?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const normalizeActive = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  return true;
};

export function normalizeTagDefinitionItem(
  value: unknown,
): TagDefinitionItem | null {
  if (!isRecord(value)) return null;
  const row = value as RawTagDefinition;
  if (
    typeof row.tagId !== "string" ||
    typeof row.code !== "string" ||
    typeof row.label !== "string" ||
    typeof row.category !== "string"
  ) {
    return null;
  }
  return {
    tagId: row.tagId,
    code: row.code,
    label: row.label,
    category: row.category,
    active: normalizeActive(row.active),
  };
}

export function normalizeTagDefinitionList(
  value: unknown,
): TagDefinitionListView {
  if (!isRecord(value)) return { total: 0, items: [] };
  const body = value as RawTagDefinitionList;
  const items = Array.isArray(body.items)
    ? body.items.flatMap((item) => {
        const normalized = normalizeTagDefinitionItem(item);
        return normalized ? [normalized] : [];
      })
    : [];
  const total = typeof body.total === "number" && body.total >= 0 ? body.total : items.length;
  return { total, items };
}

export function filterTagDefinitions(
  items: readonly TagDefinitionItem[],
  query: string,
  includeInactive: boolean,
): TagDefinitionItem[] {
  const q = query.trim().toLowerCase();
  return items.filter((tag) => {
    if (!includeInactive && !tag.active) return false;
    if (!q) return true;
    return [tag.code, tag.label, tag.category].some((value) =>
      value.toLowerCase().includes(q),
    );
  });
}

export function countTagDefinitions(items: readonly TagDefinitionItem[]): {
  readonly active: number;
  readonly inactive: number;
  readonly total: number;
} {
  let active = 0;
  let inactive = 0;
  for (const item of items) {
    if (item.active) active += 1;
    else inactive += 1;
  }
  return { active, inactive, total: items.length };
}
