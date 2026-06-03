// @vitest-environment node
// issue-1031 Phase 4/6: /api/me/photo proxy route handler の透過動作を検証。
// fetchAuthed を mock し、multipart POST / DELETE 転送と status passthrough を確認する。

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockFetchAuthed } = vi.hoisted(() => ({ mockFetchAuthed: vi.fn() }));

vi.mock("@/lib/fetch/authed", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/fetch/authed")>("@/lib/fetch/authed");
  return {
    ...actual,
    fetchAuthed: mockFetchAuthed,
  };
});

import { FetchAuthedError, AuthRequiredError } from "@/lib/fetch/authed";
import { POST, DELETE } from "../route";

const multipartReq = (): Request => {
  const fd = new FormData();
  fd.append("file", new File([new Uint8Array(1024)], "p.jpg", { type: "image/jpeg" }));
  return new Request("http://localhost/api/me/photo", { method: "POST", body: fd });
};

afterEach(() => mockFetchAuthed.mockReset());
beforeEach(() => mockFetchAuthed.mockReset());

describe("proxy: POST /api/me/photo → API Worker /me/photo", () => {
  it("PROXY-1: multipart POST → API Worker に 200 で透過される", async () => {
    mockFetchAuthed.mockResolvedValueOnce({ ok: true });
    const res = await POST(multipartReq());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("PROXY-2: fetchAuthed に path=/me/photo・method=POST・FormData body で委譲（cookie 転送は fetchAuthed が担保）", async () => {
    mockFetchAuthed.mockResolvedValueOnce({ ok: true });
    await POST(multipartReq());
    expect(mockFetchAuthed).toHaveBeenCalledTimes(1);
    const [path, init] = mockFetchAuthed.mock.calls[0]!;
    expect(path).toBe("/me/photo");
    expect(init?.method).toBe("POST");
    expect(init?.body).toBeInstanceOf(FormData);
  });

  it("PROXY-3: API Worker 413 → proxy が 413 をそのまま返す", async () => {
    mockFetchAuthed.mockRejectedValueOnce(new FetchAuthedError(413, '{"error":"file too large"}'));
    const res = await POST(multipartReq());
    expect(res.status).toBe(413);
  });

  it("PROXY-4: API Worker 415 → proxy が 415 をそのまま返す", async () => {
    mockFetchAuthed.mockRejectedValueOnce(new FetchAuthedError(415, '{"error":"unsupported"}'));
    const res = await POST(multipartReq());
    expect(res.status).toBe(415);
  });

  it("PROXY-5: API Worker 401（AuthRequiredError）→ proxy が 401 を返す", async () => {
    mockFetchAuthed.mockRejectedValueOnce(new AuthRequiredError());
    const res = await POST(multipartReq());
    expect(res.status).toBe(401);
  });

  it("PROXY-6: API Worker 403 → proxy が 403 をそのまま返す", async () => {
    mockFetchAuthed.mockRejectedValueOnce(new FetchAuthedError(403, '{"error":"rules"}'));
    const res = await POST(multipartReq());
    expect(res.status).toBe(403);
  });

  it("PROXY-7: API Worker 429 → proxy が 429 をそのまま返す", async () => {
    mockFetchAuthed.mockRejectedValueOnce(new FetchAuthedError(429, '{"error":"rate"}'));
    const res = await POST(multipartReq());
    expect(res.status).toBe(429);
  });
});

describe("proxy: DELETE /api/me/photo → API Worker /me/photo", () => {
  it("PROXY-8/9: DELETE → API Worker に DELETE で転送・200 + body {ok:true}", async () => {
    mockFetchAuthed.mockResolvedValueOnce({ ok: true });
    const res = await DELETE();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    const [path, init] = mockFetchAuthed.mock.calls[0]!;
    expect(path).toBe("/me/photo");
    expect(init?.method).toBe("DELETE");
  });

  it("PROXY-10: DELETE API Worker 404 → proxy が 404 をそのまま返す", async () => {
    mockFetchAuthed.mockRejectedValueOnce(new FetchAuthedError(404, '{"error":"not found"}'));
    const res = await DELETE();
    expect(res.status).toBe(404);
  });
});
