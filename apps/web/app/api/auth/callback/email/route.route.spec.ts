// 05b-B Phase 4: GET /api/auth/callback/email route contract test。
// AC-1: 404 にならない / AC-2: success で signIn() に到達 / AC-3: failure redirect 整合。

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const signInMock = vi.fn();
const verifyMock = vi.fn();

vi.mock("../../../../../src/lib/auth", () => ({
  getAuth: async () => ({
    signIn: (...args: unknown[]) => signInMock(...args),
  }),
}));

vi.mock("../../../../../src/lib/auth/verify-magic-link", async () => {
  const actual = await vi.importActual<
    typeof import("../../../../../src/lib/auth/verify-magic-link")
  >("../../../../../src/lib/auth/verify-magic-link");
  return {
    ...actual,
    verifyMagicLink: (...args: unknown[]) => verifyMock(...args),
  };
});

import { GET, POST } from "./route";

const VALID_TOKEN = "a".repeat(64);
const VALID_EMAIL = "user@example.com";
const ORIGIN = "http://localhost:3000";

const makeReq = (qs: string) =>
  new Request(`${ORIGIN}/api/auth/callback/email${qs}`) as unknown as Parameters<typeof GET>[0];

const errorParam = (res: Response): string | null => {
  const loc = res.headers.get("location");
  if (!loc) return null;
  return new URL(loc).searchParams.get("error");
};

beforeEach(() => {
  signInMock.mockReset();
  verifyMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GET /api/auth/callback/email", () => {
  it("AC-1: token+email 揃いでも 404 を返さない (verify success → signIn 到達)", async () => {
    verifyMock.mockResolvedValue({
      ok: true,
      user: {
        email: VALID_EMAIL,
        memberId: "m_1",
        responseId: "r_1",
        isAdmin: false,
        authGateState: "active",
      },
    });
    signInMock.mockResolvedValue(
      new Response(null, { status: 302, headers: { location: "/" } }),
    );
    const res = await GET(
      makeReq(`?token=${VALID_TOKEN}&email=${encodeURIComponent(VALID_EMAIL)}`),
    );
    expect(res.status).not.toBe(404);
    expect(signInMock).toHaveBeenCalledWith("magic-link", expect.objectContaining({
      verifiedUser: expect.any(String),
      redirect: true,
      redirectTo: "/",
    }));
  });

  it("AC-3: token 欠落 → /login?error=missing_token", async () => {
    const res = await GET(makeReq(`?email=${encodeURIComponent(VALID_EMAIL)}`));
    expect([302, 303, 307]).toContain(res.status);
    expect(errorParam(res)).toBe("missing_token");
    expect(verifyMock).not.toHaveBeenCalled();
    expect(signInMock).not.toHaveBeenCalled();
  });

  it("AC-3: email 欠落 → /login?error=missing_email", async () => {
    const res = await GET(makeReq(`?token=${VALID_TOKEN}`));
    expect(errorParam(res)).toBe("missing_email");
    expect(verifyMock).not.toHaveBeenCalled();
  });

  it("AC-3: token 形式違反 → /login?error=invalid_link", async () => {
    const res = await GET(
      makeReq(`?token=zzz&email=${encodeURIComponent(VALID_EMAIL)}`),
    );
    expect(errorParam(res)).toBe("invalid_link");
    expect(verifyMock).not.toHaveBeenCalled();
  });

  it("AC-3: email 形式違反 → /login?error=invalid_link", async () => {
    const res = await GET(makeReq(`?token=${VALID_TOKEN}&email=not-an-email`));
    expect(errorParam(res)).toBe("invalid_link");
  });

  it.each([
    ["expired", "expired"],
    ["already_used", "already_used"],
    ["not_found", "invalid_link"],
    ["resolve_failed", "resolve_failed"],
    ["temporary_failure", "temporary_failure"],
  ])("AC-3: verify reason=%s → /login?error=%s", async (reason, expected) => {
    verifyMock.mockResolvedValue({ ok: false, reason });
    const res = await GET(
      makeReq(`?token=${VALID_TOKEN}&email=${encodeURIComponent(VALID_EMAIL)}`),
    );
    expect(errorParam(res)).toBe(expected);
    expect(signInMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/auth/callback/email", () => {
  it("405 を返す", async () => {
    const res = await POST();
    expect(res.status).toBe(405);
  });
});
