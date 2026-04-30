import { describe, expect, it } from "vitest";

import { ApiError, isApiError, UBM_ERROR_CODES } from "./errors";

describe("ApiError", () => {
  it("uses defaults from UBM_ERROR_CODES", () => {
    const e = new ApiError({ code: "UBM-1001" });
    expect(e.code).toBe("UBM-1001");
    expect(e.status).toBe(UBM_ERROR_CODES["UBM-1001"].status);
    expect(e.title).toBe(UBM_ERROR_CODES["UBM-1001"].title);
    expect(e.detail).toBe(UBM_ERROR_CODES["UBM-1001"].defaultDetail);
    expect(e.type).toBe("urn:ubm:error:UBM-1001");
    expect(e.instance.startsWith("urn:uuid:")).toBe(true);
    expect(e.traceId).toBe(e.instance);
    expect(e.log).toEqual({});
    expect(e.name).toBe("ApiError");
  });

  it("respects overrides for status/title/detail/type/instance/traceId/log", () => {
    const log = { stack: "stack", context: { k: "v" } };
    const e = new ApiError({
      code: "UBM-5000",
      status: 599,
      title: "T",
      detail: "D",
      type: "urn:custom",
      instance: "urn:uuid:fixed",
      traceId: "trace-1",
      log,
    });
    expect(e.status).toBe(599);
    expect(e.title).toBe("T");
    expect(e.detail).toBe("D");
    expect(e.type).toBe("urn:custom");
    expect(e.instance).toBe("urn:uuid:fixed");
    expect(e.traceId).toBe("trace-1");
    expect(e.log).toBe(log);
  });

  it("rejects invalid code", () => {
    expect(() => new ApiError({ code: "UBM-9999" as never })).toThrow(/Invalid UBM error code/);
  });

  it("toClientJSON omits log fields", () => {
    const e = new ApiError({ code: "UBM-1404", log: { stack: "x" } });
    const json = e.toClientJSON();
    expect(json.code).toBe("UBM-1404");
    expect(json).not.toHaveProperty("stack");
  });

  it("toLogJSON merges log extras", () => {
    const e = new ApiError({ code: "UBM-5001", log: { sqlStatement: "SELECT 1" } });
    const json = e.toLogJSON();
    expect(json.sqlStatement).toBe("SELECT 1");
    expect(json.code).toBe("UBM-5001");
  });

  it("isApiError narrows correctly", () => {
    expect(isApiError(new ApiError({ code: "UBM-1000" }))).toBe(true);
    expect(isApiError(new Error("nope"))).toBe(false);
    expect(isApiError(null)).toBe(false);
  });
});

describe("ApiError.fromUnknown", () => {
  it("returns same instance when given ApiError", () => {
    const orig = new ApiError({ code: "UBM-1000" });
    expect(ApiError.fromUnknown(orig)).toBe(orig);
  });

  it("wraps generic Error with stack and originalMessage", () => {
    const src = new Error("boom");
    const e = ApiError.fromUnknown(src, "UBM-5000");
    expect(e.code).toBe("UBM-5000");
    expect(e.log.cause).toBe(src);
    expect(e.log.context).toMatchObject({ originalMessage: "boom", originalName: "Error" });
    expect(e.log.stack).toBe(src.stack);
  });

  it("wraps Error without stack", () => {
    const src = new Error("ns");
    delete (src as { stack?: string }).stack;
    const e = ApiError.fromUnknown(src);
    expect(e.log.stack).toBeUndefined();
  });

  it("wraps string", () => {
    const e = ApiError.fromUnknown("plain text");
    expect(e.code).toBe("UBM-5000");
    expect(e.log.context).toEqual({ originalMessage: "plain text" });
  });

  it("wraps arbitrary object via safeStringify", () => {
    const e = ApiError.fromUnknown({ foo: 1 });
    expect(e.log.context?.original).toBe('{"foo":1}');
  });

  it("wraps unserializable object via safeStringify catch path", () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    const e = ApiError.fromUnknown(circular);
    expect(e.log.context?.original).toBe("[unserializable]");
  });

  it("uses fallback code parameter", () => {
    const e = ApiError.fromUnknown("x", "UBM-6001");
    expect(e.code).toBe("UBM-6001");
  });
});
