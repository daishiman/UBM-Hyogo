// step-07: RequestConfirmDialog tests
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RequestConfirmDialog } from "../RequestConfirmDialog";

afterEach(() => cleanup());

beforeEach(() => {
  if (typeof HTMLDialogElement !== "undefined") {
    HTMLDialogElement.prototype.showModal = function () {
      this.setAttribute("open", "");
      (this as { open: boolean }).open = true;
    };
    HTMLDialogElement.prototype.close = function () {
      this.removeAttribute("open");
      (this as { open: boolean }).open = false;
    };
  }
});

describe("RequestConfirmDialog", () => {
  it("TC-C-01: open=true で showModal を呼ぶ", () => {
    const showModal = vi.spyOn(HTMLDialogElement.prototype, "showModal");
    render(
      <RequestConfirmDialog
        kind="approve"
        open={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        busy={false}
      />,
    );
    expect(showModal).toHaveBeenCalled();
    showModal.mockRestore();
  });

  it("TC-C-02: kind=null は何もレンダリングしない", () => {
    const { container } = render(
      <RequestConfirmDialog
        kind={null}
        open={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        busy={false}
      />,
    );
    expect(container.querySelector("dialog")).toBeNull();
  });

  it("TC-C-03: cancel ボタンで onClose 呼び出し", () => {
    const onClose = vi.fn();
    render(
      <RequestConfirmDialog
        kind="approve"
        open={true}
        onClose={onClose}
        onSubmit={vi.fn()}
        busy={false}
      />,
    );
    fireEvent.click(screen.getByText("キャンセル"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("TC-C-04: reject + 空 note で validation error 表示・onSubmit 非呼出", () => {
    const onSubmit = vi.fn();
    render(
      <RequestConfirmDialog
        kind="reject"
        open={true}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        busy={false}
      />,
    );
    fireEvent.click(screen.getByText("却下を実行"));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("却下理由を入力してください")).toBeDefined();
  });

  it("TC-C-05: reject + note 入力で onSubmit(note) を呼ぶ", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <RequestConfirmDialog
        kind="reject"
        open={true}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        busy={false}
      />,
    );
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "理由テキスト" },
    });
    fireEvent.click(screen.getByText("却下を実行"));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith("理由テキスト"));
  });

  it("TC-C-06: approve + 空 note でも onSubmit('') を呼ぶ", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <RequestConfirmDialog
        kind="approve"
        open={true}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        busy={false}
      />,
    );
    fireEvent.click(screen.getByText("承認を実行"));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(""));
  });

  it("TC-C-07: isDestructive=true で destructiveMessage を alert として表示", () => {
    render(
      <RequestConfirmDialog
        kind="approve"
        open={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        busy={false}
        isDestructive={true}
        destructiveMessage="この操作は取り消しできません。"
      />,
    );
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("この操作は取り消しできません");
  });

  it("TC-C-08: busy=true で submit/cancel が disabled", () => {
    render(
      <RequestConfirmDialog
        kind="approve"
        open={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        busy={true}
      />,
    );
    expect((screen.getByText("承認を実行") as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect((screen.getByText("キャンセル") as HTMLButtonElement).disabled).toBe(
      true,
    );
  });

  it("TC-C-08b: isDestructive=false でも destructiveMessage を説明文として表示", () => {
    render(
      <RequestConfirmDialog
        kind="approve"
        open={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        busy={false}
        destructiveMessage="公開状態を 公開 → 非公開 に変更します。"
      />,
    );
    expect(screen.getByText("公開状態を 公開 → 非公開 に変更します。")).toBeDefined();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("TC-C-09: open=false で dialog.close を呼ぶ", () => {
    const closeSpy = vi.spyOn(HTMLDialogElement.prototype, "close");
    const { rerender } = render(
      <RequestConfirmDialog
        kind="approve"
        open={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        busy={false}
      />,
    );
    closeSpy.mockClear();
    rerender(
      <RequestConfirmDialog
        kind="approve"
        open={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        busy={false}
      />,
    );
    expect(closeSpy).toHaveBeenCalled();
    closeSpy.mockRestore();
  });

  it("TC-C-10: data-destructive 属性が dialog に付与される", () => {
    const { container } = render(
      <RequestConfirmDialog
        kind="approve"
        open={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        busy={false}
        isDestructive={true}
      />,
    );
    expect(
      container.querySelector('dialog[data-destructive="true"]'),
    ).not.toBeNull();
  });
});
