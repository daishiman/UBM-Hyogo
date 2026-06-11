import type { AdminAuditFilters } from "../../lib/admin/types";

export interface AppliedFilterChip {
  readonly key: string;
  readonly label: string;
  readonly value: string;
}

const formatDatePart = (value: unknown): string | null => {
  if (value === undefined || value === null || value === "") return null;
  const text = String(value);
  const date = new Date(text);
  if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  return text.slice(0, 10);
};

const hasValue = (value: unknown): value is string | number => {
  if (value === undefined || value === null) return false;
  return String(value).trim().length > 0;
};

export function toAppliedFilterChips(
  filters: AdminAuditFilters | undefined,
  fallbackLimit: string,
): AppliedFilterChip[] {
  const chips: AppliedFilterChip[] = [];
  if (!filters) return chips;

  if (hasValue(filters.action)) chips.push({ key: "action", label: "action", value: String(filters.action) });
  if (hasValue(filters.actorEmail)) chips.push({ key: "actorEmail", label: "actor", value: String(filters.actorEmail) });
  if (hasValue(filters.targetType)) chips.push({ key: "targetType", label: "target type", value: String(filters.targetType) });
  if (hasValue(filters.targetId)) chips.push({ key: "targetId", label: "target id", value: String(filters.targetId) });

  const from = formatDatePart(filters.from);
  const to = formatDatePart(filters.to);
  if (from && to) chips.push({ key: "period", label: "期間", value: `${from}〜${to}` });
  else if (from) chips.push({ key: "period", label: "期間", value: `${from} 以降` });
  else if (to) chips.push({ key: "period", label: "期間", value: `${to} まで` });

  if (hasValue(filters.batchId)) chips.push({ key: "batchId", label: "batchId", value: String(filters.batchId) });
  if (hasValue(filters.limit)) chips.push({ key: "limit", label: "limit", value: String(filters.limit) });
  else if (fallbackLimit.trim()) chips.push({ key: "limit", label: "limit", value: fallbackLimit.trim() });

  return chips;
}
