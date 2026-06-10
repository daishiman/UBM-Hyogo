import { describe, expect, it } from "vitest";
import { z } from "zod";
import { formatSchemaHistoryError } from "../schemaHistoryError";

describe("formatSchemaHistoryError", () => {
  it("ZodError を raw JSON ではなく日本語メッセージへ変換する", () => {
    const result = z.object({ ok: z.literal(true) }).safeParse({ ok: false });
    expect(result.success).toBe(false);
    const message = formatSchemaHistoryError(result.error);
    expect(message).toContain("履歴データの形式が想定と一致しませんでした");
    expect(message).not.toContain("invalid_value");
  });

  it("HTTP エラーを取得失敗メッセージへ変換する", () => {
    expect(formatSchemaHistoryError(new Error("fetchSchemaAliasHistory failed: HTTP 500"))).toContain(
      "履歴データを取得できませんでした",
    );
  });

  it("一般 Error の message を raw 表示しない", () => {
    const message = formatSchemaHistoryError(new Error("net"));
    expect(message).toContain("履歴の取得に失敗しました");
    expect(message).not.toContain("net");
  });

  it("JSON 文字列風の Error message を raw 表示しない", () => {
    const message = formatSchemaHistoryError(
      new Error('[{"code":"unrecognized_keys","keys":["batchId"]}]'),
    );
    expect(message).toContain("履歴の取得に失敗しました");
    expect(message).not.toContain("unrecognized_keys");
    expect(message).not.toContain("batchId");
  });
});
