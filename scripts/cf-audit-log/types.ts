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
