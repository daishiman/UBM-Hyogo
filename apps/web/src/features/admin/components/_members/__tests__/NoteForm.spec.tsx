// serial-05-step-01: NoteForm unit tests
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";

const triggerMock = vi.fn();
vi.mock("../../../hooks", () => ({
  useAdminMutation: (
    endpoint: string,
    method: string,
    options?: { onSuccess?: () => void | Promise<void> },
  ) => ({
    trigger: async (payload: unknown) => {
      const r = await triggerMock(endpoint, method, payload);
      await options?.onSuccess?.();
      return r;
    },
    isLoading: false,
    error: null,
  }),
}));

import { NoteForm } from "../NoteForm";

afterEach(() => cleanup());
beforeEach(() => triggerMock.mockReset());

describe("NoteForm", () => {
  it("TC-10: 新規作成は POST /notes に body を送る", async () => {
    triggerMock.mockResolvedValue({ ok: true });
    render(<NoteForm memberId="m1" />);
    fireEvent.change(screen.getByLabelText("メモ本文"), {
      target: { value: "hello" },
    });
    fireEvent.click(screen.getByRole("button", { name: "追加" }));
    await waitFor(() =>
      expect(triggerMock).toHaveBeenCalledWith(
        "/api/admin/members/m1/notes",
        "POST",
        { body: "hello" },
      ),
    );
  });

  it("TC-11: noteId 指定で PATCH /notes/:noteId", async () => {
    triggerMock.mockResolvedValue({ ok: true });
    render(<NoteForm memberId="m1" noteId="n1" initialBody="prev" />);
    fireEvent.click(screen.getByRole("button", { name: "更新" }));
    await waitFor(() =>
      expect(triggerMock).toHaveBeenCalledWith(
        "/api/admin/members/m1/notes/n1",
        "PATCH",
        { body: "prev" },
      ),
    );
  });

  it("TC-12: empty body で validation error", async () => {
    render(<NoteForm memberId="m1" />);
    fireEvent.click(screen.getByRole("button", { name: "追加" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/本文は必須です/);
    expect(triggerMock).not.toHaveBeenCalled();
  });

  it("TC-13: 2001 文字以上で validation error", async () => {
    render(<NoteForm memberId="m1" />);
    const long = "a".repeat(2001);
    const ta = screen.getByLabelText("メモ本文") as HTMLTextAreaElement;
    // textarea has maxLength=2000 but client validation also defends — bypass via direct set
    Object.defineProperty(ta, "value", { value: long, configurable: true });
    fireEvent.change(ta, { target: { value: long } });
    fireEvent.click(screen.getByRole("button", { name: "追加" }));
    await waitFor(() => {
      const alert = screen.queryByRole("alert");
      expect(alert?.textContent ?? "").toMatch(/2000文字|必須/);
    });
  });

  it("TC-14: onCancel が click で発火する", () => {
    const onCancel = vi.fn();
    render(<NoteForm memberId="m1" onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("TC-15: 成功時に onSuccess が呼ばれる", async () => {
    triggerMock.mockResolvedValue({ ok: true });
    const onSuccess = vi.fn();
    render(<NoteForm memberId="m1" onSuccess={onSuccess} />);
    fireEvent.change(screen.getByLabelText("メモ本文"), {
      target: { value: "hi" },
    });
    fireEvent.click(screen.getByRole("button", { name: "追加" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
  });
});
