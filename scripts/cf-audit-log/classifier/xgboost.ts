import { readFileSync } from "node:fs";
import { extractFeatures } from "../features/extract.ts";
import type { RedactedFeatures } from "../features/schema.ts";
import { featureValue } from "./isolation-forest.ts";
import { ThresholdClassifier } from "./threshold.ts";
import type { Classifier, ClassifierInput, SeverityResult } from "./types.ts";

export interface XGBoostNode {
  readonly nodeId: number;
  readonly feature?: string;
  readonly split?: number;
  readonly yes?: number;
  readonly no?: number;
  readonly missing?: number;
  readonly leaf?: number;
}

export interface XGBoostBooster {
  readonly tree: ReadonlyArray<XGBoostNode>;
}

export interface XGBoostArtifact {
  readonly $schema: "xgboost-v1";
  readonly name: "xgboost";
  readonly version: string;
  readonly trainedAt: string;
  readonly datasetHash: string;
  readonly params: {
    numRounds: number;
    maxDepth: number;
    learningRate: number;
    seed: number;
  };
  readonly baseScore: number;
  readonly boosters: ReadonlyArray<XGBoostBooster>;
  readonly severityThresholds: { high: number; medium: number; low: number };
}

const DEFAULT_REDACT_SECRET = "cf-audit-default-secret-cf";

function isArtifact(v: unknown): v is XGBoostArtifact {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    o["$schema"] === "xgboost-v1" &&
    Array.isArray(o["boosters"]) &&
    typeof o["baseScore"] === "number"
  );
}

export function loadXGBoostArtifact(modelPath: string): XGBoostArtifact | null {
  try {
    const raw = JSON.parse(readFileSync(modelPath, "utf8")) as unknown;
    if (!isArtifact(raw)) return null;
    return raw;
  } catch {
    return null;
  }
}

function findNode(
  tree: ReadonlyArray<XGBoostNode>,
  id: number,
): XGBoostNode | undefined {
  for (const n of tree) if (n.nodeId === id) return n;
  return undefined;
}

export function evalBooster(
  booster: XGBoostBooster,
  features: RedactedFeatures,
): number {
  let cur = findNode(booster.tree, 0);
  let safety = 0;
  while (cur && cur.leaf === undefined && safety < booster.tree.length * 2) {
    const v = featureValue(features, cur.feature ?? "");
    const next = v < (cur.split ?? 0) ? cur.yes : cur.no;
    if (next === undefined) break;
    cur = findNode(booster.tree, next);
    safety++;
  }
  return cur?.leaf ?? 0;
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export function predict(
  artifact: XGBoostArtifact,
  features: RedactedFeatures,
): number {
  let sum = artifact.baseScore;
  for (const b of artifact.boosters) {
    sum += artifact.params.learningRate * evalBooster(b, features);
  }
  return sigmoid(sum);
}

export class XGBoostClassifier implements Classifier {
  readonly name = "xgboost" as const;
  readonly version: string;
  private readonly artifact: XGBoostArtifact | null;
  private readonly fallback = new ThresholdClassifier();
  private readonly redactSecret: string;

  constructor(modelPath: string | null, opts: { redactSecret?: string } = {}) {
    this.redactSecret = opts.redactSecret ?? DEFAULT_REDACT_SECRET;
    this.artifact = modelPath ? loadXGBoostArtifact(modelPath) : null;
    this.version = this.artifact
      ? `xgboost@${this.artifact.version}`
      : "xgboost@fallback";
  }

  get fallbackActive(): boolean {
    return this.artifact === null;
  }

  classify(input: ClassifierInput): SeverityResult | null {
    if (!this.artifact) {
      const fb = this.fallback.classify(input);
      if (!fb) return null;
      return {
        ...fb,
        classifierUsed: "xgboost",
        classifierVersion: this.version,
        reason: `${fb.reason}; xgboost-fallback-to-threshold`,
      };
    }
    let features: RedactedFeatures;
    try {
      features = extractFeatures(input.event, { redactSecret: this.redactSecret });
    } catch {
      return null;
    }
    const score = predict(this.artifact, features);
    const t = this.artifact.severityThresholds;
    let severity: SeverityResult["severity"] | null = null;
    if (score >= t.high) severity = "HIGH";
    else if (score >= t.medium) severity = "MEDIUM";
    else if (score >= t.low) severity = "LOW";
    if (!severity) return null;
    return {
      severity,
      confidence: Number(score.toFixed(4)),
      classifierUsed: "xgboost",
      classifierVersion: this.version,
      reason: `xgboost score ${score.toFixed(3)}`,
    };
  }
}
