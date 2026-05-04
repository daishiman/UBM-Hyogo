import { afterEach, describe, expect, it } from "vitest";
import {
  mockFetchNetworkError,
  mockFetchOnce,
  mockFetchSequence,
  restoreFetch,
} from "./fetch-mock";

describe("fetch-mock test helper", () => {
  afterEach(() => {
    restoreFetch();
  });

  it("mockFetchOnce returns JSON responses with default status and headers", async () => {
    const spy = mockFetchOnce({ body: { ok: true } });

    const response = await fetch("/x");

    expect(spy).toHaveBeenCalledWith("/x");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/json");
    expect(await response.json()).toEqual({ ok: true });
  });

  it("mockFetchOnce supports raw body and custom headers", async () => {
    mockFetchOnce({
      status: 202,
      rawBody: "accepted",
      headers: { "x-test": "1" },
    });

    const response = await fetch("/x");

    expect(response.status).toBe(202);
    expect(response.headers.get("x-test")).toBe("1");
    expect(await response.text()).toBe("accepted");
  });

  it("mockFetchSequence queues responses in order", async () => {
    mockFetchSequence([{ body: { step: 1 } }, { body: { step: 2 } }]);

    await expect(fetch("/a").then((r) => r.json())).resolves.toEqual({
      step: 1,
    });
    await expect(fetch("/b").then((r) => r.json())).resolves.toEqual({
      step: 2,
    });
  });

  it("mockFetchNetworkError rejects with TypeError", async () => {
    mockFetchNetworkError("offline");

    await expect(fetch("/x")).rejects.toThrow("offline");
  });

  it("restoreFetch is safe when no spy is active", () => {
    restoreFetch();
    restoreFetch();
    expect(typeof fetch).toBe("function");
  });
});
