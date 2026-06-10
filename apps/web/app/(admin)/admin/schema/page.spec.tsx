import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AdminSchemaPage from "./page";
import { safeServerFetch } from "../../../../src/lib/admin/safe-server-fetch";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

vi.mock("../../../../src/lib/admin/safe-server-fetch", () => ({
  safeServerFetch: vi.fn(),
}));

const mockedSafeServerFetch = vi.mocked(safeServerFetch);

afterEach(() => cleanup());

describe("AdminSchemaPage", () => {
  beforeEach(() => {
    mockedSafeServerFetch.mockReset();
  });

  it("renders prototype-aligned schema page sections from diff response", async () => {
    mockedSafeServerFetch.mockResolvedValueOnce({
      ok: true,
      data: {
        total: 3,
        items: [
          {
            diffId: "d-added",
            revisionId: "rev-1",
            type: "added",
            questionId: "q-added",
            stableKey: null,
            label: "New question",
            suggestedStableKey: "new_question",
            status: "queued",
            resolvedBy: null,
            resolvedAt: null,
            createdAt: "2026-05-27T00:00:00Z",
          },
          {
            diffId: "d-changed",
            revisionId: "rev-1",
            type: "changed",
            questionId: "q-changed",
            stableKey: "old_question",
            label: "Changed question",
            suggestedStableKey: null,
            status: "queued",
            resolvedBy: null,
            resolvedAt: null,
            createdAt: "2026-05-27T00:00:00Z",
          },
          {
            diffId: "d-removed",
            revisionId: "rev-1",
            type: "removed",
            questionId: "q-removed",
            stableKey: "removed_question",
            label: "Removed question",
            suggestedStableKey: null,
            status: "resolved",
            resolvedBy: "admin@example.com",
            resolvedAt: "2026-05-27T00:00:00Z",
            createdAt: "2026-05-27T00:00:00Z",
          },
        ],
        resolvedAliases: [
          {
            id: "alias-1",
            revisionId: "rev-1",
            stableKey: "full_name",
            aliasQuestionId: "q-old",
            aliasLabel: "氏名",
            resolvedAt: "2026-05-27T00:00:00Z",
            resolvedBy: "admin@example.com",
            version: 1,
          },
        ],
      },
    });

    render(await AdminSchemaPage());

    expect(mockedSafeServerFetch).toHaveBeenCalledWith("/admin/schema/diff");
    expect(screen.getByRole("heading", { name: "スキーマ差分のレビュー" })).toBeTruthy();
    expect(screen.getByText("CURRENT REVISION")).toBeTruthy();
    expect(screen.getByText("Unresolved")).toBeTruthy();
    expect(screen.getByText("Added")).toBeTruthy();
    expect(screen.getByText("Changed")).toBeTruthy();
    expect(screen.getByText("Removed")).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        name: "フォームの設問変更を、過去データと繋げて整理します",
      }),
    ).toBeTruthy();
    expect(screen.getByText("永続的な名前（技術名: stableKey）")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "項目別の差分" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "バージョン履歴" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "紐付け履歴" })).toBeTruthy();
    expect(screen.queryByText("Form schema 概要")).toBeNull();
    expect(screen.queryByTestId("admin-schema-section")).toBeNull();
  });

  it("renders section error without stale fallback sections when diff fetch fails", async () => {
    mockedSafeServerFetch.mockResolvedValueOnce({
      ok: false,
      error: { code: "ADMIN_FETCH_404", message: "admin api /admin/schema/diff failed: 404" },
    });

    render(await AdminSchemaPage());

    expect(screen.getByRole("heading", { name: "スキーマ差分のレビュー" })).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toContain("ADMIN_FETCH_404");
    expect(screen.queryByText("Form schema 概要")).toBeNull();
    expect(screen.queryByTestId("admin-schema-section")).toBeNull();
  });
});
