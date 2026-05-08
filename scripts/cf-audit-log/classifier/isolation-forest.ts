import { readFileSync } from "node:fs";
import { extractFeatures } from "../features/extract.ts";
import type { RedactedFeatures } from "../features/schema.ts";
import { ThresholdClassifier } from "./threshold.ts";
import type { Classifier, ClassifierInput, SeverityResult } from "./types.ts";

export interface IsolationForestNode {
  readonly feature?: string;
  readonly threshold?: number;
  readonly left?: number;
  readonly right?: number;
  readonly leaf?: boolean;
  readonly depth?: number;
}

export interface IsolationForestTree {
  readonly nodes: ReadonlyArray<IsolationForestNode>;
}

export interface IsolationForestArtifact {
  readonly $schema: "isolation-forest-v1";
  readonly name: "isolation-forest";
  readonly version: string;
  readonly trainedAt: string;
  readonly datasetHash: string;
  readonly params: { numTrees: number; subSampleSize: number; seed: number };
  readonly trees: ReadonlyArray<IsolationForestTree>;
  readonly severityThresholds: { high: number; medium: number; low: number };
}

const DEFAULT_REDACT_SECRET = "cf-audit-default-secret-cf";

function isArtifact(v: unknown): v is IsolationForestArtifact {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    o["$schema"] === "isolation-forest-v1" &&
    Array.isArray(o["trees"]) &&
    typeof o["severityThresholds"] === "object"
  );
}

export function loadIsolationForestArtifact(
  modelPath: string,
): IsolationForestArtifact | null {
  try {
    const raw = JSON.parse(readFileSync(modelPath, "utf8")) as unknown;
    if (!isArtifact(raw)) return null;
    return raw;
  } catch {
    return null;
  }
}

export function featureValue(features: RedactedFeatures, key: string): number {
  switch (key) {
    case "hour_of_day":
      return features.hourOfDay;
    case "day_of_week":
      return features.dayOfWeek;
    case "token_id_present":
      return features.tokenIdPresent ? 1 : 0;
    case "ip_24_bucket_hash":
      return hashToUnit(features.ipBucket);
    case "actor_role_hash":
      return hashToUnit(features.actorRoleHash);
    case "action_category":
      return categoryIndex(features.actionCategory);
    case "status_class":
      return statusIndex(features.statusClass);
    case "user_agent_category":
      return uaIndex(features.userAgentCategory);
    default:
      return 0;
  }
}

function hashToUnit(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h = (h ^ s.charCodeAt(i)) >>> 0;
    h = Math.imul(h, 16777619) >>> 0;
  }
  return (h % 1000) / 1000;
}

function categoryIndex(c: string): number {
  const order = ["auth", "tokens", "dns", "workers", "d1", "kv", "r2", "other"];
  const i = order.indexOf(c);
  return i < 0 ? 0 : i;
}

function statusIndex(c: string): number {
  return ["2xx", "3xx", "4xx", "5xx", "unknown"].indexOf(c);
}

function uaIndex(c: string): number {
  return ["cli-wrangler", "gh-actions", "browser", "unknown"].indexOf(c);
}

export function pathLength(
  tree: IsolationForestTree,
  features: RedactedFeatures,
): number {
  let idx = 0;
  let depth = 0;
  const max = tree.nodes.length * 2;
  for (let step = 0; step < max; step++) {
    const node = tree.nodes[idx];
    if (!node || node.leaf) return node?.depth ?? depth;
    const v = featureValue(features, node.feature ?? "");
    const next = v < (node.threshold ?? 0) ? node.left : node.right;
    if (next === undefined) return depth;
    idx = next;
    depth++;
  }
  return depth;
}

export function anomalyScore(
  artifact: IsolationForestArtifact,
  features: RedactedFeatures,
): number {
  if (artifact.trees.length === 0) return 0;
  let sum = 0;
  for (const tree of artifact.trees) {
    sum += pathLength(tree, features);
  }
  const avg = sum / artifact.trees.length;
  const c = cFactor(artifact.params.subSampleSize);
  if (c === 0) return 0;
  const score = Math.pow(2, -avg / c);
  return Math.max(0, Math.min(1, score));
}

function cFactor(n: number): number {
  if (n <= 1) return 0;
  return 2 * (Math.log(n - 1) + 0.5772156649) - (2 * (n - 1)) / n;
}

export class IsolationForestClassifier implements Classifier {
  readonly name = "isolation-forest" as const;
  readonly version: string;
  private readonly artifact: IsolationForestArtifact | null;
  private readonly fallback = new ThresholdClassifier();
  private readonly redactSecret: string;

  constructor(modelPath: string | null, opts: { redactSecret?: string } = {}) {
    this.redactSecret = opts.redactSecret ?? DEFAULT_REDACT_SECRET;
    this.artifact = modelPath ? loadIsolationForestArtifact(modelPath) : null;
    this.version = this.artifact
      ? `isolation-forest@${this.artifact.version}`
      : "isolation-forest@fallback";
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
        classifierUsed: "isolation-forest",
        classifierVersion: this.version,
        reason: `${fb.reason}; isolation-forest-fallback-to-threshold`,
      };
    }
    let features: RedactedFeatures;
    try {
      features = extractFeatures(input.event, { redactSecret: this.redactSecret });
    } catch {
      return null;
    }
    const score = anomalyScore(this.artifact, features);
    const t = this.artifact.severityThresholds;
    let severity: SeverityResult["severity"] | null = null;
    if (score >= t.high) severity = "HIGH";
    else if (score >= t.medium) severity = "MEDIUM";
    else if (score >= t.low) severity = "LOW";
    if (!severity) return null;
    return {
      severity,
      confidence: Number(score.toFixed(4)),
      classifierUsed: "isolation-forest",
      classifierVersion: this.version,
      reason: `isolation-forest score ${score.toFixed(3)}`,
    };
  }
}
