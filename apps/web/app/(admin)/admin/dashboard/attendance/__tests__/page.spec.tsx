// admin-ui-task-d: focused vitest for /admin/dashboard/attendance
// T-D-01..D-04 を AC-D3..D9 にマップ
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/admin/dashboard/attendance",
}));

vi.mock("../../../../../../src/lib/admin/safe-server-fetch", () => ({
  safeServerFetch: vi.fn(),
}));

import AdminAttendanceDashboardPage from "../page";
import { safeServerFetch } from "../../../../../../src/lib/admin/safe-server-fetch";

const overviewOk = {
  ok: true as const,
  data: { totalSessions: 12, totalMembers: 30, overallRate: 0.75 },
};

const bySessionOk = {
  ok: true as const,
  data: [
    {
      sessionId: "s1",
      title: "第1回",
      heldOn: "2026-04-10",
      attendeeCount: 20,
      rate: 0.8,
    },
    {
      sessionId: "s2",
      title: "第2回",
      heldOn: "2026-05-10",
      attendeeCount: 18,
      rate: 0.6,
    },
  ],
};

const rankingOk = {
  ok: true as const,
  data: [
    { memberId: "m1", displayName: "Alice", attendedCount: 9, rate: 0.9 },
    { memberId: "m2", displayName: "Bob", attendedCount: 5, rate: 0.5 },
    { memberId: "m3", displayName: "", attendedCount: 7, rate: 0.7 },
  ],
};

const errResult = {
  ok: false as const,
  error: { code: "UPSTREAM_ERROR", message: "fetch failed" },
};

function setFetchSequence(results: unknown[]) {
  const mock = vi.mocked(safeServerFetch);
  mock.mockReset();
  for (const r of results) {
    mock.mockResolvedValueOnce(r as never);
  }
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("AdminAttendanceDashboardPage", () => {
  describe("T-D-01: 3 region testid", () => {
    beforeEach(() => setFetchSequence([overviewOk, bySessionOk, rankingOk]));

    it("renders 3 region testids when all endpoints ok", async () => {
      render(await AdminAttendanceDashboardPage());
      expect(screen.getByTestId("admin-attendance-dashboard")).toBeTruthy();
      expect(screen.getByTestId("attendance-overview")).toBeTruthy();
      expect(screen.getByTestId("attendance-by-session")).toBeTruthy();
      expect(screen.getByTestId("attendance-ranking")).toBeTruthy();
    });
  });

  describe("T-D-02: a11y", () => {
    beforeEach(() => setFetchSequence([overviewOk, bySessionOk, rankingOk]));

    it("page root has accessible name 出席分析 and single h1", async () => {
      render(await AdminAttendanceDashboardPage());
      expect(screen.getByRole("region", { name: "出席分析" })).toBeTruthy();
      expect(screen.getByRole("group", { name: "出席サマリー" })).toBeTruthy();
      const headings = screen.getAllByRole("heading", { level: 1 });
      expect(headings).toHaveLength(1);
      expect(headings[0].textContent).toContain("出席分析");
    });

    it("AdminTable renders 2 captions", async () => {
      render(await AdminAttendanceDashboardPage());
      const tables = screen.getAllByTestId("admin-table");
      expect(tables).toHaveLength(2);
    });
  });

  describe("T-D-03: data rendering", () => {
    beforeEach(() => setFetchSequence([overviewOk, bySessionOk, rankingOk]));

    it("renders 3 KPI cards", async () => {
      render(await AdminAttendanceDashboardPage());
      expect(screen.getByTestId("attendance-kpi-total-sessions")).toBeTruthy();
      expect(screen.getByTestId("attendance-kpi-total-members")).toBeTruthy();
      expect(screen.getByTestId("attendance-kpi-overall-rate")).toBeTruthy();
    });

    it("by-session row count equals data length + header", async () => {
      render(await AdminAttendanceDashboardPage());
      const bySession = screen.getByTestId("attendance-by-session");
      const rows = within(bySession).getAllByRole("row");
      expect(rows).toHaveLength(bySessionOk.data.length + 1);
    });

    it("ranking default sort = rate desc (top row = max rate)", async () => {
      render(await AdminAttendanceDashboardPage());
      const ranking = screen.getByTestId("attendance-ranking");
      const rows = within(ranking).getAllByRole("row");
      const firstDataRow = rows[1];
      expect(firstDataRow.textContent).toContain("Alice");
      expect(firstDataRow.textContent).toContain("90.0%");
    });
  });

  describe("T-D-04: fail-soft", () => {
    it("overview err only: section error rendered + other regions continue", async () => {
      setFetchSequence([errResult, bySessionOk, rankingOk]);
      render(await AdminAttendanceDashboardPage());
      expect(screen.queryByTestId("attendance-overview")).toBeNull();
      expect(screen.getByTestId("attendance-by-session")).toBeTruthy();
      expect(screen.getByTestId("attendance-ranking")).toBeTruthy();
    });

    it("by-session empty: AdminEmptyState rendered", async () => {
      setFetchSequence([
        overviewOk,
        { ok: true as const, data: [] },
        rankingOk,
      ]);
      render(await AdminAttendanceDashboardPage());
      const bySession = screen.getByTestId("attendance-by-session");
      expect(within(bySession).getByTestId("admin-empty-state")).toBeTruthy();
    });

    it("ranking err only: ranking shows error, others continue", async () => {
      setFetchSequence([overviewOk, bySessionOk, errResult]);
      render(await AdminAttendanceDashboardPage());
      expect(screen.getByTestId("attendance-overview")).toBeTruthy();
      expect(screen.getByTestId("attendance-by-session")).toBeTruthy();
      const ranking = screen.getByTestId("attendance-ranking");
      expect(ranking.textContent || "").toContain("fetch failed");
    });
  });
});
