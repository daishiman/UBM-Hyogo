export const MATCHED_FIELD_LABELS: Record<string, string> = {
  name: "氏名",
  affiliation: "職業",
};

export const RECORD_ROLE_LABELS = {
  source: "新しい登録",
  target: "まとめ先（以前の登録）",
} as const;

export const matchedFieldLabel = (field: string): string =>
  MATCHED_FIELD_LABELS[field] ?? field;
