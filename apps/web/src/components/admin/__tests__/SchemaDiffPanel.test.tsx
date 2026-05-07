// 06c: SchemaDiffPanel — added/changed/removed/unresolved の 4 ペイン分類 + alias 割当
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor, fireEvent } from "@testing-library/react";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock, push: () => {} }),
}));

const postSchemaAliasMock = vi.fn();
vi.mock("../../../lib/admin/api", async () => {
  const actual =
    await vi.importActual<typeof import("../../../lib/admin/api")>(
      "../../../lib/admin/api",
    );
  return {
    ...actual,
    postSchemaAlias: (...args: unknown[]) => postSchemaAliasMock(...args),
  };
});

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
  postSchemaAliasMock.mockResolvedValue({
    ok: true,
    status: 200,
    data: { ok: true, mode: "apply", confirmed: true, backfill: { status: "completed" } },
  });
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
    await waitFor(() => {
      expect(screen.getByRole("status").textContent).toContain("alias を割当てました");
      expect(refreshMock).toHaveBeenCalled();
      expect(screen.queryByRole("form", { name: "stableKey alias 割当" })).toBeNull();
    });
  });

  it("mutation 失敗 (authz-fail): 403 forbidden で role=alert、form は閉じない", async () => {
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
      expect(screen.getByRole("alert").textContent).toContain("失敗: forbidden");
    });
    expect(refreshMock).not.toHaveBeenCalled();
    expect(screen.getByRole("form", { name: "stableKey alias 割当" })).toBeTruthy();
  });

  it("UI-02 retryable continuation: status で「Back-fill 再試行可能」と補助文を表示し、form は開いたまま", async () => {
    postSchemaAliasMock.mockResolvedValueOnce({
      ok: true,
      status: 202,
      data: {
        ok: true,
        mode: "apply",
        confirmed: true,
        backfill: {
          status: "exhausted",
          retryable: true,
          code: "backfill_cpu_budget_exhausted",
        },
      },
    });
    render(
      <SchemaDiffPanel
        initial={{
          total: 1,
          items: [item({ diffId: "d-r", questionId: "q-r", label: "lbl-r" })],
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /lbl-r/ }));
    fireEvent.change(screen.getByLabelText(/新しい stableKey/), {
      target: { value: "k_r" },
    });
    fireEvent.click(screen.getByRole("button", { name: "割当" }));

    await waitFor(() => {
      const status = screen.getByRole("status");
      expect(status.textContent).toContain("Back-fill 再試行可能");
      expect(status.textContent).toContain("続きから処理");
      expect(status.getAttribute("data-feedback-kind")).toBe("retryable");
    });
    expect(refreshMock).not.toHaveBeenCalled();
    expect(screen.getByRole("form", { name: "stableKey alias 割当" })).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: "割当" }) as HTMLButtonElement).disabled,
    ).toBe(false);
  });

  it("UI-03 422 validation error: alert で「入力内容に誤り」を含む", async () => {
    postSchemaAliasMock.mockResolvedValueOnce({
      ok: false,
      status: 422,
      error: "invalid",
    });
    render(
      <SchemaDiffPanel
        initial={{
          total: 1,
          items: [item({ diffId: "d-v", questionId: "q-v", label: "lbl-v" })],
        }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /lbl-v/ }));
    fireEvent.change(screen.getByLabelText(/新しい stableKey/), {
      target: { value: "k" },
    });
    fireEvent.click(screen.getByRole("button", { name: "割当" }));

    await waitFor(() => {
      const alert = screen.getByRole("alert");
      expect(alert.textContent).toContain("入力内容に誤り");
      expect(alert.getAttribute("data-feedback-kind")).toBe("validation_error");
    });
    expect(screen.getByRole("form", { name: "stableKey alias 割当" })).toBeTruthy();
  });

  it("UI-04 409 conflict: alert で「他の操作と競合」を含む", async () => {
    postSchemaAliasMock.mockResolvedValueOnce({
      ok: false,
      status: 409,
      error: "version mismatch",
    });
    render(
      <SchemaDiffPanel
        initial={{
          total: 1,
          items: [item({ diffId: "d-cf", questionId: "q-cf", label: "lbl-cf" })],
        }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /lbl-cf/ }));
    fireEvent.change(screen.getByLabelText(/新しい stableKey/), {
      target: { value: "k" },
    });
    fireEvent.click(screen.getByRole("button", { name: "割当" }));

    await waitFor(() => {
      const alert = screen.getByRole("alert");
      expect(alert.textContent).toContain("他の操作と競合");
      expect(alert.getAttribute("data-feedback-kind")).toBe("conflict_error");
    });
  });

  it("UI-05 retryable 後に再 submit→200 success: retryable label が消え success label が出る", async () => {
    postSchemaAliasMock
      .mockResolvedValueOnce({
        ok: true,
        status: 202,
        data: {
          ok: true,
          mode: "apply",
          confirmed: true,
          backfill: {
            status: "exhausted",
            retryable: true,
            code: "backfill_cpu_budget_exhausted",
          },
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        data: {
          ok: true,
          mode: "apply",
          confirmed: true,
          backfill: { status: "completed" },
        },
      });

    render(
      <SchemaDiffPanel
        initial={{
          total: 1,
          items: [item({ diffId: "d-rt", questionId: "q-rt", label: "lbl-rt" })],
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /lbl-rt/ }));
    fireEvent.change(screen.getByLabelText(/新しい stableKey/), {
      target: { value: "k_rt" },
    });
    fireEvent.click(screen.getByRole("button", { name: "割当" }));

    await waitFor(() => {
      expect(screen.getByRole("status").textContent).toContain("Back-fill 再試行可能");
    });

    fireEvent.click(screen.getByRole("button", { name: "割当" }));

    await waitFor(() => {
      expect(screen.getByRole("status").textContent).toContain("alias を割当てました");
    });
    expect(refreshMock).toHaveBeenCalled();
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
