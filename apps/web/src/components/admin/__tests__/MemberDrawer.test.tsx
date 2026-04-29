// 06c: MemberDrawer は profile 本文 input を持たない (#4 / #11)
//       および tag 直接編集 form を持たない (#13)
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { MemberDrawer } from "../MemberDrawer";

afterEach(() => cleanup());

const detail = {
  identityMemberId: "m_1",
  identityEmail: "a@example.com",
  status: {
    publicConsent: "consented",
    rulesConsent: "consented",
    publishState: "public",
    isDeleted: false,
  },
  profile: { sections: [], summary: { fullName: "山田 太郎" } },
  audit: [],
};

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      json: async () => detail,
    } as unknown as Response),
  );
});

describe("MemberDrawer", () => {
  it("profile 本文の textarea/input が存在しない (#4 #11)", async () => {
    render(<MemberDrawer memberId="m_1" onClose={() => {}} onMutated={() => {}} />);
    await waitFor(() => expect(screen.getByText(/会員詳細/)).toBeTruthy());
    expect(screen.queryByLabelText(/事業概要|business/i)).toBeNull();
    expect(screen.queryByLabelText(/自己紹介|self/i)).toBeNull();
  });

  it("tag 直接編集 form がなく /admin/tags へのリンクのみ (#13)", async () => {
    render(<MemberDrawer memberId="m_1" onClose={() => {}} onMutated={() => {}} />);
    await waitFor(() => expect(screen.getByText(/会員詳細/)).toBeTruthy());
    expect(document.querySelector("[data-testid=tag-direct-edit]")).toBeNull();
    const link = screen.getByRole("link", { name: /タグキューで編集/ });
    expect(link.getAttribute("href")).toMatch(/^\/admin\/tags\?memberId=/);
  });
});
