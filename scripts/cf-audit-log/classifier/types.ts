import type { AuditLogEvent, Baseline, Severity } from "../types.ts";
import type { ClassifierContext } from "../severity-classifier.ts";

export type ClassifierName = "threshold" | "ml";

export interface SeverityResult {
  severity: Severity;
  confidence: number;
  classifierUsed: ClassifierName;
  classifierVersion: string;
  reason: string;
}

export interface ClassifierInput {
  event: AuditLogEvent;
  baseline: Baseline | null;
  context: ClassifierContext;
}

export interface Classifier {
  readonly name: ClassifierName;
  readonly version: string;
  classify(input: ClassifierInput): SeverityResult | null;
}

