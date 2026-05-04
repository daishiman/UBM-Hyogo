import type { ConsentStatus } from "../types/common";
import { STABLE_KEY } from "../zod/field";

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

const PUBLIC_HINT_TOKENS = ["掲載", "公開", "public", "publish", "share"];
const RULES_HINT_TOKENS = ["規約", "ルール", "rules", "rule"];

export type ConsentInputValue = unknown;

export const PUBLIC_CONSENT_KEY = STABLE_KEY.publicConsent;
export const RULES_CONSENT_KEY = STABLE_KEY.rulesConsent;

const PUBLIC_CONSENT_LEGACY_KEYS = [
  STABLE_KEY.publicConsent,
  "public_consent",
  "publishConsent",
  "shareInfo",
  "consent_publish",
] as const;

const RULES_CONSENT_LEGACY_KEYS = [
  STABLE_KEY.rulesConsent,
  "rules_consent",
  "ruleConsent",
  "rule_consent",
  "agreeRules",
  "consent_rules",
] as const;

function normalizeOne(value: ConsentInputValue): ConsentStatus {
  const extracted = extractConsentScalar(value);
  if (extracted !== value) return normalizeOne(extracted);
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
    if (containsAny(trimmed, ["同意する", "同意します", "掲載ok", "公開ok"])) {
      return "consented";
    }
    if (containsAny(trimmed, ["同意しない", "同意しません", "掲載ng", "公開ng"])) {
      return "declined";
    }
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
  const inferred = inferConsentFromRawAnswers(raw);
  return {
    publicConsent: normalizeOne(publicRaw ?? inferred.publicConsent),
    rulesConsent: normalizeOne(rulesRaw ?? inferred.rulesConsent),
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

function inferConsentFromRawAnswers(raw: Record<string, unknown>): {
  publicConsent: unknown;
  rulesConsent: unknown;
} {
  let publicConsent: unknown;
  let rulesConsent: unknown;

  const consentKeys = new Set<string>([
    ...PUBLIC_CONSENT_LEGACY_KEYS,
    ...RULES_CONSENT_LEGACY_KEYS,
  ]);
  for (const [key, value] of Object.entries(raw)) {
    if (consentKeys.has(key)) continue;
    const text = extractConsentScalar(value);
    if (typeof text !== "string") continue;
    const normalized = text.trim().toLowerCase();
    if (!publicConsent && containsAny(normalized, PUBLIC_HINT_TOKENS)) {
      publicConsent = text;
      continue;
    }
    if (!rulesConsent && containsAny(normalized, RULES_HINT_TOKENS)) {
      rulesConsent = text;
      continue;
    }
    if (!rulesConsent && normalizeOne(text) !== "unknown") {
      rulesConsent = text;
    }
  }

  return { publicConsent, rulesConsent };
}

function extractConsentScalar(value: ConsentInputValue): ConsentInputValue {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return value[0];

  const obj = value as Record<string, unknown>;
  const textAnswers = obj["textAnswers"];
  if (!textAnswers || typeof textAnswers !== "object") return value;
  const answers = (textAnswers as Record<string, unknown>)["answers"];
  if (!Array.isArray(answers)) return value;
  const first = answers[0];
  if (!first || typeof first !== "object") return value;
  return (first as Record<string, unknown>)["value"];
}

function containsAny(value: string, needles: readonly string[]): boolean {
  return needles.some((needle) => value.includes(needle));
}

export const LEGACY_CONSENT_KEYS = [
  ...PUBLIC_CONSENT_LEGACY_KEYS.filter((k) => k !== PUBLIC_CONSENT_KEY),
  ...RULES_CONSENT_LEGACY_KEYS.filter((k) => k !== RULES_CONSENT_KEY),
] as const;
