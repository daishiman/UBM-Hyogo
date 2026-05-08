import type { RedactedFeatures } from "./features/schema.ts";

export type Severity = "HIGH" | "MEDIUM" | "LOW";

export interface AuditLogEvent {
  id: string;
  when: string;
  actor: { email?: string; ip?: string; user_agent?: string };
  action: { type: string; result: "success" | "failure"; result_code?: number };
  resource?: { type?: string; id?: string };
}

export interface Baseline {
  successPerHourP95: number;
  failurePerHourP95: number;
  offHoursRatio: number;
  computedAt: string;
  windowDays: number;
}

export interface Finding {
  severity: Severity;
  reason: string;
  confidence?: number;
  classifierUsed?: string;
  classifierVersion?: string;
  event: AuditLogEvent;
  dedupeKey: string;
  titlePrefix: string;
  labels: string[];
}

// ---------------------------------------------------------------------------
// Issue #547: Cloudflare Audit Logs redacted feature dataset export
// ---------------------------------------------------------------------------

export type FeatureExportWindow = {
  fromUtc: Date;
  toUtc: Date;
};

export type FeatureExportLine = {
  id: string;
  occurredAt: string;
  features: RedactedFeatures;
  label?: Severity | "NONE";
};

export type FeatureExportManifest = {
  exportRunId: string;
  source: "cf_audit_log";
  windowFromUtc: string;
  windowToUtc: string;
  rowCount: number;
  sha256: string;
  redactionPolicyVersion: "feature-v1";
  schemaVersion: "redacted-features-v1";
  generatedAt: string;
};

// ---------------------------------------------------------------------------
// Issue #514: Cloudflare Audit Logs cold storage / R2 export
// Phase 2-3 で確定した型定義
// ---------------------------------------------------------------------------

export type ExportWindow = {
  fromUtc: Date; // inclusive
  toUtc: Date; // exclusive
};

export type R2ObjectKey = {
  policyVersion: "v1";
  yyyy: number;
  mm: number;
  dd: number;
  toString(): string;
};

export type ExportManifestStatus = "pending" | "completed" | "failed";

export type ExportManifestRow = {
  id: string;
  exportRunId: string;
  yyyy: number;
  mm: number;
  dd: number;
  objectKey: string;
  rowCount: number;
  uncompressedBytes: number;
  compressedBytes: number;
  sha256: string;
  r2Etag: string | null;
  redactionPolicyVersion: "v1";
  status: ExportManifestStatus;
  startedAt: string;
  completedAt: string | null;
  errorMessage: string | null;
};

export type RedactionViolationPattern =
  | "api-token"
  | "ipv4-full"
  | "ipv6-full"
  | "user-agent-plain"
  | "email-plain";

export type RedactionViolation = {
  pattern: RedactionViolationPattern;
  sample: string; // 先頭 32 文字 + "...redacted"
};

export class RedactionViolationError extends Error {
  constructor(public readonly violations: RedactionViolation[]) {
    super(`redaction violation: ${violations.length} pattern(s) hit`);
    this.name = "RedactionViolationError";
  }
}
