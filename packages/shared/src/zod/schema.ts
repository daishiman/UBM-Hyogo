import { z } from "zod";

import {
  FieldKindZ,
  FieldStatusZ,
  FieldVisibilityZ,
  Iso8601Z,
  SchemaStateZ,
  StableKeyZ,
} from "./primitives";

export const FormChoiceLabelZ = z.object({
  rawLabel: z.string(),
  normalizedValue: z.string(),
  position: z.number().int().nonnegative(),
  active: z.boolean(),
});

export const FormFieldDefinitionZ = z.object({
  formId: z.string().min(1),
  revisionId: z.string().min(1),
  schemaHash: z.string().min(1),
  stableKey: StableKeyZ,
  questionId: z.string().nullable(),
  itemId: z.string().nullable(),
  sectionKey: z.string().min(1),
  sectionTitle: z.string(),
  label: z.string().min(1),
  kind: FieldKindZ,
  position: z.number().int().nonnegative(),
  required: z.boolean(),
  visibility: FieldVisibilityZ,
  searchable: z.boolean(),
  source: z.literal("forms"),
  status: FieldStatusZ,
  choiceLabels: z.array(FormChoiceLabelZ),
});

export const FormManifestZ = z.object({
  formId: z.string().min(1),
  title: z.string(),
  revisionId: z.string().min(1),
  schemaHash: z.string().min(1),
  state: SchemaStateZ,
  syncedAt: Iso8601Z,
  sourceUrl: z.string().url(),
  fieldCount: z.number().int().nonnegative(),
  unknownFieldCount: z.number().int().nonnegative(),
});

export const FormSchemaZ = z.object({
  manifest: FormManifestZ,
  fields: z.array(FormFieldDefinitionZ),
});
