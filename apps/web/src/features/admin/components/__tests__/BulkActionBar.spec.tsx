// task-15: BulkActionBar TC-BAB-01〜04
// issue-1036: tag 一括付与 / 解除 UI（TC-BAB-TAG-01〜05）を追加。
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import type {
  AdminTagRef,
  BulkApplyMemberTagsResult,
} from "../../api/members";

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

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
beforeEach(() => {
  vi.mocked(patchMemberStatus).mockClear();
  vi.mocked(deleteMember).mockClear();
  bulkTrigger.mockReset();
  bulkTrigger.mockResolvedValue({ batchId: "b1", results: [] });
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      new Response(JSON.stringify({ available: AVAILABLE }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    ),
  );
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

  it("a11y violations 0", async () => {
    const { container } = render(<BulkActionBar selectedIds={["a", "b"]} onComplete={() => {}} />);
    await screen.findByRole("button", { name: "エンジニア" });
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
