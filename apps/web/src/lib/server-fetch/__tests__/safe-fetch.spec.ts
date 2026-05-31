import { describe, expect, it } from "vitest";

import { safeServerFetch } from "../safe-fetch";

class AuthRequiredError extends Error {}

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
});
