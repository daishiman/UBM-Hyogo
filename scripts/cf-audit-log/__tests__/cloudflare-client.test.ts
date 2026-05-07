import { describe, expect, it, vi } from "vitest";
import { fetchAuditLogs } from "../cloudflare-client.ts";
import type { AuditLogEvent } from "../types.ts";

function mockResp(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    text: async () => (typeof body === "string" ? body : JSON.stringify(body)),
    json: async () => body,
  } as unknown as Response;
}

function ev(id: string): AuditLogEvent {
  return {
    id,
    when: "2026-05-06T00:00:00Z",
    actor: { email: "x@y" },
    action: { type: "t", result: "success" },
  };
}

describe("fetchAuditLogs", () => {
  it("CC-01 single page yields all events with one HTTP call", async () => {
    const fetchFn = vi.fn().mockResolvedValueOnce(
      mockResp({ result: [ev("a"), ev("b")], result_info: { cursor: null } }),
    );
    const out: string[] = [];
    for await (const e of fetchAuditLogs({
      accountId: "acc",
      token: "tok",
      since: new Date("2026-05-06T00:00:00Z"),
      until: new Date("2026-05-06T01:00:00Z"),
      fetchFn: fetchFn as unknown as typeof fetch,
    })) out.push(e.id);
    expect(out).toEqual(["a", "b"]);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("CC-02 follows cursor across two pages", async () => {
    const fetchFn = vi.fn()
      .mockResolvedValueOnce(
        mockResp({ result: [ev("a")], result_info: { cursor: "c1" } }),
      )
      .mockResolvedValueOnce(
        mockResp({ result: [ev("b")], result_info: { cursor: null } }),
      );
    const out: string[] = [];
    for await (const e of fetchAuditLogs({
      accountId: "acc",
      token: "tok",
      since: new Date("2026-05-06T00:00:00Z"),
      until: new Date("2026-05-06T01:00:00Z"),
      fetchFn: fetchFn as unknown as typeof fetch,
    })) out.push(e.id);
    expect(out).toEqual(["a", "b"]);
    expect(fetchFn).toHaveBeenCalledTimes(2);
    const url2 = (fetchFn.mock.calls[1]![0] as URL).toString();
    expect(url2).toContain("cursor=c1");
  });

  it("CC-03 throws on 401", async () => {
    const fetchFn = vi.fn().mockResolvedValueOnce(mockResp("unauthorized", false, 401));
    const it_ = fetchAuditLogs({
      accountId: "acc",
      token: "bad",
      since: new Date(),
      until: new Date(),
      fetchFn: fetchFn as unknown as typeof fetch,
    });
    await expect((async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _ of it_) { /* drain */ }
    })()).rejects.toThrow(/401/);
  });

  it("CC-05 empty result terminates cleanly", async () => {
    const fetchFn = vi.fn().mockResolvedValueOnce(
      mockResp({ result: [], result_info: { cursor: null } }),
    );
    const out: string[] = [];
    for await (const e of fetchAuditLogs({
      accountId: "acc",
      token: "tok",
      since: new Date(),
      until: new Date(),
      fetchFn: fetchFn as unknown as typeof fetch,
    })) out.push(e.id);
    expect(out).toEqual([]);
  });
});
