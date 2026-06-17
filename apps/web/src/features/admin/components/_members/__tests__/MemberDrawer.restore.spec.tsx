import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AdminMemberDetailView } from "@ubm-hyogo/shared";
import { asAdminId, asMemberId, asResponseEmail, asResponseId } from "@ubm-hyogo/shared";
import { MemberDrawer } from "../MemberDrawer";

const toastMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("../../../../../components/ui/Toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock("../../../api/members", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../api/members")>()),
  fetchMemberTags: () => Promise.resolve({ assigned: [], available: [] }),
}));

vi.mock("../../../diagnostics/api", () => ({
  fetchMemberDiagnosis: () =>
    Promise.resolve({
      capturedAt: "2026-06-12T00:00:00.000Z",
      memberId: "m1",
      identityMatches: { byEmail: true, byExternalId: false, matchedFormResponseId: "res-1" },
      responseFieldCount: 31,
      expectedFieldCount: 31,
      missingFieldKeys: [],
      consent: { publicConsent: true, rulesConsent: true },
      publishState: { published: false, visibleOnPublicDirectory: false },
      hypothesisFlags: {
        H2_identityMissing: false,
        H3_hiddenByConsentOrPublish: true,
        H4_missingFieldsNonEmpty: false,
      },
    }),
}));

const okJson = (body: unknown): Response =>
  ({
    ok: true,
    status: 200,
    json: async () => body,
    text: async () => JSON.stringify(body),
  }) as Response;

const errorResponse = (status: number, body: unknown): Response =>
  ({
    ok: false,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  }) as Response;

const mkDetail = (isDeleted = true): AdminMemberDetailView => ({
  identityMemberId: asMemberId("m1"),
  identityEmail: asResponseEmail("member@example.com"),
  status: {
    publicConsent: "consented",
    rulesConsent: "consented",
    publishState: isDeleted ? "hidden" : "public",
    isDeleted,
    notificationOptOut: false,
  },
  profile: {
    memberId: asMemberId("m1"),
    responseId: asResponseId("res-1"),
    responseEmail: asResponseEmail("member@example.com"),
    publicConsent: "consented",
    rulesConsent: "consented",
    publishState: isDeleted ? "hidden" : "public",
    isDeleted,
    summary: {
      fullName: "復元 対象",
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
  audit: isDeleted
    ? [
        {
          occurredAt: "2026-06-01T00:00:00.000Z",
          actor: asAdminId("admin"),
          action: "admin.member.deleted",
          note: null,
        },
      ]
    : [],
});

const renderDrawer = () =>
  render(<MemberDrawer memberId="m1" onClose={() => {}} />);

type FetchMockCalls = {
  readonly mock: {
    readonly calls: readonly (readonly unknown[])[];
  };
};

const restoreFetchCalls = (fetchMock: FetchMockCalls) =>
  fetchMock.mock.calls.filter(([url, init]) => {
    const method =
      typeof init === "object" && init !== null && "method" in init
        ? (init as RequestInit).method
        : undefined;
    return url === "/api/admin/members/m1/restore" && method === "POST";
  });

describe("MemberDrawer restore deleted member", () => {
  beforeEach(() => {
    toastMock.mockClear();
    vi.spyOn(globalThis, "confirm").mockReturnValue(true);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("退会済み会員だけに復元ボタンを表示し、成功時に即時復元表示へ更新して toast を出す", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(okJson(mkDetail(true)))
      .mockResolvedValueOnce(okJson({ id: "m1", restoredAt: "2026-06-12T00:00:00.000Z" }));

    renderDrawer();

    const restoreButton = await screen.findByRole("button", { name: "この会員を復元する" });
    fireEvent.click(restoreButton);

    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "この会員を復元する" })).toBeNull(),
    );
    expect(toastMock).toHaveBeenCalledWith("会員を復元しました");
    expect(restoreFetchCalls(fetchMock)).toHaveLength(1);
  });

  it("confirm キャンセル時は restore POST を発火せず、表示状態を汚さない", async () => {
    vi.mocked(globalThis.confirm).mockReturnValue(false);
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(okJson(mkDetail(true)));

    renderDrawer();

    fireEvent.click(await screen.findByRole("button", { name: "この会員を復元する" }));

    expect(restoreFetchCalls(fetchMock)).toHaveLength(0);
    expect(screen.getByRole("button", { name: "この会員を復元する" })).toBeDefined();
    expect(screen.queryByRole("alert", { name: /復元/ })).toBeNull();
  });

  it("isDeleted=false では退会済みセクションと復元ボタンを表示しない", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(okJson(mkDetail(false)));

    renderDrawer();

    await waitFor(() => expect(screen.getByText("復元 対象")).toBeDefined());
    expect(screen.queryByRole("button", { name: "この会員を復元する" })).toBeNull();
    expect(screen.queryByText(/退会済み（論理削除）/)).toBeNull();
  });

  it("409 member_not_deleted は専用エラーを表示し、退会済み表示を維持する", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(okJson(mkDetail(true)))
      .mockResolvedValueOnce(errorResponse(409, { error: "member_not_deleted" }));

    renderDrawer();

    fireEvent.click(await screen.findByRole("button", { name: "この会員を復元する" }));

    expect(await screen.findByText("すでに復元済みの可能性があります。画面を再読み込みしてください。")).toBeDefined();
    expect(screen.getByRole("button", { name: "この会員を復元する" })).toBeDefined();
  });

  it("404 と network error は汎用エラーを表示し、成功 toast を出さない", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(okJson(mkDetail(true)))
      .mockResolvedValueOnce(errorResponse(404, { error: "member_not_found" }))
      .mockRejectedValueOnce(new TypeError("fetch failed"));

    renderDrawer();

    fireEvent.click(await screen.findByRole("button", { name: "この会員を復元する" }));

    const genericError = await screen.findByText("復元に失敗しました。時間をおいて再度お試しください。");
    expect(genericError).toBeDefined();
    expect(toastMock).not.toHaveBeenCalledWith("会員を復元しました");

    fireEvent.click(screen.getByRole("button", { name: "この会員を復元する" }));

    expect(await screen.findByText("復元に失敗しました。時間をおいて再度お試しください。")).toBeDefined();
    expect(screen.getByRole("button", { name: "この会員を復元する" })).toBeDefined();
  });

  it("pending 中は復元中表示で disabled になり、連打しても restore POST は 1 回だけ", async () => {
    let resolveRestore: ((value: Response) => void) | undefined;
    const pendingRestore = new Promise<Response>((resolve) => {
      resolveRestore = resolve;
    });
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(okJson(mkDetail(true)))
      .mockImplementationOnce(() => pendingRestore);

    renderDrawer();

    const restoreButton = await screen.findByRole("button", { name: "この会員を復元する" });
    fireEvent.click(restoreButton);
    fireEvent.click(restoreButton);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "復元中…" }).hasAttribute("disabled")).toBe(true),
    );
    expect(restoreFetchCalls(fetchMock)).toHaveLength(1);

    resolveRestore?.(okJson({ id: "m1", restoredAt: "2026-06-12T00:00:00.000Z" }));

    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "復元中…" })).toBeNull(),
    );
  });
});
