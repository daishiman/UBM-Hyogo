export type ActionCategory =
  | "auth"
  | "tokens"
  | "dns"
  | "workers"
  | "d1"
  | "kv"
  | "r2"
  | "other";

export type StatusClass = "2xx" | "3xx" | "4xx" | "5xx" | "unknown";

export type UserAgentCategory =
  | "cli-wrangler"
  | "gh-actions"
  | "browser"
  | "unknown";

export interface RedactedFeatures {
  readonly ipBucket: string;
  readonly hourOfDay: number;
  readonly dayOfWeek: number;
  readonly actionCategory: ActionCategory;
  readonly statusClass: StatusClass;
  readonly actorRoleHash: string;
  readonly userAgentCategory: UserAgentCategory;
  readonly tokenIdPresent: boolean;
}

export const REDACTED_FEATURES_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "ipBucket",
    "hourOfDay",
    "dayOfWeek",
    "actionCategory",
    "statusClass",
    "actorRoleHash",
    "userAgentCategory",
    "tokenIdPresent",
  ],
  properties: {
    ipBucket: { type: "string" },
    hourOfDay: { type: "integer", minimum: 0, maximum: 23 },
    dayOfWeek: { type: "integer", minimum: 0, maximum: 6 },
    actionCategory: {
      enum: ["auth", "tokens", "dns", "workers", "d1", "kv", "r2", "other"],
    },
    statusClass: { enum: ["2xx", "3xx", "4xx", "5xx", "unknown"] },
    actorRoleHash: { type: "string", pattern: "^[0-9a-f]{16}$" },
    userAgentCategory: {
      enum: ["cli-wrangler", "gh-actions", "browser", "unknown"],
    },
    tokenIdPresent: { type: "boolean" },
  },
} as const;

