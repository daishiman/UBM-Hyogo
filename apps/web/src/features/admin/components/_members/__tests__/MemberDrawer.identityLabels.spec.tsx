// admin-members-timestamp-jst-and-identity-label-clarity (T4):
// IDENTITY セクションの日本語ラベル主・英語キー併記・真偽値日本語化・見出し日本語化を検証
// （AC-3/4/8）。diagnostics panel の真偽値と混ざらないよう within で IDENTITY region に絞る。
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import type { AdminMemberDetailView } from "@ubm-hyogo/shared";
import { asMemberId, asResponseEmail, asResponseId } from "@ubm-hyogo/shared";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("../../../api/members", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../api/members")>()),
  fetchMemberTags: () => Promise.resolve({ assigned: [], available: [] }),
}));

// diagnostics は本 spec の対象外（IDENTITY を within で絞って検証）。
// 正常値で resolve して panel を読み込み完了に倒す（pending/reject で body 描画が止まるのを避ける）。
vi.mock("../../../diagnostics/api", () => ({
  fetchMemberDiagnosis: () =>
    Promise.resolve({
      capturedAt: "2026-06-09T10:34:19.000Z",
      memberId: "m1",
      identityMatches: { byEmail: true, byExternalId: false, matchedFormResponseId: "res-1" },
      responseFieldCount: 31,
      expectedFieldCount: 31,
      missingFieldKeys: [],
      consent: { publicConsent: true, rulesConsent: true },
      publishState: { published: true, visibleOnPublicDirectory: true },
      hypothesisFlags: {
        H2_identityMissing: false,
        H3_hiddenByConsentOrPublish: false,
        H4_missingFieldsNonEmpty: false,
      },
    }),
}));

vi.mock("../../../hooks/useAdminMutation", () => ({
  useAdminMutation: () => ({
    trigger: vi.fn(() => Promise.resolve(undefined)),
    isLoading: false,
    error: null,
    reset: vi.fn(),
    abort: vi.fn(),
  }),
}));

import { MemberDrawer } from "../MemberDrawer";

const mkDetail = (
  overrides: { notificationOptOut?: boolean; isDeleted?: boolean } = {},
): AdminMemberDetailView => ({
  identityMemberId: asMemberId("m1"),
  identityEmail: asResponseEmail("member@example.com"),
  status: {
    publicConsent: "consented",
    rulesConsent: "consented",
    publishState: "public",
    isDeleted: overrides.isDeleted ?? false,
    notificationOptOut: overrides.notificationOptOut ?? false,
  },
  profile: {
    memberId: asMemberId("m1"),
    responseId: asResponseId("res-1"),
    responseEmail: asResponseEmail("member@example.com"),
    publicConsent: "consented",
    rulesConsent: "consented",
    publishState: "public",
    isDeleted: overrides.isDeleted ?? false,
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
    tags: [],
    lastSubmittedAt: "2026-05-15T00:00:00.000Z",
    editResponseUrl: null,
  },
  audit: [],
});

const mockDetailFetch = (detail: AdminMemberDetailView) => {
  vi.spyOn(globalThis, "fetch").mockImplementation(
    async () => ({ ok: true, json: async () => detail }) as Response,
  );
};

const identitySection = (): HTMLElement =>
  screen.getByRole("region", { name: "本人情報（システム項目）" });

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("MemberDrawer IDENTITY 日本語ラベル化", () => {
  it("AC-8: 見出しが「本人情報（システム項目）」で表示される", async () => {
    mockDetailFetch(mkDetail());
    render(<MemberDrawer memberId="m1" onClose={() => {}} />);
    expect(await screen.findByText("本人情報（システム項目）")).toBeDefined();
  });

  it("AC-3: 日本語ラベル主 + 英語キー併記で表示される", async () => {
    mockDetailFetch(mkDetail());
    render(<MemberDrawer memberId="m1" onClose={() => {}} />);
    await screen.findByText("本人情報（システム項目）");
    const region = within(identitySection());
    // 日本語ラベル
    expect(region.getByText("会員ID")).toBeDefined();
    expect(region.getByText("回答メールアドレス")).toBeDefined();
    expect(region.getByText("通知の受け取り停止")).toBeDefined();
    expect(region.getByText("退会済み")).toBeDefined();
    // 英語キー併記（AC-11: DOM に残す）
    expect(region.getByText("memberId")).toBeDefined();
    expect(region.getByText("responseEmail")).toBeDefined();
    expect(region.getByText("notificationOptOut")).toBeDefined();
    expect(region.getByText("isDeleted")).toBeDefined();
  });

  it("AC-4: 真偽値が「はい/いいえ」で表示され、true/false 文字列は残らない", async () => {
    mockDetailFetch(mkDetail({ notificationOptOut: true, isDeleted: false }));
    render(<MemberDrawer memberId="m1" onClose={() => {}} />);
    await screen.findByText("本人情報（システム項目）");
    const region = within(identitySection());
    // notificationOptOut=true → はい, isDeleted=false → いいえ
    expect(region.getByText("はい")).toBeDefined();
    expect(region.getByText("いいえ")).toBeDefined();
    expect(region.queryByText("true")).toBeNull();
    expect(region.queryByText("false")).toBeNull();
  });

  it("AC-3: 英語見出し「identity (system field)」は残らない", async () => {
    mockDetailFetch(mkDetail());
    render(<MemberDrawer memberId="m1" onClose={() => {}} />);
    await waitFor(() =>
      expect(screen.getByText("本人情報（システム項目）")).toBeDefined(),
    );
    expect(screen.queryByText("identity (system field)")).toBeNull();
  });
});
