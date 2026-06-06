import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { jstLocalToUtcIso } from "./audit-query";
import { safeServerFetch } from "../../../../src/lib/admin/safe-server-fetch";

vi.mock("../../../../src/lib/admin/safe-server-fetch", () => ({
  safeServerFetch: vi.fn(async () => ({
    ok: true,
    data: { items: [], nextCursor: null },
  })),
}));

import AdminAuditPage from "./page";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("admin audit page helpers", () => {
  it("converts JST datetime-local values to UTC ISO query values", () => {
    expect(jstLocalToUtcIso("2026-05-01T00:00")).toBe("2026-04-30T15:00:00.000Z");
    expect(jstLocalToUtcIso("2026-05-01T23:59")).toBe("2026-05-01T14:59:00.000Z");
  });

  it("ignores invalid datetime-local values", () => {
    expect(jstLocalToUtcIso("2026-05-01")).toBeUndefined();
    expect(jstLocalToUtcIso(undefined)).toBeUndefined();
  });

  it("renders AdminPageHeader title and breadcrumbs", async () => {
    render(await AdminAuditPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("heading", { level: 1, name: "監査ログ" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "管理" }).getAttribute("href")).toBe("/admin");
    expect(screen.getByText("action / actor / target / 期間で監査ログを絞り込み、PII を保護した形で参照できます。")).toBeTruthy();
  });

  it("restores identity action presets from searchParams without changing the API query contract", async () => {
    render(
      await AdminAuditPage({
        searchParams: Promise.resolve({ action: "identity.dismiss", limit: "25" }),
      }),
    );

    expect((screen.getByLabelText("action") as HTMLInputElement).value).toBe("identity.dismiss");
    expect(screen.getByLabelText("action").getAttribute("list")).toBe("audit-action-presets");
    expect(safeServerFetch).toHaveBeenCalledWith("/admin/audit?action=identity.dismiss&limit=25");
  });

  it("passes batchId searchParams to API path and restores the input value", async () => {
    render(
      await AdminAuditPage({
        searchParams: Promise.resolve({
          action: "admin.member.tag_assigned",
          batchId: "batch-1079",
          limit: "25",
        }),
      }),
    );

    expect((screen.getByLabelText("batchId") as HTMLInputElement).value).toBe("batch-1079");
    expect(safeServerFetch).toHaveBeenCalledWith(
      "/admin/audit?action=admin.member.tag_assigned&batchId=batch-1079&limit=25",
    );
  });
});
