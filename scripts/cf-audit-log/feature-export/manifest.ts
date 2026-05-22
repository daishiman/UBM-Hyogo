import { createHash, randomUUID } from "node:crypto";
import type { FeatureExportManifest, FeatureExportWindow } from "../types.ts";

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function buildFeatureExportManifest(input: {
  window: FeatureExportWindow;
  rowCount: number;
  jsonl: string;
  now?: () => Date;
  exportRunId?: string;
}): FeatureExportManifest {
  return {
    exportRunId: input.exportRunId ?? randomUUID(),
    source: "cf_audit_log",
    windowFromUtc: input.window.fromUtc.toISOString(),
    windowToUtc: input.window.toUtc.toISOString(),
    rowCount: input.rowCount,
    sha256: sha256Hex(input.jsonl),
    redactionPolicyVersion: "feature-v1",
    schemaVersion: "redacted-features-v1",
    generatedAt: (input.now ?? (() => new Date()))().toISOString(),
  };
}
