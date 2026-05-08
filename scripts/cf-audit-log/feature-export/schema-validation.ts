import { z } from "zod";
import { REDACTED_FEATURES_JSON_SCHEMA } from "../features/schema.ts";
import type { FeatureExportLine } from "../types.ts";

const schemaProperties = REDACTED_FEATURES_JSON_SCHEMA.properties;

const featureSchema = z.object({
  ipBucket: z.string(),
  hourOfDay: z.number().int().min(0).max(23),
  dayOfWeek: z.number().int().min(0).max(6),
  actionCategory: z.enum(schemaProperties.actionCategory.enum),
  statusClass: z.enum(schemaProperties.statusClass.enum),
  actorRoleHash: z.string().regex(/^[0-9a-f]{16}$/),
  userAgentCategory: z.enum(schemaProperties.userAgentCategory.enum),
  tokenIdPresent: z.boolean(),
}).strict();

const featureExportLineSchema = z.object({
  id: z.string().min(1),
  occurredAt: z.string().datetime({ offset: true }),
  features: featureSchema,
  label: z.enum(["HIGH", "MEDIUM", "LOW", "NONE"]).optional(),
}).strict();

export function validateRedactedFeatureLine(
  line: unknown,
  index: number,
): FeatureExportLine {
  let parsed: unknown;
  if (typeof line === "string") {
    try {
      parsed = JSON.parse(line);
    } catch (error) {
      throw new Error(`feature export line ${index} is not valid JSON: ${String(error)}`);
    }
  } else {
    parsed = line;
  }
  const result = featureExportLineSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`feature export line ${index} schema error: ${result.error.message}`);
  }
  return result.data;
}

export function validateRedactedFeatureJsonl(jsonl: string): FeatureExportLine[] {
  const lines = jsonl.split(/\r?\n/).filter(Boolean);
  return lines.map((line, index) => validateRedactedFeatureLine(line, index + 1));
}
