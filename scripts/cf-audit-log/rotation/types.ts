// Issue #587 — CF audit ML model artifact rotation
// Types for candidate evaluation / canary / promotion / rollback evidence.
// op references only; no resolved artifact path values may be assigned to these.

export type ArtifactOpRef = string; // form: "op://<vault>/<item>/<field>"

export interface ArtifactPathRefs {
  prod: ArtifactOpRef;
  candidate: ArtifactOpRef;
  previous?: ArtifactOpRef;
}

export interface CanaryMetrics {
  precisionProxy: number;
  recallProxy: number;
  fallbackRate: number;
  p95LatencyMs: number;
  leakageHits: number;
}

export type CanaryVerdict =
  | "candidate_pass"
  | "candidate_fail_metrics"
  | "candidate_fail_leakage"
  | "candidate_fail_load";

export interface CanaryOutput {
  canaryRunId: string;
  candidatePathRef: ArtifactOpRef;
  baselinePathRef: ArtifactOpRef;
  candidateClassifierVersion: string;
  baselineClassifierVersion: string;
  replayWindowHours: number;
  totalEventsReplayed: number;
  candidate: CanaryMetrics;
  baseline: CanaryMetrics;
  verdict: CanaryVerdict;
}

export interface RotationGate {
  R1_replayPass: boolean;
  R2_latencyAndFallbackPass: boolean;
  R3_runbookApprovalPath: string;
  R3_previousArtifactRefRecorded: boolean;
  R3_rollbackOwnerRecorded: boolean;
  R3_rollbackApprovalReady: boolean;
}

export type RotationDecision =
  | "promotion_pr_pending"
  | "promotion_merged"
  | "rollback_pr_pending"
  | "rollback_merged"
  | "candidate_discarded";

export type RotationPhase = "canary" | "promotion" | "rollback";

export interface RotationEvidence {
  rotationId: string;
  phase: RotationPhase;
  canary: CanaryOutput;
  gate: RotationGate;
  decision: RotationDecision;
  rollbackInstruction: string;
  rawDatasetIncluded: false;
}
