import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BulkAttendanceChecklist } from "../BulkAttendanceChecklist";

afterEach(() => cleanup());

describe("BulkAttendanceChecklist", () => {
  it("複数会員を選択して一括追加し、commit 成功時だけ選択解除する", async () => {
    const onBulkAddAttendance = vi.fn().mockResolvedValue(true);
    render(
      <BulkAttendanceChecklist
        sessionId="sess-1"
        candidates={[
          { memberId: "m-1", fullName: "山田 太郎" },
          { memberId: "m-2", fullName: "佐藤 花子" },
        ]}
        attended={new Set()}
        onBulkAddAttendance={onBulkAddAttendance}
        onOpenModal={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "山田 太郎 (m-1)" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "佐藤 花子 (m-2)" }));
    fireEvent.click(screen.getByTestId("bulk-add-attendance-sess-1"));

    await waitFor(() =>
      expect(onBulkAddAttendance).toHaveBeenCalledWith(["m-1", "m-2"]),
    );
    expect(
      (screen.getByRole("checkbox", { name: "山田 太郎 (m-1)" }) as HTMLInputElement).checked,
    ).toBe(false);
  });

  it("commit 失敗時は選択を保持する", async () => {
    const onBulkAddAttendance = vi.fn().mockResolvedValue(false);
    render(
      <BulkAttendanceChecklist
        sessionId="sess-1"
        candidates={[{ memberId: "m-1", fullName: "山田 太郎" }]}
        attended={new Set()}
        onBulkAddAttendance={onBulkAddAttendance}
        onOpenModal={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "山田 太郎 (m-1)" }));
    fireEvent.click(screen.getByTestId("bulk-add-attendance-sess-1"));

    await waitFor(() => expect(onBulkAddAttendance).toHaveBeenCalled());
    expect(
      (screen.getByRole("checkbox", { name: "山田 太郎 (m-1)" }) as HTMLInputElement).checked,
    ).toBe(true);
  });
});
