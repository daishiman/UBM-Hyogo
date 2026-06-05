// task-15: BulkActionBar TC-BAB-01〜04
// issue-1036: tag 一括付与 / 解除 UI（TC-BAB-TAG-01〜05）を追加。
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor, within } from "@testing-library/react";
import { axe } from "jest-axe";
import type {
  AdminTagRef,
  BulkApplyMemberTagsResult,
} from "../../api/members";

type FetchMock = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/lib/admin/api", () => ({
  patchMemberStatus: vi.fn().mockResolvedValue({ ok: true, status: 200, data: {} }),
  deleteMember: vi.fn().mockResolvedValue({ ok: true, status: 200, data: {} }),
  restoreMember: vi.fn().mockResolvedValue({ ok: true, status: 200, data: {} }),
}));

// path alias workaround: also mock the relative path used by BulkActionBar
vi.mock("../../../../lib/admin/api", () => ({
  patchMemberStatus: vi.fn().mockResolvedValue({ ok: true, status: 200, data: {} }),
  deleteMember: vi.fn().mockResolvedValue({ ok: true, status: 200, data: {} }),
  restoreMember: vi.fn().mockResolvedValue({ ok: true, status: 200, data: {} }),
}));

// tag master read を mock（useEffect の初回ロード）
const AVAILABLE: AdminTagRef[] = [
  { tagId: "tag_eng", code: "engineer", label: "エンジニア", category: "occupation" },
  { tagId: "tag_mgr", code: "manager", label: "経営者", category: "occupation" },
];

const makeLargeCatalog = (): AdminTagRef[] => [
  ...Array.from({ length: 20 }, (_, i) => ({
    tagId: `tag_eng_${i + 1}`,
    code: `engineering-${i + 1}`,
    label: `Engineering ${i + 1}`,
    category: "engineering",
  })),
  ...Array.from({ length: 20 }, (_, i) => ({
    tagId: `tag_sales_${i + 1}`,
    code: `sales-${i + 1}`,
    label: `Sales ${i + 1}`,
    category: "sales",
  })),
];

// useAdminMutation を mock（bulk POST の trigger を捕捉）
const bulkTrigger = vi.fn<(payload: unknown) => Promise<BulkApplyMemberTagsResult>>();
vi.mock("../../hooks/useAdminMutation", () => ({
  useAdminMutation: () => ({
    trigger: bulkTrigger,
    isLoading: false,
    error: null,
    reset: vi.fn(),
    abort: vi.fn(),
  }),
}));

import { patchMemberStatus, deleteMember } from "../../../../lib/admin/api";
import { BulkActionBar } from "../_members/BulkActionBar";

const stubTagMaster = (tags: AdminTagRef[], total = tags.length) => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      new Response(JSON.stringify({ total, items: tags }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    ),
  );
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
beforeEach(() => {
  vi.mocked(patchMemberStatus).mockClear();
  vi.mocked(deleteMember).mockClear();
  bulkTrigger.mockReset();
  bulkTrigger.mockResolvedValue({ batchId: "b1", results: [] });
  stubTagMaster(AVAILABLE);
});

describe("BulkActionBar", () => {
  it("TC-BAB-01: selectedIds=[] で render しない", () => {
    render(<BulkActionBar selectedIds={[]} onComplete={() => {}} />);
    expect(screen.queryByRole("region", { name: "一括操作" })).toBeNull();
  });

  it("TC-BAB-02: publish click でシリアル呼出", async () => {
    render(<BulkActionBar selectedIds={["a", "b", "c"]} onComplete={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /^公開/ }));
    await waitFor(() => expect(vi.mocked(patchMemberStatus)).toHaveBeenCalledTimes(3));
    expect(vi.mocked(patchMemberStatus)).toHaveBeenCalledWith("a", { publishState: "public" });
    expect(vi.mocked(patchMemberStatus)).toHaveBeenCalledWith("b", { publishState: "public" });
    expect(vi.mocked(patchMemberStatus)).toHaveBeenCalledWith("c", { publishState: "public" });
  });

  it("TC-BAB-03: hide click", async () => {
    render(<BulkActionBar selectedIds={["a", "b"]} onComplete={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /^非公開/ }));
    await waitFor(() => expect(vi.mocked(patchMemberStatus)).toHaveBeenCalledTimes(2));
    expect(vi.mocked(patchMemberStatus)).toHaveBeenCalledWith("a", { publishState: "hidden" });
  });

  it("TC-BAB-04: soft-delete click", async () => {
    render(<BulkActionBar selectedIds={["a", "b"]} onComplete={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /論理削除/ }));
    await waitFor(() => expect(vi.mocked(deleteMember)).toHaveBeenCalledTimes(2));
    expect(vi.mocked(deleteMember)).toHaveBeenCalledWith("a", "bulk-delete");
  });

  it("TC-BAB-TAG-01: tag master を初回ロードして picker に描画する", async () => {
    render(<BulkActionBar selectedIds={["a"]} onComplete={() => {}} />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "エンジニア" })).toBeTruthy(),
    );
    expect(screen.getByRole("button", { name: "経営者" })).toBeTruthy();
  });

  it("TC-BAB-TAG-02: tag 選択 + 実行で bulk trigger を memberIds×tagIds×op で呼ぶ", async () => {
    render(<BulkActionBar selectedIds={["a", "b"]} onComplete={() => {}} />);
    const pill = await screen.findByRole("button", { name: "エンジニア" });
    fireEvent.click(pill);
    fireEvent.click(screen.getByRole("button", { name: /を付与$/ }));
    await waitFor(() => expect(bulkTrigger).toHaveBeenCalledTimes(1));
    expect(bulkTrigger).toHaveBeenCalledWith({
      memberIds: ["a", "b"],
      tagIds: ["tag_eng"],
      op: "assign",
    });
  });

  it("TC-BAB-TAG-03: 部分失敗結果を集計表示する（skip / not_found リスト）", async () => {
    bulkTrigger.mockResolvedValue({
      batchId: "b1",
      results: [
        { memberId: "a", tagId: "tag_eng", status: "assigned" },
        { memberId: "m_del", tagId: "tag_eng", status: "skipped_deleted" },
        { memberId: "a", tagId: "tag_x", status: "tag_not_found" },
      ],
    });
    render(<BulkActionBar selectedIds={["a", "m_del"]} onComplete={() => {}} />);
    const pill = await screen.findByRole("button", { name: "エンジニア" });
    fireEvent.click(pill);
    fireEvent.click(screen.getByRole("button", { name: /を付与$/ }));
    await waitFor(() => expect(screen.getByTestId("bulk-tag-result")).toBeTruthy());
    expect(screen.getByTestId("bulk-tag-result-skipped")).toBeTruthy();
    expect(screen.getByTestId("bulk-tag-result-not-found")).toBeTruthy();
  });

  it("TC-BAB-TAG-06: 部分失敗結果の member / tag を表示名で表示する", async () => {
    bulkTrigger.mockResolvedValue({
      batchId: "b1",
      results: [
        { memberId: "m_del", tagId: "tag_eng", status: "skipped_deleted" },
        { memberId: "a", tagId: "tag_mgr", status: "tag_not_found" },
      ],
    });
    render(
      <BulkActionBar
        selectedIds={["a", "m_del"]}
        membersById={{ m_del: { fullName: "退会済み 太郎" } }}
        onComplete={() => {}}
      />,
    );
    const pill = await screen.findByRole("button", { name: "エンジニア" });
    fireEvent.click(pill);
    fireEvent.click(screen.getByRole("button", { name: /を付与$/ }));
    await waitFor(() =>
      expect(screen.getByText("退会済みのためスキップ: 退会済み 太郎")).toBeTruthy(),
    );
    expect(screen.getByText("未登録タグのためスキップ: 経営者")).toBeTruthy();
  });

  it("TC-BAB-TAG-07: 表示名が無い member / tag は生 ID fallback で壊れない", async () => {
    bulkTrigger.mockResolvedValue({
      batchId: "b1",
      results: [
        { memberId: "m_missing", tagId: "tag_eng", status: "skipped_deleted" },
        { memberId: "a", tagId: "tag_unknown", status: "tag_not_found" },
      ],
    });
    render(
      <BulkActionBar
        selectedIds={["a", "m_missing"]}
        membersById={{ m_missing: { fullName: " " } }}
        onComplete={() => {}}
      />,
    );
    const pill = await screen.findByRole("button", { name: "エンジニア" });
    fireEvent.click(pill);
    fireEvent.click(screen.getByRole("button", { name: /を付与$/ }));
    await waitFor(() =>
      expect(screen.getByText("退会済みのためスキップ: m_missing")).toBeTruthy(),
    );
    expect(screen.getByText("未登録タグのためスキップ: tag_unknown（未登録）")).toBeTruthy();
  });

  it("TC-BAB-TAG-04: 解除モードで op=unassign を送る", async () => {
    render(<BulkActionBar selectedIds={["a"]} onComplete={() => {}} />);
    const pill = await screen.findByRole("button", { name: "エンジニア" });
    fireEvent.click(screen.getByRole("button", { name: "解除" }));
    fireEvent.click(pill);
    fireEvent.click(screen.getByRole("button", { name: /を解除$/ }));
    await waitFor(() => expect(bulkTrigger).toHaveBeenCalledTimes(1));
    expect(bulkTrigger).toHaveBeenCalledWith({
      memberIds: ["a"],
      tagIds: ["tag_eng"],
      op: "unassign",
    });
  });

  it("TC-BAB-TAG-05: tag 未選択では実行ボタンが disabled", async () => {
    render(<BulkActionBar selectedIds={["a"]} onComplete={() => {}} />);
    await screen.findByRole("button", { name: "エンジニア" });
    const exec = screen.getByRole("button", { name: /を付与$/ });
    expect((exec as HTMLButtonElement).disabled).toBe(true);
  });

  it("TC-BAB-CAT-01: 実 API 形 {total, items} mock で tag picker を描画する", async () => {
    render(<BulkActionBar selectedIds={["a"]} onComplete={() => {}} />);
    expect(await screen.findByRole("button", { name: "エンジニア" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "経営者" })).toBeTruthy();
  });

  it("TC-BAB-CAT-02: large catalog では検索 input で表示 tag を絞り込む", async () => {
    stubTagMaster(makeLargeCatalog());
    render(<BulkActionBar selectedIds={["a"]} onComplete={() => {}} />);

    const input = await screen.findByRole("searchbox", { name: "タグを検索" });
    fireEvent.change(input, { target: { value: "sales-1" } });

    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Engineering 1" })).toBeNull(),
    );
    expect(screen.getByRole("button", { name: "Sales 1" })).toBeTruthy();
  });

  it("TC-BAB-CAT-03: category 折りたたみは aria-expanded と表示を切り替える", async () => {
    stubTagMaster(makeLargeCatalog());
    render(<BulkActionBar selectedIds={["a"]} onComplete={() => {}} />);

    const category = await screen.findByRole("button", { name: /engineering \(20\)/ });
    expect(category.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(category);
    expect(category.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("button", { name: "Engineering 1" })).toBeNull();
    fireEvent.click(category);
    expect(screen.getByRole("button", { name: "Engineering 1" })).toBeTruthy();
  });

  it("TC-BAB-CAT-04: 検索結果外の選択 tag は固定行に残り解除できる", async () => {
    stubTagMaster(makeLargeCatalog());
    render(<BulkActionBar selectedIds={["a"]} onComplete={() => {}} />);

    fireEvent.click(await screen.findByRole("button", { name: "Engineering 1" }));
    fireEvent.change(screen.getByRole("searchbox", { name: "タグを検索" }), {
      target: { value: "sales-1" },
    });

    const selectedGroup = await screen.findByRole("group", { name: "選択中のタグ" });
    expect(selectedGroup.textContent).toContain("Engineering 1");
    fireEvent.click(within(selectedGroup).getByRole("button", { name: "Engineering 1" }));
    await waitFor(() =>
      expect(screen.queryByRole("group", { name: "選択中のタグ" })).toBeNull(),
    );
  });

  it("TC-BAB-CAT-05: tag master は pageSize=100 で取得する", async () => {
    const fetchSpy = vi.fn<FetchMock>(async () =>
      new Response(JSON.stringify({ total: AVAILABLE.length, items: AVAILABLE }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchSpy);
    render(<BulkActionBar selectedIds={["a"]} onComplete={() => {}} />);
    await screen.findByRole("button", { name: "エンジニア" });
    expect(String(fetchSpy.mock.calls[0]?.[0])).toContain("page=1&pageSize=100");
  });

  it("TC-BAB-CAT-06: truncated catalog では検索 UI と上限案内を表示する", async () => {
    const fetchSpy = vi.fn<FetchMock>(async (input) => {
      const page = Number(new URL(String(input), "http://localhost").searchParams.get("page") ?? 1);
      const items = Array.from({ length: 100 }, (_, i) => {
        const id = (page - 1) * 100 + i + 1;
        return {
          tagId: `tag_trunc_${id}`,
          code: `truncated-${id}`,
          label: `Truncated ${id}`,
          category: "truncated",
        };
      });
      return new Response(JSON.stringify({ total: 620, items }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchSpy);

    render(<BulkActionBar selectedIds={["a"]} onComplete={() => {}} />);

    expect(await screen.findByRole("searchbox", { name: "タグを検索" })).toBeTruthy();
    expect(screen.getByText(/全 620 件中 500 件表示/)).toBeTruthy();
    expect(screen.getByText(/上限まで取得/)).toBeTruthy();
    expect(fetchSpy).toHaveBeenCalledTimes(5);
  });

  it("TC-BAB-CAT-07: large catalog でも TagPill は button と aria-pressed を維持する", async () => {
    stubTagMaster(makeLargeCatalog());
    render(<BulkActionBar selectedIds={["a"]} onComplete={() => {}} />);

    const pill = await screen.findByRole("button", { name: "Engineering 1" });
    expect(pill.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(pill);

    await waitFor(() => {
      const selectedButtons = screen.getAllByRole("button", { name: "Engineering 1" });
      expect(selectedButtons.some((button) => button.getAttribute("aria-pressed") === "true")).toBe(
        true,
      );
    });
  });

  it("TC-BAB-CAT-08: tag master fetch 失敗時は空 picker を表示しクラッシュしない", async () => {
    vi.stubGlobal("fetch", vi.fn<FetchMock>(async () => Promise.reject(new Error("network"))));

    render(<BulkActionBar selectedIds={["a"]} onComplete={() => {}} />);

    expect(await screen.findByText("付与可能なタグがありません")).toBeTruthy();
  });

  it("TC-BAB-CAT-09: 空 catalog では既存の空表示を維持する", async () => {
    stubTagMaster([]);

    render(<BulkActionBar selectedIds={["a"]} onComplete={() => {}} />);

    expect(await screen.findByText("付与可能なタグがありません")).toBeTruthy();
  });

  it("TC-BAB-CAT-11: 検索は client filter のみで追加 fetch しない", async () => {
    const largeCatalog = makeLargeCatalog();
    const fetchSpy = vi.fn<FetchMock>(async () =>
      new Response(JSON.stringify({ total: largeCatalog.length, items: largeCatalog }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    render(<BulkActionBar selectedIds={["a"]} onComplete={() => {}} />);
    const input = await screen.findByRole("searchbox", { name: "タグを検索" });
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    fireEvent.change(input, { target: { value: "sales-2" } });

    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Engineering 1" })).toBeNull(),
    );
    expect(screen.getByRole("button", { name: "Sales 2" })).toBeTruthy();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("a11y violations 0", async () => {
    const { container } = render(<BulkActionBar selectedIds={["a", "b"]} onComplete={() => {}} />);
    await screen.findByRole("button", { name: "エンジニア" });
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
