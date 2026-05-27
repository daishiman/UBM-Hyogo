// serial-05 step-06: MeetingAttendancePanel tests (Phase 4 A1-A8)
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MeetingAttendancePanel } from "../MeetingAttendancePanel";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

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
});
