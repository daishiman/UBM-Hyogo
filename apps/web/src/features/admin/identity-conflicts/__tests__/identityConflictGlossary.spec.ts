import { describe, expect, it } from "vitest";
import {
  matchedFieldLabel,
  MATCHED_FIELD_LABELS,
  RECORD_ROLE_LABELS,
} from "../identityConflictGlossary";

describe("identityConflictGlossary", () => {
  it("API matchedFields を表示用日本語へ変換する", () => {
    expect(matchedFieldLabel("name")).toBe("氏名");
    expect(matchedFieldLabel("affiliation")).toBe("職業");
    expect(MATCHED_FIELD_LABELS).toEqual({ name: "氏名", affiliation: "職業" });
  });

  it("未登録 matchedField は fail-soft で原文を返す", () => {
    expect(matchedFieldLabel("unknown_field")).toBe("unknown_field");
  });

  it("source/target の役割ラベルを UI 表現層で単一管理する", () => {
    expect(RECORD_ROLE_LABELS).toEqual({
      source: "新しい登録",
      target: "まとめ先（以前の登録）",
    });
  });
});
