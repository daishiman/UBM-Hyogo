// @vitest-environment node
// Issue #401: notification template tests
import { describe, it, expect } from "vitest";
import {
  sanitizeRejectionNote,
  buildApprovedMessage,
  buildRejectedMessage,
  buildNotificationMessage,
} from "../templates";

describe("sanitizeRejectionNote", () => {
  it("AC-9: 制御文字を除去し trim + 200 文字 truncate", () => {
    expect(sanitizeRejectionNote("helloworld")).toBe("helloworld");
    expect(sanitizeRejectionNote("  abc  ")).toBe("abc");
    expect(sanitizeRejectionNote("a".repeat(300)).length).toBe(200);
    expect(sanitizeRejectionNote(null)).toBe("");
    expect(sanitizeRejectionNote(undefined)).toBe("");
  });
});

describe("buildApprovedMessage", () => {
  it("approve template: subject / text に reasonSummary プレースホルダが現れない", () => {
    const m = buildApprovedMessage({
      to: "u@example.com",
      from: "from@example.com",
      requestType: "visibility_request",
    });
    expect(m.to).toBe("u@example.com");
    expect(m.from).toBe("from@example.com");
    expect(m.subject).toContain("公開設定の変更");
    expect(m.text).not.toContain("reasonSummary");
    expect(m.html).toContain("UBM");
  });

  it("delete_request の approve は退会・削除文言を含む", () => {
    const m = buildApprovedMessage({
      to: "u@example.com",
      from: "from@example.com",
      requestType: "delete_request",
    });
    expect(m.subject).toContain("退会・削除");
    expect(m.text).toContain("掲載は停止");
  });
});

describe("buildRejectedMessage", () => {
  const rawSecret = "<script>alert('pwn')</script> raw resolution note that should never appear";

  it("AC-8: 生 resolutionNote を絶対に含めない (sanitize 済 reasonSummary のみ反映)", () => {
    const sanitized = sanitizeRejectionNote(rawSecret);
    const m = buildRejectedMessage({
      to: "u@example.com",
      from: "from@example.com",
      requestType: "visibility_request",
      reasonSummary: sanitized,
    });
    expect(m.text).not.toContain("");
    expect(m.text).not.toContain("");
    expect(m.text).toContain(sanitized);
    // html では < > " ' は escape されている
    expect(m.html).not.toContain("<script>alert");
    expect(m.html).toContain("&lt;script&gt;");
  });

  it("reasonSummary が null/空 のとき理由ブロックを含めない", () => {
    const m = buildRejectedMessage({
      to: "u@example.com",
      from: "from@example.com",
      requestType: "delete_request",
      reasonSummary: null,
    });
    expect(m.text).not.toContain("理由（管理者からの要約）");
    expect(m.html).not.toContain("理由（管理者からの要約）");
  });

  it("reasonSummary が指定されると理由ブロックに展開される", () => {
    const m = buildRejectedMessage({
      to: "u@example.com",
      from: "from@example.com",
      requestType: "visibility_request",
      reasonSummary: "本人確認が取れませんでした",
    });
    expect(m.text).toContain("理由（管理者からの要約）");
    expect(m.text).toContain("本人確認が取れませんでした");
    expect(m.html).toContain("本人確認が取れませんでした");
  });
});

describe("buildNotificationMessage dispatcher", () => {
  it("approved → approved template", () => {
    const m = buildNotificationMessage({
      to: "u@example.com",
      from: "from@example.com",
      outcome: "approved",
      requestType: "visibility_request",
      reasonSummary: null,
    });
    expect(m.subject).toContain("完了");
  });
  it("rejected → rejected template", () => {
    const m = buildNotificationMessage({
      to: "u@example.com",
      from: "from@example.com",
      outcome: "rejected",
      requestType: "visibility_request",
      reasonSummary: "x",
    });
    expect(m.subject).toContain("について");
  });
});
