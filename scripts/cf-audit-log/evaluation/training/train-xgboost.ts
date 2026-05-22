#!/usr/bin/env tsx
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import { extractFeatures } from "../../features/extract.ts";
import type { RedactedFeatures } from "../../features/schema.ts";
import { featureValue } from "../../classifier/isolation-forest.ts";
import type {
  XGBoostArtifact,
  XGBoostBooster,
  XGBoostNode,
} from "../../classifier/xgboost.ts";
import { parseArgs } from "../../cli-args.ts";
import type { LabeledEvent } from "../model-comparison.ts";

const FEATURES = [
  "hour_of_day",
  "day_of_week",
  "action_category",
  "status_class",
  "user_agent_category",
  "ip_24_bucket_hash",
  "actor_role_hash",
  "token_id_present",
] as const;

const REDACT_SECRET = "cf-audit-default-secret-cf";

class Rng {
  private state: number;
  constructor(seed: number) {
    this.state = seed >>> 0 || 1;
  }
  next(): number {
    this.state = (Math.imul(this.state, 1664525) + 1013904223) >>> 0;
    return this.state / 0xffffffff;
  }
  pick<T>(arr: ReadonlyArray<T>): T {
    return arr[Math.floor(this.next() * arr.length)] as T;
  }
}

interface Sample {
  readonly features: RedactedFeatures;
  readonly label: number;
}

function residualLeaf(samples: ReadonlyArray<Sample>, predictions: number[]): number {
  if (samples.length === 0) return 0;
  let num = 0;
  let den = 0;
  for (let i = 0; i < samples.length; i++) {
    const p = sigmoid(predictions[i] ?? 0);
    num += (samples[i]?.label ?? 0) - p;
    den += p * (1 - p);
  }
  if (den < 1e-6) return 0;
  return Number((num / den).toFixed(4));
}

function buildBooster(
  samples: ReadonlyArray<Sample>,
  predictions: number[],
  rng: Rng,
  maxDepth: number,
): XGBoostBooster {
  const tree: XGBoostNode[] = [];

  function build(
    rows: ReadonlyArray<{ sample: Sample; pred: number }>,
    depth: number,
  ): number {
    const id = tree.length;
    if (rows.length <= 1 || depth >= maxDepth) {
      const leaf = residualLeaf(
        rows.map((r) => r.sample),
        rows.map((r) => r.pred),
      );
      tree.push({ nodeId: id, leaf });
      return id;
    }
    const feature = rng.pick(FEATURES);
    const values = rows.map((r) => featureValue(r.sample.features, feature));
    const min = Math.min(...values);
    const max = Math.max(...values);
    if (min === max) {
      const leaf = residualLeaf(
        rows.map((r) => r.sample),
        rows.map((r) => r.pred),
      );
      tree.push({ nodeId: id, leaf });
      return id;
    }
    const split = Number((min + (max - min) / 2).toFixed(4));
    tree.push({ nodeId: id, feature, split, yes: 0, no: 0, missing: 0 });
    const leftRows = rows.filter(
      (r) => featureValue(r.sample.features, feature) < split,
    );
    const rightRows = rows.filter(
      (r) => featureValue(r.sample.features, feature) >= split,
    );
    const yes = build(leftRows, depth + 1);
    const no = build(rightRows, depth + 1);
    tree[id] = { nodeId: id, feature, split, yes, no, missing: yes };
    return id;
  }

  build(
    samples.map((s, i) => ({ sample: s, pred: predictions[i] ?? 0 })),
    0,
  );
  return { tree };
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export function trainXGBoost(
  rows: ReadonlyArray<LabeledEvent>,
  params: {
    numRounds: number;
    maxDepth: number;
    learningRate: number;
    seed: number;
  },
  datasetHash: string,
): XGBoostArtifact {
  const rng = new Rng(params.seed);
  const samples: Sample[] = rows.map((r) => ({
    features: extractFeatures(r.event, { redactSecret: REDACT_SECRET }),
    label: r.expectedSeverity !== "NONE" ? 1 : 0,
  }));
  const baseScore = 0;
  const predictions = samples.map(() => baseScore);
  const boosters: XGBoostBooster[] = [];
  for (let r = 0; r < params.numRounds; r++) {
    const booster = buildBooster(samples, predictions, rng, params.maxDepth);
    boosters.push(booster);
    for (let i = 0; i < samples.length; i++) {
      // Simple residual update: walk the booster
      let node = booster.tree[0];
      let safety = 0;
      while (node && node.leaf === undefined && safety < booster.tree.length * 2) {
        const v = featureValue(samples[i]!.features, node.feature ?? "");
        const next = v < (node.split ?? 0) ? node.yes : node.no;
        if (next === undefined) break;
        node = booster.tree[next];
        safety++;
      }
      predictions[i] = (predictions[i] ?? 0) + params.learningRate * (node?.leaf ?? 0);
    }
  }
  return {
    $schema: "xgboost-v1",
    name: "xgboost",
    version: "1.0.0",
    trainedAt: new Date().toISOString(),
    datasetHash,
    params,
    baseScore,
    boosters,
    severityThresholds: { high: 0.7, medium: 0.55, low: 0.4 },
  };
}

if (process.argv[1]?.endsWith("train-xgboost.ts")) {
  const args = parseArgs(process.argv.slice(2));
  const input = typeof args.input === "string" ? args.input : null;
  const output = typeof args.output === "string" ? args.output : null;
  if (!input || !output) {
    process.stderr.write("--input <jsonl> --output <model.json> required\n");
    process.exit(1);
  }
  const raw = readFileSync(input, "utf8");
  const rows = raw
    .split(/\r?\n/)
    .filter(Boolean)
    .map((l) => JSON.parse(l) as LabeledEvent);
  const datasetHash = createHash("sha256").update(raw).digest("hex").slice(0, 16);
  const artifact = trainXGBoost(
    rows,
    {
      numRounds:
        typeof args["num-rounds"] === "string" ? Number(args["num-rounds"]) : 20,
      maxDepth:
        typeof args["max-depth"] === "string" ? Number(args["max-depth"]) : 4,
      learningRate: 0.3,
      seed: typeof args.seed === "string" ? Number(args.seed) : 42,
    },
    datasetHash,
  );
  writeFileSync(output, `${JSON.stringify(artifact, null, 2)}\n`);
}
