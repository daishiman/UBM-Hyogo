// issue-1031 補完: me-photo-client の mapStatus 全分岐 + uploadOwnPhoto / deleteOwnPhoto
// の !res.ok 分岐（成功 / 各種エラーコード / body 読み取り失敗）を網羅する unit spec。
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  PhotoRequestError,
  deleteOwnPhoto,
  uploadOwnPhoto,
  type PhotoErrorCode,
} from "../me-photo-client";

const okResponse = () => new Response(null, { status: 204 });

const file = () => new File(["x"], "avatar.png", { type: "image/png" });

describe("uploadOwnPhoto", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("成功（res.ok）時は throw せず multipart POST を /api/me/photo へ送る", async () => {
    const fetchMock = vi.fn(async () => okResponse());
    vi.stubGlobal("fetch", fetchMock);

    await expect(uploadOwnPhoto(file())).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe("/api/me/photo");
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("same-origin");
    expect(init.body).toBeInstanceOf(FormData);
  });

  // status -> code の全分岐（mapStatus）を upload 経路で踏む。
  const statusCases: ReadonlyArray<
    readonly [number, string, PhotoErrorCode]
  > = [
    [415, "unsupported", "UNSUPPORTED_MEDIA_TYPE"],
    [413, "too large", "FILE_TOO_LARGE"],
    [403, "consent", "RULES_CONSENT_REQUIRED"],
    [429, "slow down", "RATE_LIMITED"],
    [401, "no session", "UNAUTHENTICATED"],
    [404, "not found", "NOT_FOUND"],
    [400, "empty file uploaded", "EMPTY_FILE"],
    [400, "bad shape", "INVALID_REQUEST"],
    [500, "boom", "UNKNOWN"],
  ];

  for (const [status, body, code] of statusCases) {
    it(`status=${status} body=${JSON.stringify(body)} → code=${code}`, async () => {
      const fetchMock = vi.fn(
        async () => new Response(body, { status }),
      );
      vi.stubGlobal("fetch", fetchMock);

      await expect(uploadOwnPhoto(file())).rejects.toMatchObject({
        name: "PhotoRequestError",
        status,
        code,
      });
    });
  }

  it("body 読み取りが失敗しても text catch で空文字となり code は status から決まる", async () => {
    const fetchMock = vi.fn(
      async () =>
        ({
          ok: false,
          status: 413,
          // text() reject → mapStatus は body 不要の 413 経路
          text: () => Promise.reject(new Error("stream error")),
        }) as unknown as Response,
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(uploadOwnPhoto(file())).rejects.toMatchObject({
      status: 413,
      code: "FILE_TOO_LARGE",
    });
  });

  it("400 で body 読み取り失敗（空文字）は INVALID_REQUEST（empty 非含有）", async () => {
    const fetchMock = vi.fn(
      async () =>
        ({
          ok: false,
          status: 400,
          text: () => Promise.reject(new Error("stream error")),
        }) as unknown as Response,
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(uploadOwnPhoto(file())).rejects.toMatchObject({
      status: 400,
      code: "INVALID_REQUEST",
    });
  });
});

describe("deleteOwnPhoto", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("成功時は DELETE /api/me/photo を送り throw しない", async () => {
    const fetchMock = vi.fn(async () => okResponse());
    vi.stubGlobal("fetch", fetchMock);

    await expect(deleteOwnPhoto()).resolves.toBeUndefined();

    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe("/api/me/photo");
    expect(init.method).toBe("DELETE");
    expect(init.credentials).toBe("same-origin");
  });

  it("!res.ok 時は body 付き PhotoRequestError を throw する", async () => {
    const fetchMock = vi.fn(
      async () => new Response("not found", { status: 404 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(deleteOwnPhoto()).rejects.toMatchObject({
      name: "PhotoRequestError",
      status: 404,
      code: "NOT_FOUND",
      message: "not found",
    });
  });

  it("body 読み取り失敗でも空文字 message で throw する", async () => {
    const fetchMock = vi.fn(
      async () =>
        ({
          ok: false,
          status: 401,
          text: () => Promise.reject(new Error("stream error")),
        }) as unknown as Response,
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(deleteOwnPhoto()).rejects.toMatchObject({
      status: 401,
      code: "UNAUTHENTICATED",
    });
  });
});

describe("PhotoRequestError", () => {
  it("message 省略時は code を message に使う", () => {
    const e = new PhotoRequestError(429, "RATE_LIMITED");
    expect(e.message).toBe("RATE_LIMITED");
    expect(e.name).toBe("PhotoRequestError");
    expect(e).toBeInstanceOf(Error);
  });

  it("message 指定時はそれを保持する", () => {
    const e = new PhotoRequestError(400, "INVALID_REQUEST", "bad shape");
    expect(e.message).toBe("bad shape");
  });
});
