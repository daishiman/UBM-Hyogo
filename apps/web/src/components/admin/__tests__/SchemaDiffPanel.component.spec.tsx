// 06c: SchemaDiffPanel — added/changed/removed/unresolved の 4 ペイン分類 + alias 割当
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor, fireEvent, act } from "@testing-library/react";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock, push: () => {} }),
}));

const postSchemaAliasMock = vi.fn();
const rollbackSchemaAliasMock = vi.fn();
vi.mock("../../../lib/admin/api", async () => {
  const actual =
    await vi.importActual<typeof import("../../../lib/admin/api")>(
      "../../../lib/admin/api",
    );
  return {
    ...actual,
    postSchemaAlias: (...args: unknown[]) => postSchemaAliasMock(...args),
    rollbackSchemaAlias: (...args: unknown[]) => rollbackSchemaAliasMock(...args),
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
  rollbackSchemaAliasMock.mockReset();
});

beforeEach(() => {
  postSchemaAliasMock.mockResolvedValue({
    ok: true,
    status: 200,
    data: {
      ok: true,
      mode: "apply",
      confirmed: true,
      backfill: { status: "completed" },
    },
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
    expect(screen.getAllByRole("table").length).toBe(4);
    expect(screen.getAllByRole("columnheader", { name: "質問" }).length).toBe(4);
    expect(screen.getAllByText("未解決").length).toBeGreaterThan(0);
    expect(screen.queryByText("queued")).toBeNull();
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
    expect(document.activeElement).toBe(input);
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
      data: {
        ok: false,
        code: "stable_key_collision",
        error: "stableKey collision",
        existingQuestionIds: ["q-existing"],
      },
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
      expect(alert.textContent).toContain("q-existing");
      expect(alert.getAttribute("data-feedback-kind")).toBe("validation_error");
    });
    expect(screen.getByRole("form", { name: "stableKey alias 割当" })).toBeTruthy();
  });

  it("UI-04 409 conflict: alert で「他の操作と競合」を含む", async () => {
    postSchemaAliasMock.mockResolvedValueOnce({
      ok: false,
      status: 409,
      error: "version mismatch",
      data: {
        ok: false,
        error: "alias already assigned",
        existingStableKey: "full_name",
      },
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
      expect(alert.textContent).toContain("full_name");
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

  it("UI-06 client-side regex validation: 不正な stableKey で submit すると postSchemaAlias を呼ばず validation_error feedback", async () => {
    render(
      <SchemaDiffPanel
        initial={{
          total: 1,
          items: [item({ diffId: "d-rx", questionId: "q-rx", label: "lbl-rx" })],
        }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /lbl-rx/ }));
    const input = screen.getByLabelText(/新しい stableKey/) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "1bad-key" } });

    const submit = screen.getByRole("button", { name: "割当" }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    expect(input.getAttribute("aria-invalid")).toBe("true");

    fireEvent.submit(input.closest("form")!);
    expect(postSchemaAliasMock).not.toHaveBeenCalled();

    await waitFor(() => {
      const alert = screen.getByRole("alert");
      expect(alert.getAttribute("data-feedback-kind")).toBe("validation_error");
      expect(alert.textContent).toContain("stableKey");
      expect(input.getAttribute("aria-describedby")).toContain(
        "schema-alias-validation-feedback",
      );
    });

    fireEvent.change(input, { target: { value: "good_key" } });
    expect(input.getAttribute("aria-invalid")).toBe("false");
    expect(submit.disabled).toBe(false);
  });

  // Issue #778: rollback / undo
  const resolvedAlias = (over: Partial<{
    id: string;
    stableKey: string;
    aliasLabel: string;
    aliasQuestionId: string;
    version: number;
  }> = {}) => ({
    id: "alias-1",
    revisionId: "rev1",
    stableKey: "full_name",
    aliasQuestionId: "q1",
    aliasLabel: "Full name",
    resolvedAt: "2026-05-19T00:00:00.000Z",
    resolvedBy: "admin@example.com",
    version: 1,
    ...over,
  });

  it("rollback: history rollback button → modal → 確定で rollbackSchemaAlias 呼出", async () => {
    rollbackSchemaAliasMock.mockResolvedValueOnce({
      aliasId: "alias-1",
      rolledBackAt: "2026-05-19T01:00:00.000Z",
      relatedAuditId: "aud-1",
      newVersion: 2,
      impact: { affectedResponseCount: 3, recomputeRequired: true },
    });
    render(
      <SchemaDiffPanel
        initial={{ total: 0, items: [] }}
        resolvedAliases={[
          resolvedAlias({
            id: "alias-1",
          }),
        ]}
        actorEmail="admin@example.com"
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /alias Full name の resolve を取り消す/ }),
    );
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByRole("dialog").textContent).toContain("未取得");
    fireEvent.click(screen.getByRole("button", { name: /^取り消す$/ }));
    await waitFor(() => {
      expect(rollbackSchemaAliasMock).toHaveBeenCalledWith({
        aliasId: "alias-1",
        version: 1,
      });
    });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(screen.getByRole("status").textContent).toContain("resolve を取消しました");
      expect(screen.getByRole("status").textContent).toContain("3");
    });
    expect(refreshMock).toHaveBeenCalled();
  });

  it("rollback modal キャンセル: rollbackSchemaAlias は呼ばれず modal が閉じる", () => {
    render(
      <SchemaDiffPanel
        initial={{ total: 0, items: [] }}
        resolvedAliases={[resolvedAlias({ id: "alias-2" })]}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /alias Full name の resolve を取り消す/ }),
    );
    expect(screen.getByRole("dialog")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(rollbackSchemaAliasMock).not.toHaveBeenCalled();
  });

  it("rollback 失敗 409: modal 内に error 表示し閉じない", async () => {
    const { RollbackApiError } = await vi.importActual<
      typeof import("../../../lib/admin/api")
    >("../../../lib/admin/api");
    rollbackSchemaAliasMock.mockRejectedValueOnce(
      new RollbackApiError(409, "version_mismatch", "race detected"),
    );
    render(
      <SchemaDiffPanel
        initial={{ total: 0, items: [] }}
        resolvedAliases={[resolvedAlias({ id: "alias-3" })]}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /alias Full name の resolve を取り消す/ }),
    );
    fireEvent.click(screen.getByRole("button", { name: /^取り消す$/ }));
    await waitFor(() => {
      const alert = screen
        .getByRole("dialog")
        .querySelector('[data-role="modal-error"]');
      expect(alert?.textContent).toContain("409");
      expect(alert?.textContent).toContain("race detected");
    });
    expect(screen.queryByRole("dialog")).not.toBeNull();
  });

  it("undo toast: resolve 成功直後に UndoToast を表示し、押下で rollback を呼ぶ", async () => {
    postSchemaAliasMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      data: {
        ok: true,
        mode: "apply",
        confirmed: true,
        alias: {
          id: "alias-u",
          revisionId: "r1",
          aliasQuestionId: "q-u",
          aliasLabel: "lbl-u",
          resolvedAt: "2026-05-19T02:00:00.000Z",
          resolvedBy: "admin@example.com",
          version: 4,
        },
        backfill: { status: "completed" },
      },
    });
    rollbackSchemaAliasMock.mockResolvedValueOnce({
      aliasId: "alias-u",
      rolledBackAt: "2026-05-19T02:00:00.000Z",
      relatedAuditId: null,
      newVersion: 2,
      impact: { affectedResponseCount: 0, recomputeRequired: false },
    });
    render(
      <SchemaDiffPanel
        initial={{
          total: 1,
          items: [item({ diffId: "d-u", questionId: "q-u", label: "lbl-u" })],
        }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /lbl-u/ }));
    fireEvent.change(screen.getByLabelText(/新しい stableKey/), {
      target: { value: "ukey" },
    });
    fireEvent.click(screen.getByRole("button", { name: "割当" }));
    await waitFor(() => {
      const toast = document.querySelector('[data-component="undo-toast"]');
      expect(toast).not.toBeNull();
      expect(toast?.textContent).toContain("取消");
      expect(toast?.getAttribute("role")).toBe("status");
    });
    fireEvent.click(screen.getByRole("button", { name: /alias lbl-u の割当を取消す/ }));
    await waitFor(() => {
      expect(rollbackSchemaAliasMock).toHaveBeenCalledWith({
        aliasId: "alias-u",
        version: 4,
      });
    });
  });

  it("undo toast: 5分を過ぎると非表示になり rollback を呼べない", async () => {
    vi.useFakeTimers();
    postSchemaAliasMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      data: {
        ok: true,
        mode: "apply",
        confirmed: true,
        alias: {
          id: "alias-exp",
          revisionId: "r1",
          aliasQuestionId: "q-exp",
          aliasLabel: "lbl-exp",
          resolvedAt: "2026-05-19T02:00:00.000Z",
          resolvedBy: "admin@example.com",
          version: 1,
        },
        backfill: { status: "completed" },
      },
    });
    try {
      render(
        <SchemaDiffPanel
          initial={{
            total: 1,
            items: [item({ diffId: "d-exp", questionId: "q-exp", label: "lbl-exp" })],
          }}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: /lbl-exp/ }));
      fireEvent.change(screen.getByLabelText(/新しい stableKey/), {
        target: { value: "exp_key" },
      });
      fireEvent.click(screen.getByRole("button", { name: "割当" }));
      await act(async () => {
        await Promise.resolve();
      });
      expect(document.querySelector('[data-component="undo-toast"]')).not.toBeNull();
      await act(async () => {
        vi.advanceTimersByTime(5 * 60 * 1000 + 1);
      });
      expect(document.querySelector('[data-component="undo-toast"]')).toBeNull();
      expect(rollbackSchemaAliasMock).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
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
