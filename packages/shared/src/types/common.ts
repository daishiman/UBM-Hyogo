export type ConsentStatus = "consented" | "declined" | "unknown";

export type FieldVisibility = "public" | "member" | "admin";

export type PublishState = "public" | "member_only" | "hidden";

export type SchemaState = "active" | "superseded" | "pending_review";

export type FieldStatus = "active" | "inactive" | "pending";

export type FieldSource = "forms" | "admin" | "derived";

export type TagSource = "rule" | "ai" | "manual";

const KNOWN_TAG_SOURCES: readonly TagSource[] = ["rule", "ai", "manual"];

export function normalizeTagSource(raw: string | null | undefined): TagSource {
  if (KNOWN_TAG_SOURCES.includes(raw as TagSource)) return raw as TagSource;
  return "manual";
}

export type AuthGateStateValue =
  | "input"
  | "sent"
  | "unregistered"
  | "rules_declined"
  | "deleted";

export type FieldKind =
  | "shortText"
  | "paragraph"
  | "date"
  | "radio"
  | "checkbox"
  | "dropdown"
  | "url"
  | "consent"
  | "system"
  | "unknown";

export type AnswerValue =
  | string
  | string[]
  | number
  | boolean
  | { year: number; month: number; day: number }
  | null;
