// 06c: 不変条件 #15 — filterCandidates が isDeleted=true を除外
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MeetingPanel, filterCandidates } from "../MeetingPanel";
import * as adminApi from "../../../lib/admin/api";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("../../../lib/admin/api", () => ({
  createMeeting: vi.fn(),
  updateMeeting: vi.fn(),
  addAttendance: vi.fn(),
  removeAttendance: vi.fn(),
}));

const mockedCreateMeeting = vi.mocked(adminApi.createMeeting);
const mockedUpdateMeeting = vi.mocked(adminApi.updateMeeting);
const mockedAddAttendance = vi.mocked(adminApi.addAttendance);
const mockedRemoveAttendance = vi.mocked(adminApi.removeAttendance);

beforeEach(() => {
  mockedCreateMeeting.mockReset();
  mockedUpdateMeeting.mockReset();
  mockedAddAttendance.mockReset();
  mockedRemoveAttendance.mockReset();
});

afterEach(() => {
  cleanup();
});

const baseMeeting = {
  sessionId: "s1",
  title: "例会",
  heldOn: "2026-04-29",
  note: null,
  createdAt: "2026-04-29T00:00:00Z",
  attendance: [] as Array<{ memberId: string }>,
};

describe("MeetingPanel.filterCandidates", () => {
  it("isDeleted=true を候補から除外する", () => {
    const input = [
      { memberId: "a", isDeleted: false },
      { memberId: "b", isDeleted: true },
      { memberId: "c" },
    ];
    const out = filterCandidates(input);
    expect(out.map((m) => m.memberId)).toEqual(["a", "c"]);
  });

  it("既存 attendance を初期状態から disabled にする", () => {
    render(
      <MeetingPanel
        meetings={{
          total: 1,
          items: [{ ...baseMeeting, attendance: [{ memberId: "m1" }] }],
        }}
        candidates={[
          { memberId: "m1", fullName: "既存 出席" },
          { memberId: "m2", fullName: "未 出席" },
        ]}
      />,
    );

    fireEvent.change(screen.getByLabelText("会員を選択"), { target: { value: "m1" } });

    expect(
      (screen.getByRole("option", { name: /既存 出席/ }) as HTMLOptionElement).disabled,
    ).toBe(true);
    expect((screen.getByTestId("add-attendance-s1") as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText("m1")).toBeTruthy();
  });
});

describe("MeetingPanel — empty / mutation / authz", () => {
  it("empty: meetings.items=[] かつ candidates=[] でフォームと 0 件のみ表示", () => {
    render(
      <MeetingPanel
        meetings={{ total: 0, items: [] }}
        candidates={[]}
      />,
    );
    expect(screen.getByRole("heading", { name: "開催日 / 出席管理" })).toBeTruthy();
    expect(screen.getByText("開催日一覧 (0 件)")).toBeTruthy();
    expect(screen.getByRole("button", { name: "追加" })).toBeTruthy();
    expect(screen.queryByTestId("add-attendance-s1")).toBeNull();
  });

  it("createMeeting 成功: 引数が正しく入力をクリアして toast 表示", async () => {
    mockedCreateMeeting.mockResolvedValueOnce({ ok: true, status: 200, data: {} });
    render(<MeetingPanel meetings={{ total: 0, items: [] }} candidates={[]} />);

    fireEvent.change(screen.getByLabelText("タイトル"), { target: { value: "  新例会  " } });
    fireEvent.change(screen.getByLabelText("開催日 (YYYY-MM-DD)"), {
      target: { value: "2026-05-10" },
    });
    fireEvent.change(screen.getByLabelText("メモ"), { target: { value: "memo" } });
    fireEvent.click(screen.getByRole("button", { name: "追加" }));

    await waitFor(() => {
      expect(mockedCreateMeeting).toHaveBeenCalledWith({
        title: "新例会",
        heldOn: "2026-05-10",
        note: "memo",
      });
    });
    expect(await screen.findByText("開催日を追加しました")).toBeTruthy();
    expect((screen.getByLabelText("タイトル") as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText("開催日 (YYYY-MM-DD)") as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText("メモ") as HTMLInputElement).value).toBe("");
  });

  it("createMeeting: note 空の場合は null を渡す", async () => {
    mockedCreateMeeting.mockResolvedValueOnce({ ok: true, status: 200, data: {} });
    render(<MeetingPanel meetings={{ total: 0, items: [] }} candidates={[]} />);
    fireEvent.change(screen.getByLabelText("タイトル"), { target: { value: "x" } });
    fireEvent.change(screen.getByLabelText("開催日 (YYYY-MM-DD)"), {
      target: { value: "2026-05-10" },
    });
    fireEvent.click(screen.getByRole("button", { name: "追加" }));
    await waitFor(() => {
      expect(mockedCreateMeeting).toHaveBeenCalledWith({
        title: "x",
        heldOn: "2026-05-10",
        note: null,
      });
    });
  });

  it("createMeeting authz-fail (403): toast にエラー表示", async () => {
    mockedCreateMeeting.mockResolvedValueOnce({
      ok: false,
      status: 403,
      error: "forbidden",
    });
    render(<MeetingPanel meetings={{ total: 0, items: [] }} candidates={[]} />);
    fireEvent.change(screen.getByLabelText("タイトル"), { target: { value: "x" } });
    fireEvent.change(screen.getByLabelText("開催日 (YYYY-MM-DD)"), {
      target: { value: "2026-05-10" },
    });
    fireEvent.click(screen.getByRole("button", { name: "追加" }));
    expect(await screen.findByText("開催追加に失敗: forbidden")).toBeTruthy();
    // 入力はクリアされない
    expect((screen.getByLabelText("タイトル") as HTMLInputElement).value).toBe("x");
  });

  it("createMeeting バリデーション: title 空または heldOn が不正だと API 呼ばれない", () => {
    render(<MeetingPanel meetings={{ total: 0, items: [] }} candidates={[]} />);
    // title 空
    fireEvent.change(screen.getByLabelText("開催日 (YYYY-MM-DD)"), {
      target: { value: "2026-05-10" },
    });
    fireEvent.click(screen.getByRole("button", { name: "追加" }));
    expect(mockedCreateMeeting).not.toHaveBeenCalled();

    // title あり、heldOn 不正フォーマット
    fireEvent.change(screen.getByLabelText("タイトル"), { target: { value: "x" } });
    fireEvent.change(screen.getByLabelText("開催日 (YYYY-MM-DD)"), {
      target: { value: "2026/05/10" },
    });
    fireEvent.click(screen.getByRole("button", { name: "追加" }));
    expect(mockedCreateMeeting).not.toHaveBeenCalled();
  });

  it("addAttendance 成功: 出席者リストに追加", async () => {
    mockedAddAttendance.mockResolvedValueOnce({ ok: true, status: 200, data: {} });
    render(
      <MeetingPanel
        meetings={{ total: 1, items: [{ ...baseMeeting }] }}
        candidates={[{ memberId: "m1", fullName: "山田" }]}
      />,
    );
    fireEvent.change(screen.getByLabelText("会員を選択"), { target: { value: "m1" } });
    fireEvent.click(screen.getByTestId("add-attendance-s1"));
    await waitFor(() => {
      expect(mockedAddAttendance).toHaveBeenCalledWith("s1", "m1");
    });
    expect(await screen.findByText("出席を追加しました")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "出席者" })).toBeTruthy();
  });

  it("addAttendance 422: 削除済み会員 toast", async () => {
    mockedAddAttendance.mockResolvedValueOnce({
      ok: false,
      status: 422,
      error: "deleted",
    });
    render(
      <MeetingPanel
        meetings={{ total: 1, items: [{ ...baseMeeting }] }}
        candidates={[{ memberId: "m1", fullName: "山田" }]}
      />,
    );
    fireEvent.change(screen.getByLabelText("会員を選択"), { target: { value: "m1" } });
    fireEvent.click(screen.getByTestId("add-attendance-s1"));
    expect(await screen.findByText("削除済み会員は登録できません")).toBeTruthy();
  });

  it("addAttendance 409: 既に出席登録 toast", async () => {
    mockedAddAttendance.mockResolvedValueOnce({
      ok: false,
      status: 409,
      error: "conflict",
    });
    render(
      <MeetingPanel
        meetings={{ total: 1, items: [{ ...baseMeeting }] }}
        candidates={[{ memberId: "m1", fullName: "山田" }]}
      />,
    );
    fireEvent.change(screen.getByLabelText("会員を選択"), { target: { value: "m1" } });
    fireEvent.click(screen.getByTestId("add-attendance-s1"));
    expect(await screen.findByText("この会員は既に出席登録されています")).toBeTruthy();
  });

  it("addAttendance その他エラー: 登録に失敗 toast", async () => {
    mockedAddAttendance.mockResolvedValueOnce({
      ok: false,
      status: 500,
      error: "boom",
    });
    render(
      <MeetingPanel
        meetings={{ total: 1, items: [{ ...baseMeeting }] }}
        candidates={[{ memberId: "m1", fullName: "山田" }]}
      />,
    );
    fireEvent.change(screen.getByLabelText("会員を選択"), { target: { value: "m1" } });
    fireEvent.click(screen.getByTestId("add-attendance-s1"));
    expect(await screen.findByText("登録に失敗: boom")).toBeTruthy();
  });

  it("addAttendance: memberId 未選択時は API 呼ばれない", () => {
    render(
      <MeetingPanel
        meetings={{ total: 1, items: [{ ...baseMeeting }] }}
        candidates={[{ memberId: "m1", fullName: "山田" }]}
      />,
    );
    // 未選択でクリック — disabled だが onAdd ガードを直接通すためフォーカス上 click
    const btn = screen.getByTestId("add-attendance-s1") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    fireEvent.click(btn);
    expect(mockedAddAttendance).not.toHaveBeenCalled();
  });

  it("removeAttendance 成功: 出席者リストから削除", async () => {
    mockedRemoveAttendance.mockResolvedValueOnce({ ok: true, status: 200, data: {} });
    render(
      <MeetingPanel
        meetings={{
          total: 1,
          items: [{ ...baseMeeting, attendance: [{ memberId: "m1" }] }],
        }}
        candidates={[{ memberId: "m1", fullName: "山田" }]}
      />,
    );
    expect(screen.getByText("m1")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "削除" }));
    await waitFor(() => {
      expect(mockedRemoveAttendance).toHaveBeenCalledWith("s1", "m1");
    });
    expect(await screen.findByText("出席を削除しました")).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "出席者" })).toBeNull();
  });

  it("removeAttendance 失敗: 削除に失敗 toast", async () => {
    mockedRemoveAttendance.mockResolvedValueOnce({
      ok: false,
      status: 500,
      error: "x",
    });
    render(
      <MeetingPanel
        meetings={{
          total: 1,
          items: [{ ...baseMeeting, attendance: [{ memberId: "m1" }] }],
        }}
        candidates={[{ memberId: "m1", fullName: "山田" }]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "削除" }));
    expect(await screen.findByText("削除に失敗: x")).toBeTruthy();
    // 出席者は残ったまま
    expect(screen.getByRole("heading", { name: "出席者" })).toBeTruthy();
  });

  it("note ありの meeting で note を表示する", () => {
    render(
      <MeetingPanel
        meetings={{
          total: 1,
          items: [{ ...baseMeeting, note: "懇親会あり" }],
        }}
        candidates={[]}
      />,
    );
    expect(screen.getByText("懇親会あり")).toBeTruthy();
  });

  it("編集 details から updateMeeting を呼び CSV リンクを表示する", async () => {
    mockedUpdateMeeting.mockResolvedValueOnce({ ok: true, status: 200, data: {} });
    render(
      <MeetingPanel
        meetings={{ total: 1, items: [{ ...baseMeeting }] }}
        candidates={[]}
      />,
    );
    expect(screen.getByRole("link", { name: "CSV" }).getAttribute("href")).toBe(
      "/api/admin/meetings/s1/export.csv",
    );
    fireEvent.click(screen.getByText("編集"));
    fireEvent.change(screen.getAllByLabelText("タイトル")[1]!, { target: { value: "更新例会" } });
    fireEvent.change(screen.getByLabelText("開催日"), { target: { value: "2026-05-01" } });
    fireEvent.click(screen.getByRole("button", { name: "更新" }));
    await waitFor(() => {
      expect(mockedUpdateMeeting).toHaveBeenCalledWith("s1", {
        title: "更新例会",
        heldOn: "2026-05-01",
        note: null,
      });
    });
    expect(await screen.findByText("開催日を更新しました")).toBeTruthy();
  });

  it("削除 button は deletedAt 付き updateMeeting を呼ぶ", async () => {
    mockedUpdateMeeting.mockResolvedValueOnce({ ok: true, status: 200, data: {} });
    render(
      <MeetingPanel
        meetings={{ total: 1, items: [{ ...baseMeeting }] }}
        candidates={[]}
      />,
    );
    fireEvent.click(screen.getByText("編集"));
    fireEvent.click(screen.getByRole("button", { name: "開催日を削除" }));
    await waitFor(() => {
      expect(mockedUpdateMeeting).toHaveBeenCalledWith(
        "s1",
        expect.objectContaining({ deletedAt: expect.any(String) }),
      );
    });
    expect(await screen.findByText("開催日を削除しました")).toBeTruthy();
  });
});
