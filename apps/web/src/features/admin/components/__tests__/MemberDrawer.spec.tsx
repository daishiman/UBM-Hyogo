// followup-001 T-5.6: drawer head/body/foot プロトタイプ準拠仕様
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, screen, waitFor, render } from "@testing-library/react";
import type { AdminMemberDetailView } from "@ubm-hyogo/shared";
import { asAdminId, asMemberId, asResponseEmail, asResponseId } from "@ubm-hyogo/shared";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));

import { MemberDrawer } from "../_members/MemberDrawer";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const mkDetail = (overrides: Partial<AdminMemberDetailView> = {}): AdminMemberDetailView => ({
  identityMemberId: asMemberId("m1"),
  identityEmail: asResponseEmail("member@example.com"),
  status: {
    publicConsent: "consented",
    rulesConsent: "consented",
    publishState: "public",
    isDeleted: false,
    notificationOptOut: false,
  },
  profile: {
    memberId: asMemberId("m1"),
    responseId: asResponseId("res-1"),
    responseEmail: asResponseEmail("member@example.com"),
    publicConsent: "consented",
    rulesConsent: "consented",
    publishState: "public",
    isDeleted: false,
    summary: {
      fullName: "山田 太郎",
      nickname: "",
      location: "Kobe",
      occupation: "経営者",
      ubmZone: "0_to_1",
      ubmMembershipType: "member",
    },
    sections: [],
    attendance: [],
    tags: [{ code: "t1", label: "kobe", category: "city", source: "manual" }],
    lastSubmittedAt: "2026-05-15T00:00:00.000Z",
    editResponseUrl: null,
  },
  audit: [],
  ...overrides,
});

describe("MemberDrawer (followup-001)", () => {
  it("head に avatar / 名前 / email mono / responseId を表示する", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => mkDetail(),
    } as Response);
    render(<MemberDrawer memberId="m1" onClose={() => {}} />);

    await waitFor(() => expect(screen.getByText("山田 太郎")).toBeDefined());
    // res-1 は head と FORM RESPONSE の両方に出るため getAllByText で確認
    expect(screen.getAllByText(/res-1/).length).toBeGreaterThan(0);
  });

  it("VISIBILITY セクションに switch と 通知オプトアウト checkbox を持つ", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => mkDetail(),
    } as Response);
    render(<MemberDrawer memberId="m1" onClose={() => {}} />);

    await waitFor(() =>
      expect(screen.getByRole("switch", { name: /公開状態を切替/ })).toBeDefined(),
    );
    expect(screen.getByRole("checkbox", { name: "通知をオプトアウト" })).toBeDefined();
  });

  it("FORM RESPONSE KVList に 回答ID / 送信日時 / UBM区画 等を表示する", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => mkDetail(),
    } as Response);
    render(<MemberDrawer memberId="m1" onClose={() => {}} />);

    await waitFor(() => expect(screen.getByText("回答ID")).toBeDefined());
    expect(screen.getByText("UBM区画")).toBeDefined();
    expect(screen.getByText("お住まい")).toBeDefined();
    expect(screen.getByText("職業")).toBeDefined();
  });

  it("isDeleted=true で DELETED ブロックを表示する", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => mkDetail({
        status: {
          publicConsent: "consented",
          rulesConsent: "consented",
          publishState: "hidden",
          isDeleted: true,
          notificationOptOut: false,
        },
        audit: [
          {
            occurredAt: "2026-05-20T00:00:00Z",
            actor: asAdminId("admin"),
            action: "admin.member.deleted",
            note: "ユーザー希望",
          },
        ],
      }),
    } as Response);
    render(<MemberDrawer memberId="m1" onClose={() => {}} />);

    await waitFor(() => expect(screen.getAllByText("退会済み").length).toBeGreaterThan(0));
    expect(screen.getByText(/2026\/05\/20/)).toBeDefined();
    expect(screen.getByText(/ユーザー希望/)).toBeDefined();
    // redesign では「退会処理」ボタンは廃止されている
    expect(screen.queryByRole("button", { name: /退会処理/ })).toBeNull();
  });

  it("fetch 失敗時に再試行ボタンから同一 memberId を再取得して回復する", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({ ok: false, status: 500 } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mkDetail(),
      } as Response);

    render(<MemberDrawer memberId="m1" onClose={() => {}} />);

    const retry = await screen.findByRole("button", { name: "再試行" });
    expect(screen.getByRole("alert").textContent).toContain("HTTP 500");

    fireEvent.click(retry);

    await waitFor(() => expect(screen.getByText("山田 太郎")).toBeDefined());
    const detailFetches = fetchMock.mock.calls.filter(
      ([url]) => url === "/api/admin/members/m1",
    );
    expect(detailFetches).toHaveLength(2);
    expect(detailFetches).toEqual([
      ["/api/admin/members/m1", { cache: "no-store" }],
      ["/api/admin/members/m1", { cache: "no-store" }],
    ]);
  });
});
