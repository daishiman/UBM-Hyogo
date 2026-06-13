import { afterEach, describe, expect, it, vi } from "vitest";

import { safeServerFetch } from "../safe-fetch";

class AuthRequiredError extends Error {}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("safeServerFetch", () => {
  it("returns ok=true on success", async () => {
    await expect(safeServerFetch(async () => 42)).resolves.toEqual({
      ok: true,
      data: 42,
    });
  });

  it("extracts a status code from failed fetch messages", async () => {
    const result = await safeServerFetch(
      async () => {
        throw new Error("fetchPublic failed: /public/members 503");
      },
      { codePrefix: "PUBLIC_FETCH" },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("PUBLIC_FETCH_503");
  });

  it("prefers a structured integer status field over message parsing", async () => {
    const result = await safeServerFetch(
      async () => {
        throw Object.assign(new Error("opaque fetch failure"), { status: 404 });
      },
      { codePrefix: "ADMIN_FETCH" },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("ADMIN_FETCH_404");
  });

  it("ignores non-integer status fields and keeps message fallback behavior", async () => {
    const result = await safeServerFetch(
      async () => {
        throw Object.assign(new Error("fetchPublic failed: /public/members 503"), {
          status: 3.14,
        });
      },
      { codePrefix: "PUBLIC_FETCH" },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("PUBLIC_FETCH_503");
  });

  it("falls back to *_FAILED when neither structured status nor message status is usable", async () => {
    const result = await safeServerFetch(
      async () => {
        throw Object.assign(new Error("opaque fetch failure"), {
          status: Number.NaN,
        });
      },
      { codePrefix: "ADMIN_FETCH" },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("ADMIN_FETCH_FAILED");
  });

  it("falls back to *_FAILED for generic Error", async () => {
    const result = await safeServerFetch(
      async () => {
        throw new Error("network timeout");
      },
      { codePrefix: "MEMBER_FETCH" },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("MEMBER_FETCH_FAILED");
  });

  it("returns *_UNKNOWN for non-Error throws", async () => {
    const result = await safeServerFetch(
      async () => {
        throw "bad";
      },
      { codePrefix: "PUBLIC_FETCH", unknownMessage: "unknown public error" },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("PUBLIC_FETCH_UNKNOWN");
      expect(result.error.message).toBe("unknown public error");
    }
  });

  it("rethrows allowlisted errors", async () => {
    await expect(
      safeServerFetch(
        async () => {
          throw new AuthRequiredError("auth required");
        },
        { rethrowOn: [AuthRequiredError] },
      ),
    ).rejects.toBeInstanceOf(AuthRequiredError);
  });

  it("logs structured diagnostics when logPath is provided", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await safeServerFetch(
      async () => {
        throw Object.assign(new Error("fetchAuthed failed: 410"), {
          status: 410,
          transport: { transportKind: "service-binding", baseHost: "service-binding.local" },
        });
      },
      { codePrefix: "MEMBER_SESSION", logPath: "/me" },
    );

    expect(result.ok).toBe(false);
    expect(errorSpy).toHaveBeenCalledWith("server_fetch_failed", {
      code: "MEMBER_SESSION_410",
      path: "/me",
      status: 410,
      transportKind: "service-binding",
      baseHost: "service-binding.local",
    });
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain("memberId");
  });

  it("logs transport diagnostics for transport failures without status", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await safeServerFetch(
      async () => {
        throw Object.assign(new Error("API transport fetch failed"), {
          transport: { transportKind: "http", baseHost: "api.example.com" },
        });
      },
      { codePrefix: "MEMBER_SESSION", logPath: "/me" },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.transport).toEqual({
        transportKind: "http",
        baseHost: "api.example.com",
      });
    }
    expect(errorSpy).toHaveBeenCalledWith("server_fetch_failed", {
      code: "MEMBER_SESSION_FAILED",
      path: "/me",
      status: null,
      transportKind: "http",
      baseHost: "api.example.com",
    });
  });

  it("omits transport descriptor when transportKind is not an allowed value", async () => {
    const result = await safeServerFetch(
      async () => {
        throw Object.assign(new Error("weird transport"), {
          transport: { transportKind: "websocket", baseHost: "api.example.com" },
        });
      },
      { codePrefix: "MEMBER_SESSION" },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.transport).toBeUndefined();
  });

  it("omits transport descriptor when baseHost is not a string", async () => {
    const result = await safeServerFetch(
      async () => {
        throw Object.assign(new Error("weird transport"), {
          transport: { transportKind: "http", baseHost: 123 },
        });
      },
      { codePrefix: "MEMBER_SESSION" },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.transport).toBeUndefined();
  });

  it("omits transport descriptor when transport is explicitly null", async () => {
    const result = await safeServerFetch(
      async () => {
        throw Object.assign(new Error("null transport"), { transport: null });
      },
      { codePrefix: "MEMBER_SESSION" },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.transport).toBeUndefined();
  });

  it("does not log diagnostics unless logPath is provided", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await safeServerFetch(
      async () => {
        throw new Error("network timeout");
      },
      { codePrefix: "MEMBER_SESSION" },
    );

    expect(errorSpy).not.toHaveBeenCalled();
  });
});
