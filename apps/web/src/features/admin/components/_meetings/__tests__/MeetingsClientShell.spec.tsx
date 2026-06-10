import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MeetingsClientShell } from "../MeetingsClientShell";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const mutationMock = {
  trigger: vi.fn(),
  abort: vi.fn(),
  isPending: false,
};

vi.mock("@/features/admin/hooks/useAdminMutation", () => ({
  FetchAuthedError: class FetchAuthedError extends Error {
    constructor(
      readonly status: number,
      readonly bodyText: string,
    ) {
      super(bodyText);
    }
  },
  useAdminMutation: () => mutationMock,
}));

vi.mock("../../../hooks/useAdminMutation", () => ({
  useAdminMutation: () => mutationMock,
}));

const jsonResponse = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  mutationMock.trigger.mockReset();
});

describe("MeetingsClientShell", () => {
  it("開催日一覧に出席記録・編集の運用導線を表示する", () => {
    render(
      <MeetingsClientShell
        initial={{
          total: 1,
          items: [
            {
              sessionId: "sess-1",
              title: "第1回",
              heldOn: "2025-04-01",
              note: null,
              createdAt: "2025-01-01T00:00:00Z",
              attendance: [],
            },
          ],
        }}
        candidates={[]}
      />,
    );

    expect(screen.getByText("各開催日を選択すると出席を記録・編集できます")).toBeTruthy();
  });

  it("一括追加は committed:true の時だけ出席者 state を更新する", async () => {
    const fetchSpy = vi.fn().mockResolvedValue(
      jsonResponse(200, {
        ok: true,
        summary: {
          total: 2,
          ok: 2,
          duplicate: 0,
          deletedMember: 0,
          unknownMember: 0,
          invalid: 0,
        },
        rows: [],
        dryRun: false,
        committed: true,
      }),
    );
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    render(
      <MeetingsClientShell
        initial={{
          total: 1,
          items: [
            {
              sessionId: "sess-1",
              title: "第1回",
              heldOn: "2025-04-01",
              note: null,
              createdAt: "2025-01-01T00:00:00Z",
              attendance: [],
            },
          ],
        }}
        candidates={[
          { memberId: "m-1", fullName: "山田 太郎" },
          { memberId: "m-2", fullName: "佐藤 花子" },
        ]}
      />,
    );

    fireEvent.click(screen.getByLabelText("第1回（2025-04-01）の出席を記録・編集"));
    fireEvent.click(screen.getByRole("checkbox", { name: "山田 太郎 (m-1)" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "佐藤 花子 (m-2)" }));
    fireEvent.click(screen.getByTestId("bulk-add-attendance-sess-1"));

    await waitFor(() =>
      expect(screen.getByTestId("meeting-attendance-count-sess-1").textContent).toBe(
        "2 名出席",
      ),
    );
    expect(screen.getByText("2 名の出席を追加しました")).toBeTruthy();
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/admin/meetings/sess-1/attendance/import?dryRun=false",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ rows: [{ memberId: "m-1" }, { memberId: "m-2" }] }),
      }),
    );
  });

  it("一括追加が committed:false なら出席者 state を更新せず選択を保持する", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      jsonResponse(200, {
        ok: true,
        summary: {
          total: 1,
          ok: 0,
          duplicate: 1,
          deletedMember: 0,
          unknownMember: 0,
          invalid: 0,
        },
        rows: [],
        dryRun: false,
        committed: false,
      }),
    ) as unknown as typeof fetch;

    render(
      <MeetingsClientShell
        initial={{
          total: 1,
          items: [
            {
              sessionId: "sess-1",
              title: "第1回",
              heldOn: "2025-04-01",
              note: null,
              createdAt: "2025-01-01T00:00:00Z",
              attendance: [],
            },
          ],
        }}
        candidates={[{ memberId: "m-1", fullName: "山田 太郎" }]}
      />,
    );

    fireEvent.click(screen.getByLabelText("第1回（2025-04-01）の出席を記録・編集"));
    const checkbox = screen.getByRole("checkbox", {
      name: "山田 太郎 (m-1)",
    }) as HTMLInputElement;
    fireEvent.click(checkbox);
    fireEvent.click(screen.getByTestId("bulk-add-attendance-sess-1"));

    await waitFor(() =>
      expect(screen.getByText("一括追加できませんでした（出席済 1）")).toBeTruthy(),
    );
    expect(screen.getByTestId("meeting-attendance-count-sess-1").textContent).toBe(
      "出席 未登録",
    );
    expect(checkbox.checked).toBe(true);
  });

  it("一括追加の通信失敗時は出席者 state を更新せず選択を保持する", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("network down")) as unknown as typeof fetch;

    render(
      <MeetingsClientShell
        initial={{
          total: 1,
          items: [
            {
              sessionId: "sess-1",
              title: "第1回",
              heldOn: "2025-04-01",
              note: null,
              createdAt: "2025-01-01T00:00:00Z",
              attendance: [],
            },
          ],
        }}
        candidates={[{ memberId: "m-1", fullName: "山田 太郎" }]}
      />,
    );

    fireEvent.click(screen.getByLabelText("第1回（2025-04-01）の出席を記録・編集"));
    const checkbox = screen.getByRole("checkbox", {
      name: "山田 太郎 (m-1)",
    }) as HTMLInputElement;
    fireEvent.click(checkbox);
    fireEvent.click(screen.getByTestId("bulk-add-attendance-sess-1"));

    await waitFor(() => expect(screen.getByText("一括追加に失敗: network down")).toBeTruthy());
    expect(screen.getByTestId("meeting-attendance-count-sess-1").textContent).toBe(
      "出席 未登録",
    );
    expect(checkbox.checked).toBe(true);
  });
});
