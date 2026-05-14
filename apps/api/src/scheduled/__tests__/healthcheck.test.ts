import { describe, expect, it, vi } from "vitest";
import type { Env } from "../../env";
import { runAlertRelayHealthcheck } from "../healthcheck";

const SECRET = "test-secret";
const SLACK_URL = "https://hooks.slack.com/services/T/B/X";

const env = (overrides: Partial<Env> = {}) =>
  ({
    CF_WEBHOOK_AUTH_SECRET: SECRET,
    SLACK_WEBHOOK_URL: SLACK_URL,
    ...overrides,
  }) as Env;

const controller = (scheduledTime: string, cron = "0 18 * * *") =>
  ({
    scheduledTime: Date.parse(scheduledTime),
    cron,
  }) as ScheduledController;

describe("runAlertRelayHealthcheck", () => {
  it("skips the shared daily cron on non-Monday UTC", async () => {
    const fetchMock = vi.fn();
    await runAlertRelayHealthcheck(
      env(),
      controller("2026-05-12T18:00:00.000Z"),
      { fetch: fetchMock as unknown as typeof fetch },
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts the weekly healthcheck payload on Monday UTC", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    await runAlertRelayHealthcheck(
      env({ SLACK_WEBHOOK_URL_HEALTHCHECK: "https://hooks.slack.com/services/HC" }),
      controller("2026-05-11T18:00:00.000Z"),
      { fetch: fetchMock as unknown as typeof fetch, sleep: async () => {} },
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://hooks.slack.com/services/HC");
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(String(init.body)) as {
      text: string;
      blocks: ReadonlyArray<unknown>;
    };
    expect(JSON.stringify(body)).toContain("UT-17 weekly healthcheck");
  });

  it("treats Slack 200 with non-ok body as failure and sends fallback mail", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("no_service", { status: 200 }))
      .mockResolvedValueOnce(new Response("no_service", { status: 200 }))
      .mockResolvedValueOnce(new Response("no_service", { status: 200 }))
      .mockResolvedValueOnce(new Response("", { status: 202 }));

    await runAlertRelayHealthcheck(
      env({
        HEALTHCHECK_FALLBACK_EMAIL: "ops@example.test",
        RESEND_API_KEY: "resend-test-key",
      }),
      controller("2026-05-11T18:00:00.000Z"),
      { fetch: fetchMock as unknown as typeof fetch, sleep: async () => {} },
    );

    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(fetchMock.mock.calls[3]?.[0]).toBe("https://api.resend.com/emails");
    const init = fetchMock.mock.calls[3]?.[1] as RequestInit;
    expect(String(init.body)).toContain("UT-17 alert relay weekly healthcheck failed");
    expect(String(init.body)).not.toContain(SLACK_URL);
  });

  it("does not reject when fallback mail delivery throws", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("no_service", { status: 200 }))
      .mockResolvedValueOnce(new Response("no_service", { status: 200 }))
      .mockResolvedValueOnce(new Response("no_service", { status: 200 }))
      .mockRejectedValueOnce(new Error("resend unavailable"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      runAlertRelayHealthcheck(
        env({
          HEALTHCHECK_FALLBACK_EMAIL: "ops@example.test",
          RESEND_API_KEY: "resend-test-key",
        }),
        controller("2026-05-11T18:00:00.000Z"),
        { fetch: fetchMock as unknown as typeof fetch, sleep: async () => {} },
      ),
    ).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
