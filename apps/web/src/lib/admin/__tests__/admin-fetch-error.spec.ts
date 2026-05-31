import { describe, expect, it } from "vitest";

import { AdminFetchError, isAdminFetchError } from "../server-fetch";

describe("AdminFetchError", () => {
  it("keeps the existing message shape and exposes structured fields", () => {
    const error = new AdminFetchError({
      path: "/admin/dashboard",
      status: 404,
      responseBody: "error code: 1042",
    });

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("AdminFetchError");
    expect(error.message).toBe(
      "admin api /admin/dashboard failed: 404 body=error code: 1042",
    );
    expect(error.status).toBe(404);
    expect(error.path).toBe("/admin/dashboard");
    expect(error.responseBodySnippet).toBe("error code: 1042");
  });

  it("keeps message body suffix at 256 chars and metadata snippet at 500 chars", () => {
    const error = new AdminFetchError({
      path: "/admin/dashboard",
      status: 500,
      responseBody: "x".repeat(600),
    });

    expect(error.message).toBe(
      `admin api /admin/dashboard failed: 500 body=${"x".repeat(256)}`,
    );
    expect(error.responseBodySnippet).toBe("x".repeat(500));
  });

  it("keeps empty response body metadata distinct from unreadable body", () => {
    const emptyBody = new AdminFetchError({
      path: "/admin/dashboard",
      status: 502,
      responseBody: "",
    });
    const unreadableBody = new AdminFetchError({
      path: "/admin/dashboard",
      status: 503,
      responseBody: null,
    });

    expect(emptyBody.message).toBe("admin api /admin/dashboard failed: 502");
    expect(emptyBody.responseBodySnippet).toBe("");
    expect(unreadableBody.message).toBe("admin api /admin/dashboard failed: 503");
    expect(unreadableBody.responseBodySnippet).toBeNull();
  });

  it("redacts common PII before exposing body snippets", () => {
    const error = new AdminFetchError({
      path: "/admin/dashboard",
      status: 500,
      responseBody: "email=user@example.com phone=090-1234-5678",
    });

    expect(error.message).toBe(
      "admin api /admin/dashboard failed: 500 body=email=[masked-email] phone=[masked-phone]",
    );
    expect(error.responseBodySnippet).toBe(
      "email=[masked-email] phone=[masked-phone]",
    );
  });

  it("recognizes native instances and name-compatible Error objects", () => {
    const nativeError = new AdminFetchError({
      path: "/admin/dashboard",
      status: 404,
      responseBody: "not found",
    });
    const nameCompatibleError = Object.assign(new Error(nativeError.message), {
      name: "AdminFetchError",
      path: "/admin/dashboard",
      status: 404,
      responseBodySnippet: "not found",
    });

    expect(isAdminFetchError(nativeError)).toBe(true);
    expect(isAdminFetchError(nameCompatibleError)).toBe(true);
    expect(isAdminFetchError(new Error("AdminFetchError"))).toBe(false);
  });
});
