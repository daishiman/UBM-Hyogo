// FormPreviewView 組成 (04a)
// 不変条件 #1 (schema 固定禁止), #14 (schema 集約) — schema_questions を runtime で動的構築。
// responderUrl は env override 可能、未設定時は 01-api-schema.md の固定値。

import { z } from "zod";

import { FormPreviewViewZ } from "@ubm-hyogo/shared";

const FormFieldDefinitionZ = z
  .object({
    formId: z.string(),
    revisionId: z.string(),
    schemaHash: z.string(),
    stableKey: z.string(),
    questionId: z.string().nullable(),
    itemId: z.string().nullable(),
    sectionKey: z.string(),
    sectionTitle: z.string(),
    label: z.string(),
    kind: z.string(),
    position: z.number().int(),
    required: z.boolean(),
    visibility: z.string(),
    searchable: z.boolean(),
    source: z.literal("forms"),
    status: z.string(),
    choiceLabels: z.array(
      z.object({
        rawLabel: z.string(),
        normalizedValue: z.string(),
        position: z.number().int(),
        active: z.boolean(),
      }),
    ),
  })
  .strict();

const FormManifestZ = z
  .object({
    formId: z.string(),
    title: z.string(),
    revisionId: z.string(),
    schemaHash: z.string(),
    syncedAt: z.string(),
    sourceUrl: z.string(),
    fieldCount: z.number().int().nonnegative(),
    unknownFieldCount: z.number().int().nonnegative(),
    state: z.enum(["active", "superseded", "pending_review"]),
  })
  .strict();

export const FormPreviewResponseZ = FormPreviewViewZ;

export type FormPreviewResponse = z.infer<typeof FormPreviewResponseZ>;

export interface FormPreviewSource {
  manifest: z.infer<typeof FormManifestZ>;
  fields: Array<z.infer<typeof FormFieldDefinitionZ>>;
  responderUrl: string;
}

export const toFormPreviewView = (
  src: FormPreviewSource,
): FormPreviewResponse => {
  const sectionCount = new Set(src.fields.map((f) => f.sectionKey)).size;
  return FormPreviewResponseZ.parse({
    manifest: src.manifest,
    fields: src.fields,
    sectionCount,
    fieldCount: src.fields.length,
    responderUrl: src.responderUrl,
  });
};
