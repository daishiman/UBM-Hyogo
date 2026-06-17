import type { AdminAuditFilters } from "../../lib/admin/types";
import { describeAuditAction, describeAuditField, describeAuditTargetType } from "./auditGlossary";

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

  if (hasValue(filters.action)) chips.push({ key: "action", label: describeAuditField("action"), value: describeAuditAction(String(filters.action)) });
  if (hasValue(filters.actorEmail)) chips.push({ key: "actorEmail", label: describeAuditField("actorEmail"), value: String(filters.actorEmail) });
  if (hasValue(filters.targetType)) chips.push({ key: "targetType", label: describeAuditField("targetType"), value: describeAuditTargetType(String(filters.targetType)) });
  if (hasValue(filters.targetId)) chips.push({ key: "targetId", label: describeAuditField("targetId"), value: String(filters.targetId) });

  const from = formatDatePart(filters.from);
  const to = formatDatePart(filters.to);
  if (from && to) chips.push({ key: "period", label: "期間", value: `${from}〜${to}` });
  else if (from) chips.push({ key: "period", label: "期間", value: `${from} 以降` });
  else if (to) chips.push({ key: "period", label: "期間", value: `${to} まで` });

  if (hasValue(filters.batchId)) chips.push({ key: "batchId", label: describeAuditField("batchId"), value: String(filters.batchId) });
  if (hasValue(filters.limit)) chips.push({ key: "limit", label: describeAuditField("limit"), value: String(filters.limit) });
  else if (fallbackLimit.trim()) chips.push({ key: "limit", label: describeAuditField("limit"), value: fallbackLimit.trim() });

  return chips;
}
