// 06c: SchemaDiffPanel — added/changed/removed/unresolved の 4 ペイン分類 + alias 割当
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor, fireEvent } from "@testing-library/react";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock, push: () => {} }),
}));

const postSchemaAliasMock = vi.fn();
vi.mock("../../../lib/admin/api", () => ({
  postSchemaAlias: (...args: unknown[]) => postSchemaAliasMock(...args),
}));

import { SchemaDiffPanel } from "../SchemaDiffPanel";

const item = (
  over: Partial<{
    type: "added" | "changed" | "removed" | "unresolved";
    label: string;
    diffId: string;
    questionId: string | null;
    stableKey: string | null;
    suggestedStableKey: string | null;
  }>,
) => ({
  diffId: "d1",
  revisionId: "r1",
  type: "added" as const,
  questionId: "q1" as string | null,
  stableKey: null as string | null,
  label: "Q",
  suggestedStableKey: null as string | null,
  status: "queued" as const,
  resolvedBy: null,
  resolvedAt: null,
  createdAt: "2026-01-01T00:00:00Z",
  ...over,
});

afterEach(() => {
  cleanup();
  refreshMock.mockReset();
  postSchemaAliasMock.mockReset();
});

beforeEach(() => {
  postSchemaAliasMock.mockResolvedValue({ ok: true, status: 200 });
});

describe("SchemaDiffPanel", () => {
  it("happy: 4 ペインに分類して見出しと total を表示する", () => {
    render(
      <SchemaDiffPanel
        initial={{
          total: 4,
          items: [
            item({ diffId: "a", type: "added", label: "added-1" }),
            item({ diffId: "b", type: "changed", label: "changed-1" }),
            item({ diffId: "c", type: "removed", label: "removed-1" }),
            item({ diffId: "d", type: "unresolved", label: "unresolved-1" }),
          ],
        }}
      />,
    );
    expect(screen.getByText("added-1")).toBeTruthy();
    expect(screen.getByText("changed-1")).toBeTruthy();
    expect(screen.getByText("removed-1")).toBeTruthy();
    expect(screen.getByText("unresolved-1")).toBeTruthy();
    expect(screen.getByText("4 件")).toBeTruthy();
  });

  it("empty: items=[] で各ペインに「なし」表示、total=0", () => {
    render(<SchemaDiffPanel initial={{ total: 0, items: [] }} />);
    expect(screen.getByText("0 件")).toBeTruthy();
    const empties = screen.getAllByText("なし");
    expect(empties.length).toBe(4);
  });

  it("mutation 成功: 割当→postSchemaAlias 呼出、toast/refresh、form クローズ", async () => {
    render(
      <SchemaDiffPanel
        initial={{
          total: 1,
          items: [item({ diffId: "d-x", questionId: "q-x", label: "lbl-x" })],
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /lbl-x/ }));
    expect(screen.getByRole("form", { name: "stableKey alias 割当" })).toBeTruthy();

    const input = screen.getByLabelText(/新しい stableKey/) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "new_key" } });
    fireEvent.click(screen.getByRole("button", { name: "割当" }));

    await waitFor(() => {
      expect(postSchemaAliasMock).toHaveBeenCalledWith({
        diffId: "d-x",
        questionId: "q-x",
        stableKey: "new_key",
      });
    });
    expect(screen.getByRole("status").textContent).toContain("alias を割当てました");
    expect(refreshMock).toHaveBeenCalled();
    expect(screen.queryByRole("form", { name: "stableKey alias 割当" })).toBeNull();
  });

  it("mutation 失敗 (authz-fail): 403 forbidden で失敗 toast、form は閉じない", async () => {
    postSchemaAliasMock.mockResolvedValueOnce({
      ok: false,
      status: 403,
      error: "forbidden",
    });
    render(
      <SchemaDiffPanel
        initial={{
          total: 1,
          items: [item({ diffId: "d-y", questionId: "q-y", label: "lbl-y" })],
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /lbl-y/ }));
    fireEvent.change(screen.getByLabelText(/新しい stableKey/), {
      target: { value: "k" },
    });
    fireEvent.click(screen.getByRole("button", { name: "割当" }));

    await waitFor(() => {
      expect(screen.getByRole("status").textContent).toContain("失敗: forbidden");
    });
    expect(refreshMock).not.toHaveBeenCalled();
    expect(screen.getByRole("form", { name: "stableKey alias 割当" })).toBeTruthy();
  });

  it("questionId が null の diff: alias 割当不可の alert を表示", () => {
    render(
      <SchemaDiffPanel
        initial={{
          total: 1,
          items: [
            item({
              diffId: "d-n",
              questionId: null,
              type: "removed",
              label: "lbl-removed",
            }),
          ],
        }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /lbl-removed/ }));
    expect(screen.getByRole("alert").textContent).toContain("alias 割当はできません");
    expect(screen.queryByRole("form", { name: "stableKey alias 割当" })).toBeNull();
  });

  it("「閉じる」ボタンで form がクローズされる", () => {
    render(
      <SchemaDiffPanel
        initial={{
          total: 1,
          items: [item({ diffId: "d-c", questionId: "q-c", label: "lbl-c" })],
        }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /lbl-c/ }));
    expect(screen.getByRole("form", { name: "stableKey alias 割当" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "閉じる" }));
    expect(screen.queryByRole("form", { name: "stableKey alias 割当" })).toBeNull();
  });

  it("suggestedStableKey が input の初期値として設定される", () => {
    render(
      <SchemaDiffPanel
        initial={{
          total: 1,
          items: [
            item({
              diffId: "d-s",
              questionId: "q-s",
              label: "lbl-s",
              suggestedStableKey: "suggested_key",
            }),
          ],
        }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /lbl-s/ }));
    const input = screen.getByLabelText(/新しい stableKey/) as HTMLInputElement;
    expect(input.value).toBe("suggested_key");
  });
});
