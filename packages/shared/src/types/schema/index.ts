import type {
  FieldKind,
  FieldStatus,
  FieldVisibility,
  SchemaState,
} from "../common";
import type { StableKey } from "../../branded";

export interface FormChoiceLabel {
  rawLabel: string;
  normalizedValue: string;
  position: number;
  active: boolean;
}

export interface FormFieldDefinition {
  formId: string;
  revisionId: string;
  schemaHash: string;
  stableKey: StableKey;
  questionId: string | null;
  itemId: string | null;
  sectionKey: string;
  sectionTitle: string;
  label: string;
  kind: FieldKind;
  position: number;
  required: boolean;
  visibility: FieldVisibility;
  searchable: boolean;
  source: "forms";
  status: FieldStatus;
  choiceLabels: FormChoiceLabel[];
}

export interface FormManifest {
  formId: string;
  title: string;
  revisionId: string;
  schemaHash: string;
  state: SchemaState;
  syncedAt: string;
  sourceUrl: string;
  fieldCount: number;
  unknownFieldCount: number;
}

export interface FormSchema {
  manifest: FormManifest;
  fields: FormFieldDefinition[];
}

export type SchemaAliasSource = "manual" | "auto" | "migration";

export interface SchemaAlias {
  id: string;
  stableKey: StableKey;
  aliasQuestionId: string;
  aliasLabel: string | null;
  source: SchemaAliasSource;
  createdAt: string;
  resolvedBy: string | null;
  resolvedAt: string | null;
}
