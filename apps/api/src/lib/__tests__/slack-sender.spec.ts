// UT-17 T6: Slack Incoming Webhook 送信 + retry unit tests
import { describe, it, expect, vi } from "vitest";
import { sendSlackMessage } from "../slack-sender";
import type { SlackBlockKitMessage } from "../cloudflare-alert-formatter";

const MSG: SlackBlockKitMessage = { blocks: [], text: "test" };
const URL = "https://hooks.slack.com/services/T/B/X";

const mockResponse = (status: number): Response =>
  new Response("", { status });

describe("sendSlackMessage", () => {
  it("SEND-01: 200 即返却で attempts=1, ok=true", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse(200));
    const result = await sendSlackMessage(URL, MSG, {
      fetch: fetchMock as unknown as typeof fetch,
      sleep: async () => {},
    });
    expect(result).toMatchObject({ ok: true, status: 200, attempts: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("SEND-02: 5xx → 5xx → 200 で attempts=3, ok=true", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockResponse(500))
      .mockResolvedValueOnce(mockResponse(503))
      .mockResolvedValueOnce(mockResponse(200));
    const result = await sendSlackMessage(URL, MSG, {
      fetch: fetchMock as unknown as typeof fetch,
      sleep: async () => {},
    });
    expect(result).toMatchObject({ ok: true, status: 200, attempts: 3 });
  });

  it("SEND-03: 4xx は即時失敗（retry なし）", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse(404));
    const result = await sendSlackMessage(URL, MSG, {
      fetch: fetchMock as unknown as typeof fetch,
      sleep: async () => {},
    });
    expect(result.ok).toBe(false);
    expect(result.attempts).toBe(1);
    expect(result.status).toBe(404);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("SEND-04: 5xx 連続 maxRetries 到達で ok=false", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse(502));
    const result = await sendSlackMessage(URL, MSG, {
      fetch: fetchMock as unknown as typeof fetch,
      maxRetries: 3,
      sleep: async () => {},
    });
    expect(result.ok).toBe(false);
    expect(result.attempts).toBe(3);
    expect(result.status).toBe(502);
  });

  it("SEND-05: fetch throw も retry 対象", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(mockResponse(200));
    const result = await sendSlackMessage(URL, MSG, {
      fetch: fetchMock as unknown as typeof fetch,
      sleep: async () => {},
    });
    expect(result).toMatchObject({ ok: true, attempts: 2 });
  });

  it("SEND-06: Slack 429 は retry 対象", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(mockResponse(429))
      .mockResolvedValueOnce(mockResponse(200));
    const result = await sendSlackMessage(URL, MSG, {
      fetch: fetchMock as unknown as typeof fetch,
      sleep: async () => {},
    });
    expect(result).toMatchObject({ ok: true, status: 200, attempts: 2 });
  });

  it("SEND-07: fetch error は URL を含む message を返さない", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error(`failed ${URL}`));
    const result = await sendSlackMessage(URL, MSG, {
      fetch: fetchMock as unknown as typeof fetch,
      maxRetries: 1,
      sleep: async () => {},
    });
    expect(result.ok).toBe(false);
    expect(result.error).not.toContain(URL);
    expect(result.error).toBe("Error");
  });
});
