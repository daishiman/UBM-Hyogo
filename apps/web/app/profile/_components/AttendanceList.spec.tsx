import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import { AttendanceList } from "./AttendanceList";
import type { AttendanceListProps } from "./AttendanceList";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const baseItems: AttendanceListProps["attendance"] = Array.from(
  { length: 50 },
  (_, index) => ({
    sessionId: `session-${index + 1}`,
    title: `定例会 ${index + 1}`,
    heldOn: `2026-04-${String((index % 28) + 1).padStart(2, "0")}`,
  }),
);

const renderList = (props: Partial<AttendanceListProps> = {}) =>
  render(
    <AttendanceList
      attendance={props.attendance ?? baseItems}
      attendanceMeta={
        props.attendanceMeta ?? { hasMore: true, nextCursor: "cursor?x=1&y=2" }
      }
    />,
  );

describe("AttendanceList", () => {
  it("初期 props の参加履歴 default 50 件ともっと見るボタンを描画する", () => {
    renderList();

    expect(screen.getAllByRole("listitem")).toHaveLength(50);
    expect(screen.getByRole("button", { name: "もっと見る" })).not.toBeNull();
  });

  it("button click で opaque cursor を URL encode して追加ページを取得し append する", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        records: [
          {
            sessionId: "session-51",
            title: "定例会 51",
            heldOn: "2026-05-01",
          },
        ],
        hasMore: false,
        nextCursor: null,
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    renderList();
    fireEvent.click(screen.getByRole("button", { name: "もっと見る" }));

    await waitFor(() =>
      expect(screen.getByText("定例会 51")).not.toBeNull(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/me/attendance?cursor=cursor%3Fx%3D1%26y%3D2",
      { cache: "no-store" },
    );
    expect(screen.queryByRole("button", { name: "もっと見る" })).toBeNull();
  });

  it("loading 中は disabled と読み込み中テキストを表示する", async () => {
    let resolveFetch: (value: unknown) => void = () => {};
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise((resolve) => {
            resolveFetch = resolve;
          }),
      ),
    );

    renderList();
    fireEvent.click(screen.getByRole("button", { name: "もっと見る" }));

    const loadingButton = screen.getByRole("button", { name: "読み込み中…" });
    expect(loadingButton.getAttribute("disabled")).not.toBeNull();

    resolveFetch({
      ok: true,
      json: async () => ({ records: [], hasMore: false, nextCursor: null }),
    });
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "読み込み中…" })).toBeNull(),
    );
  });

  it("fetch 失敗時に alert を表示し button を再操作可能に戻す", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    );

    renderList();
    fireEvent.click(screen.getByRole("button", { name: "もっと見る" }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("参加履歴の読み込みに失敗しました");
    expect(
      screen.getByRole("button", { name: "もっと見る" }).getAttribute("disabled"),
    ).toBeNull();
  });

  it("items.length === 0 のとき empty message を表示する", () => {
    renderList({
      attendance: [],
      attendanceMeta: { hasMore: false, nextCursor: null },
    });

    expect(screen.getByText("まだ参加履歴がありません。")).not.toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
