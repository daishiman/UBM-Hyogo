import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { importAttendance } from "../api";

const jsonResponse = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

describe("importAttendance", () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
  });

  afterEach(() => vi.restoreAllMocks());

  it("dryRun=false の import endpoint に memberId rows を送る", async () => {
    fetchSpy.mockResolvedValue(
      jsonResponse(200, {
        ok: true,
        summary: { total: 2, ok: 2, duplicate: 0, deletedMember: 0, unknownMember: 0, invalid: 0 },
        rows: [],
        dryRun: false,
        committed: true,
      }),
    );

    const result = await importAttendance("s/1", ["m-1", "m-2"]);

    expect(result.ok).toBe(true);
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/admin/meetings/s%2F1/attendance/import?dryRun=false",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ rows: [{ memberId: "m-1" }, { memberId: "m-2" }] }),
      }),
    );
  });
});
