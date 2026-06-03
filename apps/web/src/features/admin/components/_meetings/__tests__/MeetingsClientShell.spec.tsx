import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
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

afterEach(() => cleanup());

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
});
