import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  AuditLogPanel,
  buildAuditHref,
  formatJst,
  maskAuditJson,
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
