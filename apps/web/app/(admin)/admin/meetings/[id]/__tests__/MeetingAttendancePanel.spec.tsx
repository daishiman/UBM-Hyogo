// serial-05 step-06: MeetingAttendancePanel tests (Phase 4 A1-A8)
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MeetingAttendancePanel } from "../MeetingAttendancePanel";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("../../../../../../src/lib/logger", () => {
  const child = vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child,
  }));
  return {
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      child,
    },
  };
});

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const detail = {
  sessionId: "s1",
  title: "5月例会",
  heldOn: "2026-05-10",
  candidates: [
    { memberId: "m1", fullName: "山田" },
    { memberId: "m2", fullName: "佐藤" },
    { memberId: "m3", fullName: "削除済", isDeleted: true },
  ],
  attendees: [{ memberId: "m2" }],
};

function ok() {
  return {
    ok: true,
    status: 200,
    json: async () => ({ ok: true }),
    text: async () => "",
  };
}
function err(status: number, body = "boom") {
  return {
    ok: false,
    status,
    json: async () => ({ error: body }),
    text: async () => JSON.stringify({ error: body }),
  };
}

const findButton = (testId: string, memberId: string) =>
  screen
    .getAllByTestId(testId)
    .find((b) => (b as HTMLElement).getAttribute("data-member") === memberId)!;

const lastFetchBody = () => {
  const init = fetchMock.mock.calls.at(-1)?.[1] as RequestInit | undefined;
  return JSON.parse(String(init?.body));
};

describe("MeetingAttendancePanel", () => {
  it("A1: isDeleted=true 候補は除外される", () => {
    render(<MeetingAttendancePanel detail={detail} />);
    expect(screen.queryByText(/削除済/)).toBeNull();
    expect(screen.getAllByTestId("attendance-candidate")).toHaveLength(2);
  });

  it("A2: 既出席メンバーの button は『登録済』表示", () => {
    render(<MeetingAttendancePanel detail={detail} />);
    const m2btn = screen
      .getAllByTestId("attendance-register")
      .find((b) => (b as HTMLElement).getAttribute("data-member") === "m2");
    expect(m2btn!.textContent).toBe("登録済");
    expect(m2btn!.getAttribute("data-registered")).toBe("true");
  });

  it("A3: 出席登録成功で Set に追加 + toast", async () => {
    fetchMock.mockResolvedValueOnce(ok());
    render(<MeetingAttendancePanel detail={detail} />);
    const m1btn = screen
      .getAllByTestId("attendance-register")
      .find((b) => (b as HTMLElement).getAttribute("data-member") === "m1")!;
    fireEvent.click(m1btn);
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/admin/meetings/s1/attendances",
        expect.objectContaining({ method: "POST" }),
      );
    });
    expect(await screen.findByText("出席を登録しました")).toBeTruthy();
    expect(m1btn.getAttribute("data-registered")).toBe("true");
  });

  it("A4: 409 で『既に出席登録済み』 + 楽観 Set 追加", async () => {
    fetchMock.mockResolvedValueOnce(err(409, "conflict"));
    render(<MeetingAttendancePanel detail={detail} />);
    const m1btn = screen
      .getAllByTestId("attendance-register")
      .find((b) => (b as HTMLElement).getAttribute("data-member") === "m1")!;
    fireEvent.click(m1btn);
    expect(await screen.findByText("既に出席登録済み")).toBeTruthy();
    await waitFor(() => {
      expect(m1btn.getAttribute("data-registered")).toBe("true");
    });
  });

  it("A5: 422 で『削除済み会員』 toast / Set 不変", async () => {
    fetchMock.mockResolvedValueOnce(err(422, "deleted"));
    render(<MeetingAttendancePanel detail={detail} />);
    const m1btn = screen
      .getAllByTestId("attendance-register")
      .find((b) => (b as HTMLElement).getAttribute("data-member") === "m1")!;
    fireEvent.click(m1btn);
    expect(await screen.findByText("削除済み会員は登録できません")).toBeTruthy();
    expect(m1btn.getAttribute("data-registered")).toBe("false");
  });

  it("A6: 500 で『登録に失敗 (500)』 toast", async () => {
    fetchMock.mockResolvedValueOnce(err(500));
    render(<MeetingAttendancePanel detail={detail} />);
    const m1btn = screen
      .getAllByTestId("attendance-register")
      .find((b) => (b as HTMLElement).getAttribute("data-member") === "m1")!;
    fireEvent.click(m1btn);
    expect(await screen.findByText("登録に失敗 (500)")).toBeTruthy();
  });

  it("A6b: 404 で『開催日または会員が見つかりません』 toast", async () => {
    fetchMock.mockResolvedValueOnce(err(404, "member_not_found"));
    render(<MeetingAttendancePanel detail={detail} />);
    const m1btn = screen
      .getAllByTestId("attendance-register")
      .find((b) => (b as HTMLElement).getAttribute("data-member") === "m1")!;
    fireEvent.click(m1btn);
    expect(await screen.findByText("開催日または会員が見つかりません")).toBeTruthy();
    expect(m1btn.getAttribute("data-registered")).toBe("false");
  });

  it("A7: 既登録 button 再押下では fetch されず early return", async () => {
    render(<MeetingAttendancePanel detail={detail} />);
    const m2btn = screen
      .getAllByTestId("attendance-register")
      .find((b) => (b as HTMLElement).getAttribute("data-member") === "m2")!;
    fireEvent.click(m2btn);
    expect(await screen.findByText("既に出席登録済み")).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("A8: data-testid 互換 (attendance-register / attendance-candidate / admin-meetings-table)", () => {
    render(<MeetingAttendancePanel detail={detail} />);
    expect(screen.getByTestId("admin-meetings-table")).toBeTruthy();
    expect(screen.getAllByTestId("attendance-candidate").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("attendance-register").length).toBeGreaterThan(0);
  });

  it("B1: 出席解除 button は registered=true の候補にだけ表示される", () => {
    render(<MeetingAttendancePanel detail={detail} />);
    expect(screen.getAllByTestId("attendance-unregister")).toHaveLength(1);
    expect(findButton("attendance-unregister", "m2").textContent).toBe("出席解除");
    expect(
      screen
        .queryAllByTestId("attendance-unregister")
        .some((b) => (b as HTMLElement).getAttribute("data-member") === "m1"),
    ).toBe(false);
  });

  it("B2: 出席解除 click は attended=false payload を POST する", async () => {
    fetchMock.mockResolvedValueOnce(ok());
    render(<MeetingAttendancePanel detail={detail} />);
    fireEvent.click(findButton("attendance-unregister", "m2"));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/admin/meetings/s1/attendances",
        expect.objectContaining({ method: "POST" }),
      );
    });
    expect(lastFetchBody()).toEqual({ memberId: "m2", attended: false });
  });

  it("B3: 出席解除 200 OK で Set から削除 + toast", async () => {
    fetchMock.mockResolvedValueOnce(ok());
    render(<MeetingAttendancePanel detail={detail} />);
    const m2register = findButton("attendance-register", "m2");
    fireEvent.click(findButton("attendance-unregister", "m2"));
    expect(await screen.findByText("出席を解除しました")).toBeTruthy();
    await waitFor(() => {
      expect(m2register.getAttribute("data-registered")).toBe("false");
    });
    expect(screen.queryByTestId("attendance-unregister")).toBeNull();
  });

  it("B4: 出席解除 404 は成功相当に倒し Set から削除する", async () => {
    fetchMock.mockResolvedValueOnce(err(404, "attendance_not_found"));
    render(<MeetingAttendancePanel detail={detail} />);
    const m2register = findButton("attendance-register", "m2");
    fireEvent.click(findButton("attendance-unregister", "m2"));
    expect(await screen.findByText("既に解除済みです")).toBeTruthy();
    await waitFor(() => {
      expect(m2register.getAttribute("data-registered")).toBe("false");
    });
    expect(screen.queryByTestId("attendance-unregister")).toBeNull();
  });

  it("B5: 出席解除 500 は失敗扱いで Set 不変", async () => {
    fetchMock.mockResolvedValueOnce(err(500));
    render(<MeetingAttendancePanel detail={detail} />);
    const m2register = findButton("attendance-register", "m2");
    fireEvent.click(findButton("attendance-unregister", "m2"));
    expect(await screen.findByText("解除に失敗 (500)")).toBeTruthy();
    expect(m2register.getAttribute("data-registered")).toBe("true");
    expect(findButton("attendance-unregister", "m2")).toBeTruthy();
  });
});
