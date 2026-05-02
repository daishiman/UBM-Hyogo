import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

afterEach(() => {
  cleanup();
});
import {
  AuditLogPanel,
  buildAuditHref,
  formatJst,
  maskAuditJson,
  maskAuditText,
  summarizeAuditJson,
} from "../AuditLogPanel";

describe("AuditLogPanel", () => {
  it("masks nested PII before JSON reaches visible DOM", () => {
    const masked = maskAuditJson({
      nested: {
        email: "raw@example.com",
        phone: "090-1234-5678",
        displayName: "Raw Name",
      },
      action: "kept",
    });

    expect(JSON.stringify(masked)).not.toContain("raw@example.com");
    expect(JSON.stringify(masked)).not.toContain("090-1234-5678");
    expect(JSON.stringify(masked)).not.toContain("Raw Name");
    expect(JSON.stringify(masked)).toContain("kept");
  });

  it("renders collapsed summaries and no edit/delete/rerun actions", () => {
    const rawEmail = "member@example.com";
    render(
      <AuditLogPanel
        values={{ action: "attendance.add", limit: "50" }}
        data={{
          nextCursor: "cursor-2",
          items: [
            {
              auditId: "audit-1",
              actorEmail: "admin@example.com",
              action: "attendance.add",
              targetType: "meeting",
              targetId: "session-1",
              maskedBefore: null,
              maskedAfter: { email: rawEmail, count: 1 },
              createdAt: "2026-04-30T15:00:00.000Z",
            },
          ],
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "監査ログ" })).toBeTruthy();
    expect(screen.getByText(/2026\/05\/01/)).toBeTruthy();
    expect(screen.getByText("after: email, count")).toBeTruthy();
    expect(document.body.textContent).not.toContain(rawEmail);
    expect(screen.queryByRole("button", { name: /編集|削除|再実行|実行/i })).toBeNull();
    expect(screen.getByRole("link", { name: "次のページ" }).getAttribute("href")).toContain(
      "cursor=cursor-2",
    );
  });

  it("keeps filters in pagination href", () => {
    expect(
      buildAuditHref(
        {
          action: "attendance.add",
          actorEmail: "admin@example.com",
          targetType: "meeting",
          targetId: "s1",
          fromLocal: "2026-05-01T00:00",
          toLocal: "2026-05-01T23:59",
          limit: "25",
        },
        "next",
      ),
    ).toBe(
      "/admin/audit?action=attendance.add&actorEmail=admin%40example.com&targetType=meeting&targetId=s1&from=2026-05-01T00%3A00&to=2026-05-01T23%3A59&limit=25&cursor=next",
    );
  });

  it("formats UTC timestamps in JST", () => {
    expect(formatJst("2026-04-30T15:00:00.000Z")).toContain("2026/05/01");
    expect(formatJst("2026-04-30T15:00:00.000Z")).toContain("JST");
  });

  it("renders empty and error states", () => {
    const { rerender } = render(
      <AuditLogPanel values={{ limit: "50" }} data={{ items: [], nextCursor: null }} />,
    );
    expect(screen.getByText("該当する監査ログはありません。")).toBeTruthy();

    rerender(<AuditLogPanel values={{ limit: "50" }} data={null} error="status 500" />);
    expect(screen.getByRole("alert").textContent).toContain("status 500");
  });
});

describe("maskAuditJson — branch coverage 補強", () => {
  it("null と undefined はそのまま返す", () => {
    expect(maskAuditJson(null)).toBeNull();
    expect(maskAuditJson(undefined)).toBeUndefined();
  });

  it("primitive (number, boolean) はそのまま返す", () => {
    expect(maskAuditJson(123)).toBe(123);
    expect(maskAuditJson(true)).toBe(true);
    expect(maskAuditJson(false)).toBe(false);
  });

  it("PII でない通常の文字列はそのまま返す", () => {
    expect(maskAuditJson("hello", "title")).toBe("hello");
  });

  it("PII キーで値が文字列なら masked になる", () => {
    expect(maskAuditJson("u@example.com", "email")).toBe("[masked-email]");
    expect(maskAuditJson("090-1234-5678", "phone")).toBe("[masked-phone]");
    expect(maskAuditJson("田中 太郎", "displayName")).toBe("[masked]");
    expect(maskAuditJson("foo@example.com", "responseEmail")).toBe("[masked-email]");
  });

  it("値自体が email/phone なら key 関係なく masked", () => {
    expect(maskAuditJson("user@example.com", "anything")).toBe("[masked-email]");
    expect(maskAuditJson("+81 90 1234 5678", "anything")).toBe("[masked-phone]");
  });

  it("配列を再帰的にマスクする", () => {
    const result = maskAuditJson(["plain", "user@example.com", { email: "x@y.com" }]);
    expect(result).toEqual(["plain", "[masked-email]", { email: "[masked-email]" }]);
  });

  it("ネスト多段オブジェクトを再帰的にマスクする", () => {
    const result = maskAuditJson({
      level1: {
        level2: {
          email: "a@b.com",
          ok: "kept",
        },
      },
    });
    expect(JSON.stringify(result)).not.toContain("a@b.com");
    expect(JSON.stringify(result)).toContain("kept");
  });

  it("PII キーの値が非文字列の場合 String 化してマスクする", () => {
    const result = maskAuditJson({ email: 12345 }) as Record<string, unknown>;
    expect(result.email).toBe("[masked]");
  });
});

describe("formatJst — 境界値", () => {
  it("不正文字列は input をそのまま返す", () => {
    expect(formatJst("not-a-date")).toBe("not-a-date");
  });

  it("空文字も input そのまま", () => {
    expect(formatJst("")).toBe("");
  });

  it("JST 跨ぎ (UTC 15:00 → JST 翌日 00:00) を変換", () => {
    const r = formatJst("2026-04-30T15:00:00.000Z");
    expect(r).toContain("2026/05/01");
    expect(r).toContain("00:00:00");
  });
});

describe("buildAuditHref — 境界", () => {
  it("全パラメータ空 → 最小 URL", () => {
    expect(buildAuditHref({})).toBe("/admin/audit");
  });

  it("cursor が空文字 → cursor は付かない", () => {
    expect(buildAuditHref({ action: "x" }, "")).toBe("/admin/audit?action=x");
  });

  it("cursor が null → cursor は付かない", () => {
    expect(buildAuditHref({ action: "x" }, null)).toBe("/admin/audit?action=x");
  });

  it("cursor 未指定 → cursor は付かない", () => {
    expect(buildAuditHref({ action: "x" })).toBe("/admin/audit?action=x");
  });

  it("空文字フィールドはスキップ", () => {
    expect(buildAuditHref({ action: "  ", actorEmail: "a@b.com" })).toBe(
      "/admin/audit?actorEmail=a%40b.com",
    );
  });
});

describe("maskAuditText", () => {
  it("null/undefined/空文字 は system を返す", () => {
    expect(maskAuditText(null, "actorEmail")).toBe("system");
    expect(maskAuditText(undefined, "actorEmail")).toBe("system");
    expect(maskAuditText("", "actorEmail")).toBe("system");
  });

  it("PII 文字列はマスクされる", () => {
    expect(maskAuditText("admin@example.com", "actorEmail")).toBe("[masked-email]");
  });
});

describe("summarizeAuditJson", () => {
  it("null は なし", () => {
    expect(summarizeAuditJson(null)).toBe("なし");
    expect(summarizeAuditJson(undefined)).toBe("なし");
  });

  it("配列は items 数", () => {
    expect(summarizeAuditJson([1, 2, 3])).toBe("3 items");
  });

  it("空オブジェクトは empty object", () => {
    expect(summarizeAuditJson({})).toBe("empty object");
  });

  it("4 キー以下はカンマ結合", () => {
    expect(summarizeAuditJson({ a: 1, b: 2 })).toBe("a, b");
  });

  it("4 キー超は +N 表示", () => {
    expect(summarizeAuditJson({ a: 1, b: 2, c: 3, d: 4, e: 5, f: 6 })).toBe("a, b, c, d +2");
  });

  it("primitive は typeof", () => {
    expect(summarizeAuditJson(42)).toBe("number");
    expect(summarizeAuditJson("x")).toBe("string");
  });
});

describe("AuditLogPanel — render 分岐", () => {
  const baseItem = {
    auditId: "a1",
    actorEmail: null,
    action: "x",
    targetType: null,
    targetId: null,
    createdAt: "2026-04-30T15:00:00.000Z",
  };

  it("nextCursor=null では「次のページ」リンクを描画しない", () => {
    render(
      <AuditLogPanel
        values={{ limit: "50" }}
        data={{
          nextCursor: null,
          items: [{ ...baseItem, maskedBefore: null, maskedAfter: null }],
        }}
      />,
    );
    expect(screen.queryByRole("link", { name: "次のページ" })).toBeNull();
    expect(screen.getByText("次のページはありません")).toBeTruthy();
  });

  it("maskedBefore/maskedAfter 両方 null → before/after の summary が なし", () => {
    render(
      <AuditLogPanel
        values={{ limit: "50" }}
        data={{
          nextCursor: null,
          items: [{ ...baseItem, maskedBefore: null, maskedAfter: null }],
        }}
      />,
    );
    expect(screen.getByText("before: なし")).toBeTruthy();
    expect(screen.getByText("after: なし")).toBeTruthy();
  });

  it("maskedBefore のみあるケース", () => {
    render(
      <AuditLogPanel
        values={{ limit: "50" }}
        data={{
          nextCursor: null,
          items: [
            {
              ...baseItem,
              maskedBefore: { foo: 1 },
              maskedAfter: null,
            },
          ],
        }}
      />,
    );
    expect(screen.getByText("before: foo")).toBeTruthy();
    expect(screen.getByText("after: なし")).toBeTruthy();
  });

  it("maskedBefore/maskedAfter 両方あるケース", () => {
    render(
      <AuditLogPanel
        values={{ limit: "50" }}
        data={{
          nextCursor: null,
          items: [
            {
              ...baseItem,
              maskedBefore: { x: 1 },
              maskedAfter: { y: 2 },
            },
          ],
        }}
      />,
    );
    expect(screen.getByText("before: x")).toBeTruthy();
    expect(screen.getByText("after: y")).toBeTruthy();
  });

  it("masked* なしで beforeJson/afterJson にフォールバック", () => {
    render(
      <AuditLogPanel
        values={{ limit: "50" }}
        data={{
          nextCursor: null,
          items: [
            {
              ...baseItem,
              beforeJson: { p: 1 },
              afterJson: { q: 2 },
            },
          ],
        }}
      />,
    );
    expect(screen.getByText("before: p")).toBeTruthy();
    expect(screen.getByText("after: q")).toBeTruthy();
  });

  it("targetType/targetId が null のときは - を表示", () => {
    render(
      <AuditLogPanel
        values={{ limit: "50" }}
        data={{
          nextCursor: null,
          items: [{ ...baseItem, maskedBefore: null, maskedAfter: null }],
        }}
      />,
    );
    // td 内の span と code に - が出る
    const dashes = screen.getAllByText("-");
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it("parseError がある場合に警告文を表示", () => {
    render(
      <AuditLogPanel
        values={{ limit: "50" }}
        data={{
          nextCursor: null,
          items: [
            {
              ...baseItem,
              maskedBefore: null,
              maskedAfter: null,
              parseError: true,
            },
          ],
        }}
      />,
    );
    expect(screen.getByRole("note").textContent).toContain("JSON parse warning");
  });

  it("values の各フィールドが defaultValue として反映される", () => {
    render(
      <AuditLogPanel
        values={{
          action: "attendance.add",
          actorEmail: "a@b.com",
          targetType: "meeting",
          targetId: "s1",
          fromLocal: "2026-05-01T00:00",
          toLocal: "2026-05-01T23:59",
          limit: "100",
        }}
        data={{ items: [], nextCursor: null }}
      />,
    );
    expect((screen.getByLabelText(/action/) as HTMLInputElement).value).toBe("attendance.add");
    expect((screen.getByLabelText(/actorEmail/) as HTMLInputElement).value).toBe("a@b.com");
    expect((screen.getByLabelText(/targetType/) as HTMLInputElement).value).toBe("meeting");
    expect((screen.getByLabelText(/targetId/) as HTMLInputElement).value).toBe("s1");
    expect((screen.getByLabelText(/limit/) as HTMLSelectElement).value).toBe("100");
  });

  it("values 未指定 (undefined) でも空文字 default で描画", () => {
    render(<AuditLogPanel values={{}} data={{ items: [], nextCursor: null }} />);
    expect((screen.getByLabelText(/action/) as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText(/limit/) as HTMLSelectElement).value).toBe("50");
  });

  it("error なし & items 空のときに empty 表示、items 有のときは empty 非表示", () => {
    const { rerender } = render(
      <AuditLogPanel values={{}} data={{ items: [], nextCursor: null }} />,
    );
    expect(screen.queryByText("該当する監査ログはありません。")).toBeTruthy();

    rerender(
      <AuditLogPanel
        values={{}}
        data={{
          nextCursor: null,
          items: [
            {
              auditId: "a1",
              actorEmail: null,
              action: "x",
              targetType: null,
              targetId: null,
              createdAt: "2026-04-30T15:00:00.000Z",
              maskedBefore: null,
              maskedAfter: null,
            },
          ],
        }}
      />,
    );
    expect(screen.queryByText("該当する監査ログはありません。")).toBeNull();
  });
});
