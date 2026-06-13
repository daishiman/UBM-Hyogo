import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ProfilePage from "./page";
import { fetchAuthed } from "@/lib/fetch/authed";
import { getStats } from "@/lib/api/public";

const { notFound, redirect, AuthRequiredError, FetchAuthedError } = vi.hoisted(
  () => {
    class MockAuthRequiredError extends Error {
      constructor() {
        super("AUTH_REQUIRED");
        this.name = "AuthRequiredError";
      }
    }

    class MockFetchAuthedError extends Error {
      readonly status: number;
      readonly bodyText: string;

      constructor(status: number, bodyText: string) {
        super(`fetchAuthed failed: ${status}`);
        this.name = "FetchAuthedError";
        this.status = status;
        this.bodyText = bodyText;
      }
    }

    return {
      notFound: vi.fn(),
      redirect: vi.fn(),
      AuthRequiredError: MockAuthRequiredError,
      FetchAuthedError: MockFetchAuthedError,
    };
  },
);

vi.mock("next/navigation", () => ({
  notFound: () => {
    notFound();
    throw new Error("NEXT_NOT_FOUND");
  },
  redirect: (path: string) => {
    redirect(path);
    throw new Error("NEXT_REDIRECT");
  },
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

vi.mock("@/lib/fetch/authed", () => ({
  AuthRequiredError,
  FetchAuthedError,
  fetchAuthed: vi.fn(),
}));

vi.mock("@/lib/api/public", () => ({
  getStats: vi.fn(),
}));

const mockedFetchAuthed = vi.mocked(fetchAuthed);
const mockedGetStats = vi.mocked(getStats);

const baseSession = (isAdmin: boolean) => ({
  user: {
    memberId: "m_1",
    responseId: "r_1",
    email: "member@example.com",
    isAdmin,
    authGateState: "active" as const,
  },
  authGateState: "active" as const,
});

const baseProfile = {
  profile: {
    sections: [],
    attendance: [],
    attendanceMeta: { hasMore: false, nextCursor: null },
  },
  statusSummary: {
    publicConsent: "consented",
    rulesConsent: "consented",
    publishState: "public",
    isDeleted: false,
  },
  editResponseUrl: null,
  fallbackResponderUrl: "https://docs.google.com/forms/d/e/FORM/viewform",
  pendingRequests: {},
  photoUrl: undefined,
};

const baseStats = {
  memberCount: 1,
  publicMemberCount: 1,
  zoneBreakdown: [],
  membershipBreakdown: [],
  meetingCountThisYear: 0,
  recentMeetings: [],
  lastSync: {
    schemaSync: "ok" as const,
    responseSync: "ok" as const,
    schemaSyncFinishedAt: "2026-06-12T00:00:00Z",
    responseSyncFinishedAt: "2026-06-12T00:00:00Z",
  },
  generatedAt: "2026-06-12T00:00:00Z",
};

afterEach(() => cleanup());

describe("ProfilePage safe fetch degrade", () => {
  beforeEach(() => {
    notFound.mockReset();
    redirect.mockReset();
    mockedFetchAuthed.mockReset();
    mockedGetStats.mockReset();
    mockedGetStats.mockResolvedValue(baseStats);
  });

  it("keeps auth gate fatal but degrades profile fetch failures", async () => {
    mockedFetchAuthed
      .mockResolvedValueOnce({
        user: {
          memberId: "m_1",
          responseId: "r_1",
          email: "member@example.com",
          isAdmin: false,
          authGateState: "active",
        },
        authGateState: "active",
      })
      .mockRejectedValueOnce(new Error("fetchAuthed failed: 503"));

    render(await ProfilePage());

    expect(redirect).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toContain(
      "プロフィールを読み込めませんでした",
    );
  });

  it("degrades /me fetch failures without throwing a server component error", async () => {
    mockedFetchAuthed.mockRejectedValueOnce(new FetchAuthedError(503, "down"));

    const { container } = render(await ProfilePage());

    expect(redirect).not.toHaveBeenCalled();
    expect(mockedFetchAuthed).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("alert").textContent).toContain(
      "セッション情報を取得できませんでした",
    );
    expect(screen.getByRole("alert").textContent).toContain(
      "サーバー側でセッション確認に失敗しました。",
    );
    expect(screen.getByRole("alert").getAttribute("data-cause")).toBe(
      "session-5xx",
    );
    expect(container.innerHTML).not.toContain("fetchAuthed failed: 503");
  });

  it("distinguishes deleted-member /me failures", async () => {
    mockedFetchAuthed.mockRejectedValueOnce(new FetchAuthedError(410, "deleted"));

    render(await ProfilePage());

    expect(screen.getByRole("alert").textContent).toContain(
      "アカウントの利用状態を確認できませんでした。",
    );
    expect(screen.getByRole("alert").getAttribute("data-cause")).toBe(
      "session-410",
    );
  });

  it("distinguishes transport /me failures", async () => {
    mockedFetchAuthed.mockRejectedValueOnce(new Error("network timeout"));

    render(await ProfilePage());

    expect(screen.getByRole("alert").textContent).toContain(
      "通信経路でセッション確認に失敗しました。",
    );
    expect(screen.getByRole("alert").getAttribute("data-cause")).toBe(
      "session-failed",
    );
  });

  it("renders a re-login CTA for /me 404 without exposing the raw fetch error", async () => {
    mockedFetchAuthed.mockRejectedValueOnce(new FetchAuthedError(404, "missing"));

    const { container } = render(await ProfilePage());

    expect(redirect).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toContain(
      "再ログインしてください。",
    );
    expect(screen.getByRole("link", { name: "再ログイン" }).getAttribute("href")).toBe(
      "/login?redirect=/profile",
    );
    expect(screen.getByRole("alert").getAttribute("data-cause")).toBe(
      "session-404",
    );
    expect(container.innerHTML).not.toContain("fetchAuthed failed: 404");
  });

  it("redirects when /me requires auth", async () => {
    mockedFetchAuthed.mockRejectedValueOnce(new AuthRequiredError());

    await expect(ProfilePage()).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("/login?redirect=/profile");
  });

  it("keeps notFound for missing member profile", async () => {
    mockedFetchAuthed
      .mockResolvedValueOnce({
        user: {
          memberId: "m_1",
          responseId: "r_1",
          email: "member@example.com",
          isAdmin: false,
          authGateState: "active",
        },
        authGateState: "active",
      })
      .mockRejectedValueOnce(new FetchAuthedError(404, "missing"));

    await expect(ProfilePage()).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFound).toHaveBeenCalledTimes(1);
  });

  it("renders admin access notice only for admin sessions", async () => {
    mockedFetchAuthed
      .mockResolvedValueOnce(baseSession(true))
      .mockResolvedValueOnce(baseProfile);

    render(await ProfilePage());

    expect(screen.getByTestId("profile-admin-access-notice")).toBeTruthy();
    expect(screen.getByRole("link", { name: "管理画面を開く" }).getAttribute("href")).toBe(
      "/admin",
    );
  });

  it("does not render admin access notice for non-admin sessions", async () => {
    mockedFetchAuthed
      .mockResolvedValueOnce(baseSession(false))
      .mockResolvedValueOnce(baseProfile);

    const { container } = render(await ProfilePage());

    expect(container.querySelector('[data-testid="profile-admin-access-notice"]')).toBeNull();
    expect(screen.queryByRole("link", { name: "管理画面を開く" })).toBeNull();
  });

  it("does not render admin access notice on profile fetch degrade", async () => {
    mockedFetchAuthed
      .mockResolvedValueOnce(baseSession(true))
      .mockRejectedValueOnce(new Error("fetchAuthed failed: 503"));

    const { container } = render(await ProfilePage());

    expect(screen.getByRole("alert").textContent).toContain(
      "プロフィールを読み込めませんでした",
    );
    expect(container.querySelector('[data-testid="profile-admin-access-notice"]')).toBeNull();
  });
});

// task-c-public-member-sidebar-shell-integration:
// shell が header を所有するため、profile page は degrade 分岐でも旧 header を mount しない（AC-C6）。
describe("ProfilePage は旧 header を mount しない (shell 統合回帰 guard)", () => {
  beforeEach(() => {
    notFound.mockReset();
    redirect.mockReset();
    mockedFetchAuthed.mockReset();
    mockedGetStats.mockReset();
    mockedGetStats.mockResolvedValue(baseStats);
  });

  it("PR-2: /me 失敗 degrade 分岐で member-header マーカーが出ない", async () => {
    mockedFetchAuthed.mockRejectedValueOnce(new FetchAuthedError(503, "down"));
    const { container } = render(await ProfilePage());
    expect(container.querySelector('[data-testid="member-header"]')).toBeNull();
  });

  it("PR-3: profile 失敗 degrade 分岐で member-header マーカーが出ない", async () => {
    mockedFetchAuthed
      .mockResolvedValueOnce({
        user: {
          memberId: "m_1",
          responseId: "r_1",
          email: "member@example.com",
          isAdmin: false,
          authGateState: "active",
        },
        authGateState: "active",
      })
      .mockRejectedValueOnce(new Error("fetchAuthed failed: 503"));
    const { container } = render(await ProfilePage());
    expect(container.querySelector('[data-testid="member-header"]')).toBeNull();
  });
});
