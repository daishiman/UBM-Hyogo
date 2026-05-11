#!/usr/bin/env tsx
// Issue #587 — rotation evidence collector
// Reads canary-out.json, evaluates Gate R1/R2/R3, writes rotation-evidence.json.

import { readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import type {
  CanaryOutput,
  RotationDecision,
  RotationEvidence,
  RotationGate,
  RotationPhase,
} from "./types.ts";

const RUNBOOK_PATH = "docs/30-workflows/runbooks/ml-model-artifact-rotation.md";
const ROLLBACK_INSTRUCTION =
  "Restore op://Employee/ubm-hyogo-env/CF_AUDIT_ML_MODEL_PATH_PROD to the previous artifact reference via a 1-line PR. Do not delete D1 column classifier_version.";

export interface CollectorOptions {
  canaryOut: string;
  baselineOut?: string;
  result: string;
  rotationId?: string;
  phase?: RotationPhase;
  previousArtifactRefRecorded?: boolean;
  rollbackOwnerRecorded?: boolean;
}

export function evaluateGates(
  canary: CanaryOutput,
  opts: Pick<CollectorOptions, "previousArtifactRefRecorded" | "rollbackOwnerRecorded"> = {},
): RotationGate {
  const c = canary.candidate;
  const b = canary.baseline;
  const previousArtifactRefRecorded = opts.previousArtifactRefRecorded === true;
  const rollbackOwnerRecorded = opts.rollbackOwnerRecorded === true;
  return {
    R1_replayPass:
      c.precisionProxy >= b.precisionProxy && c.recallProxy >= b.recallProxy,
    R2_latencyAndFallbackPass:
      c.fallbackRate < 0.05 && c.p95LatencyMs <= b.p95LatencyMs * 1.5,
    R3_runbookApprovalPath: RUNBOOK_PATH,
    R3_previousArtifactRefRecorded: previousArtifactRefRecorded,
    R3_rollbackOwnerRecorded: rollbackOwnerRecorded,
    R3_rollbackApprovalReady:
      previousArtifactRefRecorded && rollbackOwnerRecorded,
  };
}

export function decideRotation(
  canary: CanaryOutput,
  gate: RotationGate,
  phase: RotationPhase,
): RotationDecision {
  if (phase === "rollback") return "rollback_pr_pending";
  if (phase === "promotion") return "promotion_merged";
  if (canary.candidate.leakageHits > 0) return "candidate_discarded";
  if (canary.verdict !== "candidate_pass") return "candidate_discarded";
  if (
    !gate.R1_replayPass ||
    !gate.R2_latencyAndFallbackPass ||
    !gate.R3_rollbackApprovalReady
  )
    return "candidate_discarded";
  return "promotion_pr_pending";
}

function defaultRotationId(): string {
  const iso = new Date().toISOString().replace(/[:.]/g, "-");
  return `rot-${iso}`;
}

export async function collectRotationEvidence(
  opts: CollectorOptions,
): Promise<RotationEvidence> {
  const canary = JSON.parse(readFileSync(opts.canaryOut, "utf8")) as CanaryOutput;
  const phase: RotationPhase = opts.phase ?? "canary";
  const gate = evaluateGates(canary, opts);
  const decision = decideRotation(canary, gate, phase);
  const evidence: RotationEvidence = {
    rotationId: opts.rotationId ?? defaultRotationId(),
    phase,
    canary,
    gate,
    decision,
    rollbackInstruction: ROLLBACK_INSTRUCTION,
    rawDatasetIncluded: false,
  };
  writeFileSync(opts.result, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  return evidence;
}

function parseArgs(argv: string[]): CollectorOptions {
  let canaryOut = "";
  let baselineOut: string | undefined;
  let result = "";
  let rotationId: string | undefined;
  let phase: RotationPhase | undefined;
  let previousArtifactRefRecorded = false;
  let rollbackOwnerRecorded = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = argv[i + 1];
    if (a === "--canary-out" && next) {
      canaryOut = next;
      i++;
    } else if (a === "--baseline-out" && next) {
      baselineOut = next;
      i++;
    } else if (a === "--result" && next) {
      result = next;
      i++;
    } else if (a === "--rotation-id" && next) {
      rotationId = next;
      i++;
    } else if (a === "--phase" && next) {
      if (next !== "canary" && next !== "promotion" && next !== "rollback") {
        throw new Error(`invalid --phase: ${next}`);
      }
      phase = next;
      i++;
    } else if (a === "--previous-artifact-ref-recorded") {
      previousArtifactRefRecorded = true;
    } else if (a === "--rollback-owner-recorded") {
      rollbackOwnerRecorded = true;
    }
  }
  if (!canaryOut) throw new Error("--canary-out is required");
  if (!result) throw new Error("--result is required");
  return {
    canaryOut,
    baselineOut,
    result,
    rotationId,
    phase,
    previousArtifactRefRecorded,
    rollbackOwnerRecorded,
  };
}

if (process.argv[1]?.endsWith("rotation-evidence-collector.ts")) {
  try {
    const opts = parseArgs(process.argv.slice(2));
    await collectRotationEvidence(opts);
    process.exit(0);
  } catch (err) {
    process.stderr.write(
      `${JSON.stringify({ ok: false, error: (err as Error).message })}\n`,
    );
    process.exit(1);
  }
}
