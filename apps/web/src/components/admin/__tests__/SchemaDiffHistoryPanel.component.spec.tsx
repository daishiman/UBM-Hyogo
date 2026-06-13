// issue-777: SchemaDiffHistoryPanel component spec
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor, fireEvent } from "@testing-library/react";

const replaceMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, refresh: () => {}, push: () => {} }),
}));

const fetchHistoryMock = vi.fn();
vi.mock("../../../lib/admin/api", async () => {
  const actual =
    await vi.importActual<typeof import("../../../lib/admin/api")>(
      "../../../lib/admin/api",
    );
  return {
    ...actual,
    fetchSchemaAliasHistory: (...args: unknown[]) => fetchHistoryMock(...args),
  };
});

import { SchemaDiffHistoryPanel } from "../SchemaDiffHistoryPanel";

const item = (over: Partial<{ auditId: string; createdAt: string; questionText: string | null; actorEmail: string | null; beforeStableKey: string | null; afterStableKey: string | null }> = {}) => ({
  auditId: over.auditId ?? "a1",
  createdAt: over.createdAt ?? "2026-05-19T10:00:00Z",
  actorEmail: over.actorEmail === undefined ? "admin@example.com" : over.actorEmail,
  beforeStableKey: over.beforeStableKey === undefined ? "unknown" : over.beforeStableKey,
  afterStableKey: over.afterStableKey === undefined ? "full_name" : over.afterStableKey,
  questionText: over.questionText === undefined ? "氏名" : over.questionText,
});

const okResp = (items: ReturnType<typeof item>[], nextCursor: string | null = null) => ({
  ok: true,
  items,
  nextCursor,
  appliedFilters: {
    action: "schema_diff.alias_assigned",
    actorEmail: null,
    targetType: null,
    targetId: null,
    from: null,
    to: null,
    batchId: null,
    limit: 50,
  },
});

const defaultFilters = {
  actorEmail: "",
  from: "",
  to: "",
  questionTextLike: "",
};

afterEach(() => {
  cleanup();
  replaceMock.mockReset();
  fetchHistoryMock.mockReset();
});

describe("SchemaDiffHistoryPanel", () => {
  it("TC-C-01/TC-C-02: 履歴をカード形式で描画する", async () => {
    fetchHistoryMock.mockResolvedValue(
      okResp([
        item({ auditId: "row1", questionText: "Q-row1" }),
        item({ auditId: "row2", questionText: "Q-row2", createdAt: "2026-05-18T10:00:00Z" }),
      ]),
    );
    render(<SchemaDiffHistoryPanel initialFilters={defaultFilters} />);
    await waitFor(() => expect(screen.getByText("Q-row1")).toBeTruthy());
    expect(screen.getByText("Q-row2")).toBeTruthy();
    expect(
      screen
        .getAllByRole("listitem")
        .some((element) => element.className.includes("schema-history-card")),
    ).toBe(true);
    expect(screen.getAllByText("旧").length).toBeGreaterThan(0);
    expect(screen.getAllByText("新").length).toBeGreaterThan(0);
  });

  it("TC-C-03: actorEmail を入力して絞り込みすると URL に小文字化された値が反映される", async () => {
    fetchHistoryMock.mockResolvedValue(okResp([]));
    render(<SchemaDiffHistoryPanel initialFilters={defaultFilters} />);
    await waitFor(() => expect(fetchHistoryMock).toHaveBeenCalled());

    const emailInput = screen.getByLabelText("操作者 email") as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: "Foo@Example.COM" } });
    fireEvent.submit(emailInput.closest("form") as HTMLFormElement);

    expect(replaceMock).toHaveBeenCalled();
    const url = replaceMock.mock.calls[0][0] as string;
    expect(url).toContain("actorEmail=foo%40example.com");
  });

  it("TC-C-03c: questionTextLike は client-side filter で table 行を絞り込む", async () => {
    fetchHistoryMock.mockResolvedValue(
      okResp([
        item({ auditId: "row1", questionText: "alpha" }),
        item({ auditId: "row2", questionText: "beta" }),
      ]),
    );
    render(<SchemaDiffHistoryPanel initialFilters={{ ...defaultFilters, questionTextLike: "alp" }} />);
    await waitFor(() => expect(screen.getByText("alpha")).toBeTruthy());
    expect(screen.queryByText("beta")).toBeNull();
    // helper は questionTextLike を送らない
    const callArg = fetchHistoryMock.mock.calls[0][0] as Record<string, unknown>;
    expect(callArg.questionTextLike).toBeUndefined();
  });

  it("TC-C-04: nextCursor あり時は「次の 50 件」ボタンが enabled", async () => {
    fetchHistoryMock.mockResolvedValue(okResp([item({})], "next-abc"));
    render(<SchemaDiffHistoryPanel initialFilters={defaultFilters} />);
    await waitFor(() => expect(screen.getByText("氏名")).toBeTruthy());
    const btn = screen.getByRole("button", { name: /次の 50 件/ }) as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });

  it("TC-C-05a: 「次の 50 件」クリックで cursor 付き再 fetch", async () => {
    fetchHistoryMock
      .mockResolvedValueOnce(okResp([item({ auditId: "first", questionText: "first-q" })], "cur-1"))
      .mockResolvedValueOnce(okResp([item({ auditId: "second", questionText: "second-q" })], null));
    render(<SchemaDiffHistoryPanel initialFilters={defaultFilters} />);
    await waitFor(() => expect(screen.getByText("first-q")).toBeTruthy());

    const btn = screen.getByRole("button", { name: /次の 50 件/ });
    fireEvent.click(btn);
    await waitFor(() => expect(screen.getByText("second-q")).toBeTruthy());
    const secondCallArg = fetchHistoryMock.mock.calls[1][0] as { cursor?: string };
    expect(secondCallArg.cursor).toBe("cur-1");
  });

  it("TC-C-06: items 空配列で EmptyState を表示し pagination は描画しない", async () => {
    fetchHistoryMock.mockResolvedValue(okResp([]));
    render(<SchemaDiffHistoryPanel initialFilters={defaultFilters} />);
    await waitFor(() => expect(screen.getByText("該当する履歴がありません")).toBeTruthy());
    expect(screen.queryByRole("button", { name: /次の 50 件/ })).toBeNull();
  });

  it("TC-C-08a: 初回 fetch reject 時に role=alert で feedback", async () => {
    fetchHistoryMock.mockRejectedValue(new Error("net"));
    render(<SchemaDiffHistoryPanel initialFilters={defaultFilters} />);
    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    expect(screen.getByRole("alert").textContent).toContain("履歴の取得に失敗しました");
    expect(screen.getByRole("alert").textContent).not.toContain("net");
    expect(screen.getByRole("alert").className).toContain("schema-history-error");
  });

  it("TC-C-09a: Breadcrumb landmark が 管理 > フォーム項目 > 履歴 を含む", async () => {
    fetchHistoryMock.mockResolvedValue(okResp([]));
    render(<SchemaDiffHistoryPanel initialFilters={defaultFilters} />);
    const nav = screen.getByRole("navigation", { name: /breadcrumb/i });
    expect(nav.textContent).toMatch(/管理/);
    expect(nav.textContent).toMatch(/フォーム項目/);
    expect(nav.textContent).toMatch(/履歴/);
  });

  it("TC-C-10: 目的説明パネルに流れ 3 ステップと用語集を描画する", async () => {
    fetchHistoryMock.mockResolvedValue(okResp([]));
    render(<SchemaDiffHistoryPanel initialFilters={defaultFilters} />);
    expect(screen.getByTestId("schema-history-purpose-explainer")).toBeTruthy();
    expect(screen.getByText("この画面で分かること")).toBeTruthy();
    expect(screen.getByText("フォーム設問の変化を確認")).toBeTruthy();
    expect(screen.getByText("同じ意味の設問を紐付け")).toBeTruthy();
    expect(screen.getByText("解消済みの判断を監査")).toBeTruthy();
    expect(screen.getByText("stableKey")).toBeTruthy();
  });
});
