// TagQueuePanel: queue list/review pane / confirmed・rejected mutation / フィルタ
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";

const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

vi.mock("../../../lib/admin/api", () => ({
  resolveTagQueue: vi.fn(),
}));

import { TagQueuePanel, type TagQueueItem } from "../TagQueuePanel";
import { resolveTagQueue } from "../../../lib/admin/api";

const mocked = resolveTagQueue as unknown as ReturnType<typeof vi.fn>;

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
  mocked.mockReset();
});

afterEach(() => cleanup());

describe("TagQueuePanel", () => {
  it("happy: items 複数 + 先頭が初期選択 → review pane に詳細表示", () => {
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
    expect(screen.getByText("tag-b")).toBeTruthy();
    // status: <strong>queued</strong> を強調タグ経由で検証（フィルタボタンと衝突するため）
    expect(document.querySelector("strong")?.textContent).toBe("queued");
    // 2 件目をクリックすると review pane が切り替わる
    fireEvent.click(screen.getByRole("button", { name: /m_2 — reviewing/ }));
    expect(screen.getByText("queue: q_2")).toBeTruthy();
  });

  it("empty: items=[] で「該当するキューはありません」表示", () => {
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

  it("mutation confirmed: resolveTagQueue 呼出 + resolved toast", async () => {
    mocked.mockResolvedValue({ ok: true, status: 200, data: {} });
    render(
      <TagQueuePanel
        initial={{ total: 1, items: [item({ queueId: "q_1" })] }}
        filter={undefined}
        focusMemberId={null}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /confirmed/ }));
    await waitFor(() => expect(mocked).toHaveBeenCalledTimes(1));
    expect(mocked).toHaveBeenCalledWith("q_1", { action: "confirmed", tagCodes: ["tag-a", "tag-b"] });
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toContain("resolved"),
    );
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("mutation rejected: 理由空ならバリデーション toast、入力後失敗時は失敗 toast", async () => {
    mocked.mockResolvedValue({ ok: false, status: 422, error: "bad" });
    render(
      <TagQueuePanel
        initial={{ total: 1, items: [item({ queueId: "q_1" })] }}
        filter={undefined}
        focusMemberId={null}
      />,
    );
    // 理由空のまま rejected 押下 → API は呼ばれずバリデーション toast
    // フィルタボタンと衝突するため article 内に限定
    const article = document.querySelector("article") as HTMLElement;
    const rejectBtnEmpty = Array.from(article.querySelectorAll("button")).find(
      (b) => b.textContent === "rejected",
    ) as HTMLButtonElement;
    fireEvent.click(rejectBtnEmpty);
    expect(mocked).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toContain("却下理由を入力してください"),
    );

    // 理由入力 → rejected → API が呼ばれて失敗 toast
    const input = screen.getByLabelText("却下理由") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "不適切" } });
    const rejectBtn = Array.from(article.querySelectorAll("button")).find(
      (b) => b.textContent === "rejected",
    ) as HTMLButtonElement;
    fireEvent.click(rejectBtn);
    await waitFor(() => expect(mocked).toHaveBeenCalledTimes(1));
    expect(mocked).toHaveBeenCalledWith("q_1", { action: "rejected", reason: "不適切" });
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toContain("却下に失敗: bad"),
    );
  });

  it("mutation rejected 成功: reason を trim して toast/refresh、入力をクリア", async () => {
    mocked.mockResolvedValue({ ok: true, status: 200, data: {} });
    render(
      <TagQueuePanel
        initial={{ total: 1, items: [item({ queueId: "q_1" })] }}
        filter={undefined}
        focusMemberId={null}
      />,
    );

    const input = screen.getByLabelText("却下理由") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "  不一致  " } });
    const article = document.querySelector("article") as HTMLElement;
    const rejectBtn = Array.from(article.querySelectorAll("button")).find(
      (b) => b.textContent === "rejected",
    ) as HTMLButtonElement;
    fireEvent.click(rejectBtn);

    await waitFor(() =>
      expect(mocked).toHaveBeenCalledWith("q_1", { action: "rejected", reason: "不一致" }),
    );
    expect(await screen.findByText("キューを rejected にしました")).toBeTruthy();
    expect(input.value).toBe("");
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("authz-fail: confirmed 時に 403 → 「承認に失敗: forbidden」toast / refresh は呼ばれない", async () => {
    mocked.mockResolvedValue({ ok: false, status: 403, error: "forbidden" });
    render(
      <TagQueuePanel
        initial={{ total: 1, items: [item({ queueId: "q_1" })] }}
        filter={undefined}
        focusMemberId={null}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /confirmed/ }));
    await waitFor(() => expect(mocked).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.getByRole("status").textContent).toContain("承認に失敗: forbidden"),
    );
    expect(refreshMock).not.toHaveBeenCalled();
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
    // 初期選択は並び替え後の先頭 = focus_me
    expect(screen.getByText("queue: q_b")).toBeTruthy();
    // 絞込表示
    expect(screen.getByText(/絞込: memberId =/)).toBeTruthy();

    // ul 配下のボタンの順序検証
    const listButtons = screen
      .getByRole("list", { name: "キュー一覧" })
      .querySelectorAll("button");
    expect(listButtons[0]?.textContent).toContain("focus_me");
  });

  it("フィルタボタン押下で router.push が status / memberId を含む URL を呼ぶ", () => {
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

  it("不正な suggestedTagsJson は空配列に fallback し confirmed が disabled", () => {
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
    const btn = screen.getByRole("button", { name: /confirmed/ }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it("suggestedTagsJson が配列でない、または非文字列を含む場合は文字列タグだけ表示", () => {
    const { rerender } = render(
      <TagQueuePanel
        initial={{
          total: 1,
          items: [item({ suggestedTagsJson: JSON.stringify({ tag: "not-array" }) })],
        }}
        filter={undefined}
        focusMemberId={null}
      />,
    );
    expect((screen.getByRole("button", { name: /confirmed/ }) as HTMLButtonElement).disabled).toBe(
      true,
    );

    rerender(
      <TagQueuePanel
        initial={{
          total: 1,
          items: [item({ suggestedTagsJson: JSON.stringify(["tag-a", 1, null, "tag-b"]) })],
        }}
        filter={undefined}
        focusMemberId={null}
      />,
    );
    expect(screen.getByText("tag-a")).toBeTruthy();
    expect(screen.getByText("tag-b")).toBeTruthy();
    expect((screen.getByRole("button", { name: /confirmed/ }) as HTMLButtonElement).disabled).toBe(
      false,
    );
  });

  it("status=resolved の item は confirmed/rejected が disabled", () => {
    render(
      <TagQueuePanel
        initial={{ total: 1, items: [item({ status: "resolved" })] }}
        filter="resolved"
        focusMemberId={null}
      />,
    );
    expect((screen.getByRole("button", { name: /confirmed/ }) as HTMLButtonElement).disabled).toBe(true);
    const article = document.querySelector("article") as HTMLElement;
    const rejectBtn = Array.from(article.querySelectorAll("button")).find(
      (b) => b.textContent === "rejected",
    ) as HTMLButtonElement;
    expect(rejectBtn.disabled).toBe(true);
  });

  it("status=rejected の item も confirmed/rejected が disabled", () => {
    render(
      <TagQueuePanel
        initial={{ total: 1, items: [item({ status: "rejected" })] }}
        filter="rejected"
        focusMemberId={null}
      />,
    );
    expect((screen.getByRole("button", { name: /confirmed/ }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    const article = document.querySelector("article") as HTMLElement;
    const rejectBtn = Array.from(article.querySelectorAll("button")).find(
      (b) => b.textContent === "rejected",
    ) as HTMLButtonElement;
    expect(rejectBtn.disabled).toBe(true);
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
