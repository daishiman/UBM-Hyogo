import type { AdminAuditListItem } from "../../lib/admin/types";

const JST_FORMATTER = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const PII_KEY_PATTERN =
  /(^|_|\b)(email|mail|phone|tel|mobile|address|addr|name|fullname|firstname|lastname|displayname|kana|postal|zip)(_|$|\b)/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[\d\s().-]{8,}$/;

const isPiiKey = (key: string): boolean => {
  const normalized = key.toLowerCase().replace(/[-_\s]/g, "");
  return PII_KEY_PATTERN.test(key) || normalized.includes("name");
};

const maskString = (value: string): string => {
  if (EMAIL_PATTERN.test(value)) return "[masked-email]";
  if (PHONE_PATTERN.test(value)) return "[masked-phone]";
  return "[masked]";
};

export function maskAuditJson(value: unknown, key = ""): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") {
    if (isPiiKey(key) || EMAIL_PATTERN.test(value) || PHONE_PATTERN.test(value)) {
      return maskString(value);
    }
    return value;
  }
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((v) => maskAuditJson(v, key));
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([k, v]) => [
      k,
      isPiiKey(k) ? maskAuditJson(String(v), k) : maskAuditJson(v, k),
    ]),
  );
}

export function summarizeAuditJson(value: unknown): string {
  if (value === null || value === undefined) return "なし";
  if (Array.isArray(value)) return `${value.length} items`;
  if (typeof value === "object") {
    const keys = Object.keys(value as Record<string, unknown>);
    if (keys.length === 0) return "empty object";
    return keys.slice(0, 4).join(", ") + (keys.length > 4 ? ` +${keys.length - 4}` : "");
  }
  return typeof value;
}

export function formatJst(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${JST_FORMATTER.format(date)} JST`;
}

export function maskAuditText(value: string | null | undefined, key: string): string {
  if (!value) return "system";
  const masked = maskAuditJson(value, key);
  return typeof masked === "string" ? masked : "[masked]";
}

export function extractBatchId(item: AdminAuditListItem): string | null {
  const sources = [item.maskedAfter, item.afterJson, item.maskedBefore, item.beforeJson];
  for (const source of sources) {
    if (source && typeof source === "object" && !Array.isArray(source)) {
      const value = (source as Record<string, unknown>).batchId;
      if (typeof value === "string" && value.length > 0) return value;
    }
  }
  return null;
}
