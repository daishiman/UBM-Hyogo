import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { safeErr, safeOk } from "@/lib/result";
import { AttendanceDetailTabs } from "../components/AttendanceDetailTabs";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

afterEach(() => cleanup());

const sessions = [
  {
    sessionId: "s1",
    heldOn: "2026-06-01",
    title: "定例会",
    attendeeCount: 12,
    rate: 0.4,
  },
];

const members = [
  {
    memberId: "m1",
    displayName: "山田 太郎",
    attendedCount: 5,
    rate: 0.5,
  },
];

describe("AttendanceDetailTabs", () => {
  it("shows session table by default and switches detail views", () => {
    render(<AttendanceDetailTabs bySession={safeOk(sessions)} ranking={safeOk(members)} />);

    expect(screen.getByTestId("attendance-by-session-table")).toBeTruthy();
    expect(screen.queryByTestId("attendance-ranking-table")).toBeNull();

    fireEvent.click(screen.getByRole("radio", { name: "会員別" }));
    expect(screen.getByTestId("attendance-ranking-table")).toBeTruthy();
    expect(screen.queryByTestId("attendance-by-session-table")).toBeNull();

    expect(screen.getByRole("radio", { name: "開催回ごと" })).toBeTruthy();
    fireEvent.click(screen.getByRole("radio", { name: "出席が多い順" }));
    expect(screen.getByTestId("attendance-top10")).toBeTruthy();
  });

  it("keeps available ranking tabs usable when the session section fails", () => {
    render(
      <AttendanceDetailTabs
        bySession={safeErr({ code: "SESSION_FAILED", message: "session failed" })}
        ranking={safeOk(members)}
      />,
    );

    expect(screen.getByText(/開催回ごとの出席状況.*読み込みに失敗しました/)).toBeTruthy();

    fireEvent.click(screen.getByRole("radio", { name: "会員別" }));
    expect(screen.getByTestId("attendance-ranking-table")).toBeTruthy();

    fireEvent.click(screen.getByRole("radio", { name: "出席が多い順" }));
    expect(screen.getByTestId("attendance-top10")).toBeTruthy();
  });

  it("keeps the session tab usable when ranking fails", () => {
    render(
      <AttendanceDetailTabs
        bySession={safeOk(sessions)}
        ranking={safeErr({ code: "RANKING_FAILED", message: "ranking failed" })}
      />,
    );

    expect(screen.getByTestId("attendance-by-session-table")).toBeTruthy();

    fireEvent.click(screen.getByRole("radio", { name: "会員別" }));
    expect(screen.getByText(/会員別出席率.*読み込みに失敗しました/)).toBeTruthy();

    fireEvent.click(screen.getByRole("radio", { name: "出席が多い順" }));
    expect(screen.getByText(/出席が多い人の一覧.*読み込みに失敗しました/)).toBeTruthy();
  });
});
