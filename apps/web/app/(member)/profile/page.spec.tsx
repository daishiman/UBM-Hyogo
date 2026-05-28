import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ProfilePage from "./page";
import { fetchAuthed } from "@/lib/fetch/authed";

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
}));

vi.mock("@/lib/fetch/authed", () => ({
  AuthRequiredError,
  FetchAuthedError,
  fetchAuthed: vi.fn(),
}));

const mockedFetchAuthed = vi.mocked(fetchAuthed);

afterEach(() => cleanup());

describe("ProfilePage safe fetch degrade", () => {
  beforeEach(() => {
    notFound.mockReset();
    redirect.mockReset();
    mockedFetchAuthed.mockReset();
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

  it("degrades /me fetch failures without reaching the profile fetch", async () => {
    mockedFetchAuthed.mockRejectedValueOnce(
      new Error("fetchAuthed failed: 503"),
    );

    render(await ProfilePage());

    expect(redirect).not.toHaveBeenCalled();
    expect(mockedFetchAuthed).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("alert").textContent).toContain(
      "マイページを読み込めませんでした",
    );
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
});
