// task-15: BulkActionBar TC-BAB-01〜04
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";

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

import { BulkActionBar } from "../_members/BulkActionBar";
import { patchMemberStatus, deleteMember } from "../../../../lib/admin/api";

afterEach(() => cleanup());
beforeEach(() => {
  vi.mocked(patchMemberStatus).mockClear();
  vi.mocked(deleteMember).mockClear();
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

  it("a11y violations 0", async () => {
    const { container } = render(<BulkActionBar selectedIds={["a", "b"]} onComplete={() => {}} />);
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
