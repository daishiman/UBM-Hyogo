#!/usr/bin/env tsx
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import { extractFeatures } from "../../features/extract.ts";
import type { RedactedFeatures } from "../../features/schema.ts";
import { featureValue } from "../../classifier/isolation-forest.ts";
import type {
  IsolationForestArtifact,
  IsolationForestNode,
  IsolationForestTree,
} from "../../classifier/isolation-forest.ts";
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

function buildTree(
  samples: ReadonlyArray<RedactedFeatures>,
  rng: Rng,
  maxDepth: number,
): IsolationForestTree {
  const nodes: IsolationForestNode[] = [];

  function build(rows: ReadonlyArray<RedactedFeatures>, depth: number): number {
    if (rows.length <= 1 || depth >= maxDepth) {
      nodes.push({ leaf: true, depth });
      return nodes.length - 1;
    }
    const feature = rng.pick(FEATURES);
    const values = rows.map((r) => featureValue(r, feature));
    const min = Math.min(...values);
    const max = Math.max(...values);
    if (min === max) {
      nodes.push({ leaf: true, depth });
      return nodes.length - 1;
    }
    const threshold = min + rng.next() * (max - min);
    const idx = nodes.length;
    nodes.push({ feature, threshold: Number(threshold.toFixed(4)), left: 0, right: 0 });
    const leftRows = rows.filter((r) => featureValue(r, feature) < threshold);
    const rightRows = rows.filter((r) => featureValue(r, feature) >= threshold);
    const left = build(leftRows, depth + 1);
    const right = build(rightRows, depth + 1);
    nodes[idx] = { feature, threshold: Number(threshold.toFixed(4)), left, right };
    return idx;
  }

  build(samples, 0);
  return { nodes };
}

export function trainIsolationForest(
  rows: ReadonlyArray<LabeledEvent>,
  params: { numTrees: number; subSampleSize: number; seed: number },
  datasetHash: string,
): IsolationForestArtifact {
  const rng = new Rng(params.seed);
  const features = rows.map((r) =>
    extractFeatures(r.event, { redactSecret: REDACT_SECRET }),
  );
  const trees: IsolationForestTree[] = [];
  const maxDepth = Math.ceil(Math.log2(Math.max(2, params.subSampleSize)));
  for (let t = 0; t < params.numTrees; t++) {
    const sample: RedactedFeatures[] = [];
    for (let i = 0; i < Math.min(params.subSampleSize, features.length); i++) {
      sample.push(rng.pick(features));
    }
    trees.push(buildTree(sample, rng, maxDepth));
  }
  return {
    $schema: "isolation-forest-v1",
    name: "isolation-forest",
    version: "1.0.0",
    trainedAt: new Date().toISOString(),
    datasetHash,
    params,
    trees,
    severityThresholds: { high: 0.6, medium: 0.5, low: 0.4 },
  };
}

if (process.argv[1]?.endsWith("train-isolation-forest.ts")) {
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
  const artifact = trainIsolationForest(
    rows,
    {
      numTrees: typeof args["num-trees"] === "string" ? Number(args["num-trees"]) : 50,
      subSampleSize:
        typeof args["sub-sample"] === "string" ? Number(args["sub-sample"]) : 64,
      seed: typeof args.seed === "string" ? Number(args.seed) : 42,
    },
    datasetHash,
  );
  writeFileSync(output, `${JSON.stringify(artifact, null, 2)}\n`);
}
