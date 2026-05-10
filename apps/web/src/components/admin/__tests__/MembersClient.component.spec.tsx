// MembersClient: テーブルレンダー・フィルタ遷移・詳細ドロワー起動
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

vi.mock("../MemberDrawer", () => ({
  MemberDrawer: ({
    memberId,
    onClose,
    onMutated,
  }: {
    memberId: string;
    onClose: () => void;
    onMutated: () => void;
  }) => (
    <div data-testid="drawer">
      drawer-{memberId}
      <button type="button" onClick={onClose}>
        close-drawer
      </button>
      <button type="button" onClick={onMutated}>
        mutate-drawer
      </button>
    </div>
  ),
}));

import { MembersClient } from "../MembersClient";

const baseSearch = {
  filter: "" as "" | "published" | "hidden" | "deleted",
  q: "",
  zone: "all" as const,
  tag: [] as string[],
  sort: "recent" as const,
  density: "comfy" as const,
  page: 1,
};

const baseMember = {
  memberId: "m_1",
  fullName: "山田 太郎",
  responseEmail: "taro@example.com",
  publishState: "public",
  isDeleted: false,
  lastSubmittedAt: "2026-04-30T15:00:00.000Z",
};

const fixture = (over: Partial<typeof baseMember> = {}) => ({ ...baseMember, ...over });

beforeEach(() => {
  pushMock.mockClear();
  refreshMock.mockClear();
});

afterEach(() => cleanup());

describe("MembersClient", () => {
  it("happy: 複数件をテーブルで表示する", () => {
    const initial = {
      total: 2,
      members: [
        fixture({ memberId: "m_1", fullName: "山田 太郎", responseEmail: "taro@example.com", publishState: "public" }),
        fixture({ memberId: "m_2", fullName: "鈴木 花子", responseEmail: "hanako@example.com", publishState: "private" }),
      ],
    } as any;
    render(<MembersClient initial={initial} search={baseSearch} />);

    expect(screen.getByRole("heading", { name: "会員管理" })).toBeTruthy();
    expect(screen.getByText("2 件")).toBeTruthy();
    expect(screen.getByText("山田 太郎")).toBeTruthy();
    expect(screen.getByText("taro@example.com")).toBeTruthy();
    expect(screen.getByText("public")).toBeTruthy();
    expect(screen.getByText("鈴木 花子")).toBeTruthy();
    expect(screen.getByText("hanako@example.com")).toBeTruthy();
    expect(screen.getByText("private")).toBeTruthy();
    expect(screen.getAllByText("2026-04-30T15:00:00.000Z").length).toBeGreaterThanOrEqual(2);
    // 詳細ボタンが行数分
    expect(screen.getAllByRole("button", { name: "詳細" })).toHaveLength(2);
  });

  it("empty: members=[] / total=0 で 0 件表示・データ行なし", () => {
    render(<MembersClient initial={{ total: 0, members: [] } as any} search={baseSearch} />);
    expect(screen.getByText("0 件")).toBeTruthy();
    expect(screen.queryAllByRole("button", { name: "詳細" })).toHaveLength(0);
    // tbody に行なし
    const tbody = document.querySelector("tbody");
    expect(tbody).toBeTruthy();
    expect(tbody!.querySelectorAll("tr").length).toBe(0);
  });

  it("mutation: 詳細ボタン押下で MemberDrawer が描画され、フィルタ遷移が router.push を呼ぶ", () => {
    const initial = {
      total: 1,
      members: [fixture({ memberId: "m_99" })],
    } as any;
    render(<MembersClient initial={initial} search={baseSearch} />);

    expect(screen.queryByTestId("drawer")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "詳細" }));
    expect(screen.getByTestId("drawer").textContent).toContain("drawer-m_99");

    fireEvent.click(screen.getByRole("button", { name: "公開中" }));
    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith("/admin/members?filter=published");

    fireEvent.click(screen.getByRole("button", { name: "すべて" }));
    expect(pushMock).toHaveBeenCalledTimes(2);
    expect(pushMock).toHaveBeenLastCalledWith("/admin/members");

    fireEvent.click(screen.getByRole("button", { name: "非公開" }));
    expect(pushMock).toHaveBeenLastCalledWith("/admin/members?filter=hidden");

    fireEvent.click(screen.getByRole("button", { name: "削除済み" }));
    expect(pushMock).toHaveBeenLastCalledWith("/admin/members?filter=deleted");

    // onMutated callback → router.refresh
    fireEvent.click(screen.getByRole("button", { name: "mutate-drawer" }));
    expect(refreshMock).toHaveBeenCalledTimes(1);

    // close drawer
    fireEvent.click(screen.getByRole("button", { name: "close-drawer" }));
    expect(screen.queryByTestId("drawer")).toBeNull();
  });

  it("authz-fail 代替: 削除済み行ラベル表示 / タグキュー link href が encodeURIComponent される / aria-pressed が filter prop と一致", () => {
    const initial = {
      total: 1,
      members: [fixture({ memberId: "m id/?&", isDeleted: true })],
    } as any;
    render(<MembersClient initial={initial} search={{ ...baseSearch, filter: "published" }} />);

    // 「削除済み」はフィルタボタンと行ラベル両方にあるため数で確認 (>=2)
    expect(screen.getAllByText("削除済み").length).toBeGreaterThanOrEqual(2);

    const link = screen.getByRole("link", { name: "タグキューで編集" });
    expect(link.getAttribute("href")).toBe(
      `/admin/tags?memberId=${encodeURIComponent("m id/?&")}`,
    );

    // aria-pressed reflects current filter
    expect(screen.getByRole("button", { name: "公開中" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "すべて" }).getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByRole("button", { name: "非公開" }).getAttribute("aria-pressed")).toBe("false");
  });
});
