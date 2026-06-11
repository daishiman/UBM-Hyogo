import {
  rawFormToStableKeyMap,
  type RawForm,
} from "@ubm-hyogo/integrations-google";

export interface SchemaQuestionMappingRow {
  readonly questionId: string | null;
  readonly stableKey: string;
}

export function buildQuestionIdToStableKey(
  raw: RawForm,
  schemaRows: ReadonlyArray<SchemaQuestionMappingRow>,
): Record<string, string> {
  const fromRaw = rawFormToStableKeyMap(raw);
  const fromSchema = Object.fromEntries(
    schemaRows
      .filter((row): row is SchemaQuestionMappingRow & { questionId: string } =>
        Boolean(row.questionId),
      )
      .map((row) => [row.questionId, row.stableKey]),
  );
  return { ...fromRaw, ...fromSchema };
}
