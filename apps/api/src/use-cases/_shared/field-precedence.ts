import type { MemberFieldOverrideRow } from "../../repository/memberFieldOverrides";
import type { ResponseFieldRow } from "../../repository/responseFields";

export interface ResolvedFieldRow {
  stable_key: string;
  value_json: string | null;
  raw_value_json: string | null;
  source: "forms" | "admin";
}

export function resolveFieldPrecedence(
  responseFields: readonly ResponseFieldRow[],
  overrides: readonly Pick<MemberFieldOverrideRow, "stable_key" | "value_json" | "raw_value_json">[],
): ResolvedFieldRow[] {
  const byKey = new Map<string, ResolvedFieldRow>();
  for (const field of responseFields) {
    byKey.set(field.stable_key, {
      stable_key: field.stable_key,
      value_json: field.value_json,
      raw_value_json: field.raw_value_json,
      source: "forms",
    });
  }
  for (const override of overrides) {
    byKey.set(override.stable_key, {
      stable_key: override.stable_key,
      value_json: override.value_json,
      raw_value_json: override.raw_value_json ?? override.value_json,
      source: "admin",
    });
  }
  return [...byKey.values()].sort((a, b) =>
    a.stable_key.localeCompare(b.stable_key),
  );
}
