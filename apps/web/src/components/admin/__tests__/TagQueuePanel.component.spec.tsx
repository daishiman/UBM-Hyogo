// TagQueuePanel: queue list / review pane / drawer trigger / filter
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

const drawerMock = vi.fn();
vi.mock("../TagsQueueResolveDrawer", () => ({
  TagsQueueResolveDrawer: (props: Record<string, unknown>) => {
    drawerMock(props);
    return props.open ? <div data-testid="drawer-stub" /> : null;
  },
}));

import { TagQueuePanel, type TagQueueItem } from "../TagQueuePanel";

const item = (over: Partial<TagQueueItem> = {}): TagQueueItem => ({
  queueId: "q_1",
  memberId: "m_1",
  responseId: "r_1",
  status: "queued",
  suggestedTagsJson: JSON.stringify(["tag-a", "tag-b"]),
  reason: null,
  createdAt: "2026-04-30T10:00:00.000Z",
  updatedAt: "2026-04-30T10:00:00.000Z",
  ...over,
});

beforeEach(() => {
  pushMock.mockClear();
  refreshMock.mockClear();
  drawerMock.mockClear();
});

afterEach(() => cleanup());

describe("TagQueuePanel", () => {
  it("items 複数 + 先頭が初期選択 → review pane に詳細表示", () => {
    render(
      <TagQueuePanel
        initial={{
          total: 2,
          items: [
            item({ queueId: "q_1", memberId: "m_1" }),
            item({ queueId: "q_2", memberId: "m_2", status: "reviewing" }),
          ],
        }}
        filter={undefined}
        focusMemberId={null}
      />,
    );
    expect(screen.getByRole("heading", { name: "タグキュー" })).toBeTruthy();
    expect(screen.getByText("queue: q_1")).toBeTruthy();
    expect(screen.getByText("tag-a")).toBeTruthy();
    expect(document.querySelector("strong")?.textContent).toBe("queued");
    fireEvent.click(screen.getByRole("button", { name: /m_2 — reviewing/ }));
    expect(screen.getByText("queue: q_2")).toBeTruthy();
  });

  it("items=[] で「該当するキューはありません」表示", () => {
    render(
      <TagQueuePanel
        initial={{ total: 0, items: [] }}
        filter={undefined}
        focusMemberId={null}
      />,
    );
    expect(screen.getByText("該当するキューはありません")).toBeTruthy();
    expect(screen.getByText("左のキューから項目を選択してください。")).toBeTruthy();
  });

  it("TC-P-01: Resolve ボタン click で drawer が open=true で render", () => {
    render(
      <TagQueuePanel
        initial={{ total: 1, items: [item({ queueId: "q_1" })] }}
        filter={undefined}
        focusMemberId={null}
      />,
    );
    // 初期は open=false（stub は null を返す）
    expect(screen.queryByTestId("drawer-stub")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "resolve" }));
    expect(screen.getByTestId("drawer-stub")).toBeTruthy();
    const lastCall = drawerMock.mock.calls.at(-1)?.[0] as Record<string, unknown>;
    expect(lastCall?.open).toBe(true);
    expect(lastCall?.queueId).toBe("q_1");
    expect(lastCall?.suggestedTags).toEqual(["tag-a", "tag-b"]);
  });

  it("focusMemberId と一致する item が先頭に並び替わる", () => {
    render(
      <TagQueuePanel
        initial={{
          total: 3,
          items: [
            item({ queueId: "q_a", memberId: "m_other_1" }),
            item({ queueId: "q_b", memberId: "focus_me" }),
            item({ queueId: "q_c", memberId: "m_other_2" }),
          ],
        }}
        filter={undefined}
        focusMemberId="focus_me"
      />,
    );
    expect(screen.getByText("queue: q_b")).toBeTruthy();
    expect(screen.getByText(/絞込: memberId =/)).toBeTruthy();
    const listButtons = screen
      .getByRole("list", { name: "キュー一覧" })
      .querySelectorAll("button");
    expect(listButtons[0]?.textContent).toContain("focus_me");
  });

  it("TC-P-02: フィルタボタン押下で router.push が呼ばれる", () => {
    render(
      <TagQueuePanel
        initial={{ total: 1, items: [item()] }}
        filter={undefined}
        focusMemberId="m_focus"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "queued" }));
    expect(pushMock).toHaveBeenLastCalledWith("/admin/tags?status=queued&memberId=m_focus");

    fireEvent.click(screen.getByRole("button", { name: "すべて" }));
    expect(pushMock).toHaveBeenLastCalledWith("/admin/tags?memberId=m_focus");
  });

  it("focusMemberId なしで「すべて」を押すと query なし URL に遷移", () => {
    render(
      <TagQueuePanel
        initial={{ total: 1, items: [item()] }}
        filter="queued"
        focusMemberId={null}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "すべて" }));
    expect(pushMock).toHaveBeenLastCalledWith("/admin/tags");
  });

  it("不正な suggestedTagsJson は空配列に fallback して drawer に空配列を渡す", () => {
    render(
      <TagQueuePanel
        initial={{
          total: 1,
          items: [item({ suggestedTagsJson: "not-json" })],
        }}
        filter={undefined}
        focusMemberId={null}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "resolve" }));
    const lastCall = drawerMock.mock.calls.at(-1)?.[0] as Record<string, unknown>;
    expect(lastCall?.suggestedTags).toEqual([]);
  });

  it("suggestedTagsJson が非文字列を含む場合は文字列タグだけ抽出", () => {
    render(
      <TagQueuePanel
        initial={{
          total: 1,
          items: [
            item({ suggestedTagsJson: JSON.stringify(["tag-a", 1, null, "tag-b"]) }),
          ],
        }}
        filter={undefined}
        focusMemberId={null}
      />,
    );
    expect(screen.getByText("tag-a")).toBeTruthy();
    expect(screen.getByText("tag-b")).toBeTruthy();
  });

  it("reason 文字列が render される", () => {
    render(
      <TagQueuePanel
        initial={{ total: 1, items: [item({ reason: "重複の疑い" })] }}
        filter={undefined}
        focusMemberId={null}
      />,
    );
    expect(screen.getByText(/重複の疑い/)).toBeTruthy();
  });
});
