import type { ConsentStatus } from "../types/common";

const POSITIVE_TOKENS = new Set([
  "yes",
  "y",
  "true",
  "consented",
  "agree",
  "agreed",
  "ok",
  "同意します",
  "同意する",
  "はい",
  "公開してよい",
]);

const NEGATIVE_TOKENS = new Set([
  "no",
  "n",
  "false",
  "declined",
  "disagree",
  "disagreed",
  "ng",
  "同意しません",
  "同意しない",
  "いいえ",
  "公開しない",
]);

export type ConsentInputValue = unknown;

export const PUBLIC_CONSENT_KEY = "publicConsent" as const;
export const RULES_CONSENT_KEY = "rulesConsent" as const;

const PUBLIC_CONSENT_LEGACY_KEYS = [
  "publicConsent",
  "public_consent",
  "publishConsent",
  "shareInfo",
  "consent_publish",
] as const;

const RULES_CONSENT_LEGACY_KEYS = [
  "rulesConsent",
  "rules_consent",
  "ruleConsent",
  "rule_consent",
  "agreeRules",
  "consent_rules",
] as const;

function normalizeOne(value: ConsentInputValue): ConsentStatus {
  if (value === undefined || value === null) return "unknown";
  if (typeof value === "boolean") return value ? "consented" : "declined";
  if (typeof value === "number") {
    if (value === 1) return "consented";
    if (value === 0) return "declined";
    return "unknown";
  }
  if (typeof value === "string") {
    const trimmed = value.trim().toLowerCase();
    if (trimmed === "") return "unknown";
    if (POSITIVE_TOKENS.has(trimmed)) return "consented";
    if (NEGATIVE_TOKENS.has(trimmed)) return "declined";
    return "unknown";
  }
  return "unknown";
}

export interface NormalizedConsents {
  publicConsent: ConsentStatus;
  rulesConsent: ConsentStatus;
}

export function normalizeConsent(
  raw: Record<string, unknown> | undefined | null,
): NormalizedConsents {
  if (!raw) {
    return { publicConsent: "unknown", rulesConsent: "unknown" };
  }
  const publicRaw = pickFirstDefined(raw, PUBLIC_CONSENT_LEGACY_KEYS);
  const rulesRaw = pickFirstDefined(raw, RULES_CONSENT_LEGACY_KEYS);
  return {
    publicConsent: normalizeOne(publicRaw),
    rulesConsent: normalizeOne(rulesRaw),
  };
}

function pickFirstDefined(
  raw: Record<string, unknown>,
  keys: readonly string[],
): unknown {
  for (const key of keys) {
    if (key in raw) return raw[key];
  }
  return undefined;
}

export const LEGACY_CONSENT_KEYS = [
  ...PUBLIC_CONSENT_LEGACY_KEYS.filter((k) => k !== PUBLIC_CONSENT_KEY),
  ...RULES_CONSENT_LEGACY_KEYS.filter((k) => k !== RULES_CONSENT_KEY),
] as const;
