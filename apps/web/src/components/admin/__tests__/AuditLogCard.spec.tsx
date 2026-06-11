import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AuditLogCard } from "../AuditLogCard";

afterEach(() => cleanup());

describe("AuditLogCard", () => {
  it("renders a masked timeline card with batchId copy affordance", () => {
    render(
      <ol>
        <AuditLogCard
          item={{
            auditId: "audit-1",
            actorEmail: "admin@example.com",
            action: "admin.member.tag_assigned",
            targetType: "member",
            targetId: "mem-1",
            maskedBefore: null,
            maskedAfter: { batchId: "batch-1", email: "raw@example.com" },
            createdAt: "2026-04-30T15:00:00.000Z",
          }}
        />
      </ol>,
    );

    expect(screen.getByTestId("audit-log-card")).toBeTruthy();
    expect(screen.getAllByText("admin.member.tag_assigned")).toHaveLength(2);
    expect(screen.getByTestId("audit-batch-id").textContent).toContain("バッチ");
    expect(screen.getByTestId("audit-batch-id").textContent).toContain("batch-1");
    expect(document.body.textContent).not.toContain("raw@example.com");
  });

  it("renders system actor and dash target fallback in Japanese", () => {
    render(
      <ol>
        <AuditLogCard
          item={{
            auditId: "audit-2",
            actorEmail: null,
            action: "system.cleanup",
            targetType: null,
            targetId: null,
            maskedBefore: null,
            maskedAfter: null,
            createdAt: "2026-04-30T15:00:00.000Z",
          }}
        />
      </ol>,
    );

    expect(screen.getByText("システム")).toBeTruthy();
    expect(document.body.textContent).toContain("—");
  });
});
