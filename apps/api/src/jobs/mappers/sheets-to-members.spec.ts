import { describe, it, expect } from "vitest";
import { mapSheetRows } from "./sheets-to-members";

describe("mapSheetRows", () => {
  it("ヘッダ + 1 行を MemberRow に変換する", () => {
    const values = [
      ["タイムスタンプ", "メールアドレス", "氏名", "公開同意", "規約同意"],
      ["2026-04-27T08:00:00Z", "alice@example.com", "Alice", "はい", "同意する"],
    ];
    const { rows, skipped } = mapSheetRows(values);
    expect(skipped).toEqual([]);
    expect(rows).toHaveLength(1);
    const r = rows[0];
    expect(r.responseEmail).toBe("alice@example.com");
    expect(r.fullName).toBe("Alice");
    expect(r.publicConsent).toBe("consented");
    expect(r.rulesConsent).toBe("consented");
    expect(r.responseId).toBe("2026-04-27t08:00:00z__alice@example.com");
  });

  it("submittedAt または email 不足はスキップ", () => {
    const values = [
      ["タイムスタンプ", "メールアドレス", "氏名"],
      ["", "alice@example.com", "Alice"],
      ["2026-04-27T08:00:00Z", "", "Bob"],
    ];
    const { rows, skipped } = mapSheetRows(values);
    expect(rows).toHaveLength(0);
    expect(skipped).toHaveLength(2);
  });

  it("未知の列は extraFieldsJson に格納する", () => {
    const values = [
      ["タイムスタンプ", "メールアドレス", "未知の質問"],
      ["2026-04-27T08:00:00Z", "alice@example.com", "answer"],
    ];
    const { rows } = mapSheetRows(values);
    expect(rows[0].extraFieldsJson).toContain("未知の質問");
    expect(rows[0].unmappedQuestionIdsJson).toContain("未知の質問");
  });

  it("consent 不明値は unknown を返す", () => {
    const values = [
      ["タイムスタンプ", "メールアドレス", "公開同意"],
      ["2026-04-27T08:00:00Z", "alice@example.com", "後で"],
    ];
    const { rows } = mapSheetRows(values);
    expect(rows[0].publicConsent).toBe("unknown");
  });

  it("空 input は空 rows を返す", () => {
    expect(mapSheetRows([])).toEqual({ rows: [], skipped: [] });
  });
});
