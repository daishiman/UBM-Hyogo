import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BulkAttendanceModal } from "../BulkAttendanceModal";

afterEach(() => cleanup());

const CANDIDATES = [
  { memberId: "m-1", fullName: "山田 太郎" },
  { memberId: "m-2", fullName: "佐藤 花子" },
  { memberId: "m-3", fullName: "鈴木 一郎" },
];

describe("BulkAttendanceModal", () => {
  it("open=false の時は何も描画しない", () => {
    render(
      <BulkAttendanceModal
        open={false}
        sessionId="sess-1"
        candidates={CANDIDATES}
        attended={new Set()}
        onClose={vi.fn()}
        onBulkAddAttendance={vi.fn().mockResolvedValue(true)}
      />,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("出席済会員は候補に出さず未出席のみ選択対象にする（AC-4 / AC-9 hook 共有）", () => {
    render(
      <BulkAttendanceModal
        open
        sessionId="sess-1"
        candidates={CANDIDATES}
        attended={new Set(["m-2"])}
        onClose={vi.fn()}
        onBulkAddAttendance={vi.fn().mockResolvedValue(true)}
      />,
    );
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "山田 太郎 (m-1)" })).toBeTruthy();
    expect(screen.queryByRole("checkbox", { name: "佐藤 花子 (m-2)" })).toBeNull();
    expect(screen.getByRole("checkbox", { name: "鈴木 一郎 (m-3)" })).toBeTruthy();
  });

  it("検索で絞り込み・全選択・一括追加し、commit 成功時に選択解除して閉じる（AC-8）", async () => {
    const onBulkAddAttendance = vi.fn().mockResolvedValue(true);
    const onClose = vi.fn();
    render(
      <BulkAttendanceModal
        open
        sessionId="sess-1"
        candidates={CANDIDATES}
        attended={new Set()}
        onClose={onClose}
        onBulkAddAttendance={onBulkAddAttendance}
      />,
    );

    // 検索で「山田」のみに絞り込む
    fireEvent.change(screen.getByPlaceholderText("氏名または会員IDで検索"), {
      target: { value: "山田" },
    });
    expect(screen.getByRole("checkbox", { name: "山田 太郎 (m-1)" })).toBeTruthy();
    expect(screen.queryByRole("checkbox", { name: "佐藤 花子 (m-2)" })).toBeNull();

    // 表示中を全選択 → 絞り込み中の m-1 のみが選択される
    fireEvent.click(screen.getByRole("button", { name: "表示中を全選択" }));
    fireEvent.click(screen.getByRole("button", { name: /一括追加/ }));

    await waitFor(() =>
      expect(onBulkAddAttendance).toHaveBeenCalledWith(["m-1"]),
    );
    expect(onBulkAddAttendance).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it("commit 失敗時は閉じず選択を保持する（AC-7 / AC-9 hook 共有）", async () => {
    const onBulkAddAttendance = vi.fn().mockResolvedValue(false);
    const onClose = vi.fn();
    render(
      <BulkAttendanceModal
        open
        sessionId="sess-1"
        candidates={CANDIDATES}
        attended={new Set()}
        onClose={onClose}
        onBulkAddAttendance={onBulkAddAttendance}
      />,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "山田 太郎 (m-1)" }));
    fireEvent.click(screen.getByRole("button", { name: /一括追加/ }));

    await waitFor(() => expect(onBulkAddAttendance).toHaveBeenCalledWith(["m-1"]));
    expect(onClose).not.toHaveBeenCalled();
    expect(
      (screen.getByRole("checkbox", { name: "山田 太郎 (m-1)" }) as HTMLInputElement).checked,
    ).toBe(true);
  });

  it("閉じるボタンで onClose を呼ぶ", () => {
    const onClose = vi.fn();
    render(
      <BulkAttendanceModal
        open
        sessionId="sess-1"
        candidates={CANDIDATES}
        attended={new Set()}
        onClose={onClose}
        onBulkAddAttendance={vi.fn().mockResolvedValue(true)}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "閉じる" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
