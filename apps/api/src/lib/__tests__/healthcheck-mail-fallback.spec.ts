import { describe, expect, it, vi } from "vitest";
import type { Env } from "../../env";
import { sendHealthcheckFailureMail } from "../healthcheck-mail-fallback";

describe("sendHealthcheckFailureMail", () => {
  it("skips safely when fallback mail config is absent", async () => {
    const fetchMock = vi.fn();
    const result = await sendHealthcheckFailureMail({} as Env, "slack failed", {
      fetch: fetchMock as unknown as typeof fetch,
    });

    expect(result).toEqual({ ok: true, skipped: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends a redacted Resend request when configured", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 202 }));
    const result = await sendHealthcheckFailureMail(
      {
        HEALTHCHECK_FALLBACK_EMAIL: "ops@example.test",
        RESEND_API_KEY: "resend-test-key",
      } as Env,
      "alert relay healthcheck failed with status 502",
      {
        fetch: fetchMock as unknown as typeof fetch,
        now: () => new Date("2026-05-11T18:00:00.000Z"),
      },
    );

    expect(result).toEqual({ ok: true, status: 202 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.headers).toMatchObject({
      authorization: "Bearer resend-test-key",
      "content-type": "application/json",
    });
    expect(String(init.body)).toContain("ops@example.test");
    expect(String(init.body)).toContain("2026-05-11T18:00:00.000Z");
  });

  it("returns a failure result instead of throwing when Resend fetch rejects", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await sendHealthcheckFailureMail(
      {
        HEALTHCHECK_FALLBACK_EMAIL: "ops@example.test",
        RESEND_API_KEY: "resend-test-key",
      } as Env,
      "alert relay healthcheck failed with status 502",
      { fetch: fetchMock as unknown as typeof fetch },
    );

    expect(result).toEqual({ ok: false });
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
