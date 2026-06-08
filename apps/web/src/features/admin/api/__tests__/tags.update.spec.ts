import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  parseTagUpdateErrorCode,
  TagUpdateError,
  updateTag,
  type AdminTagRef,
} from "../tags";

const mockFetch = (status: number, body: unknown, bodyIsJson = true) => {
  const ok = status >= 200 && status < 300;
  return vi.spyOn(globalThis, "fetch").mockResolvedValue({
    ok,
    status,
    json: async () => body,
    text: async () => (bodyIsJson ? JSON.stringify(body) : String(body)),
  } as Response);
};

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("updateTag", () => {
  it("PATCH /api/admin/tags/:tagId に code/expectedCode を送る", async () => {
    const updated: AdminTagRef = {
      tagId: "tag_1",
      code: "mentor_renamed",
      label: "メンター",
      category: "role",
    };
    const fetchSpy = mockFetch(200, updated);

    await expect(
      updateTag("tag/1", {
        code: "mentor_renamed",
        label: "メンター",
        category: "role",
        expectedCode: "mentor",
      }),
    ).resolves.toEqual(updated);

    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe("/api/admin/tags/tag%2F1");
    expect(init?.method).toBe("PATCH");
    expect(JSON.parse(String(init?.body))).toEqual({
      code: "mentor_renamed",
      label: "メンター",
      category: "role",
      expectedCode: "mentor",
    });
  });

  it("409 tag_stale_conflict を TagUpdateError として保持する", async () => {
    mockFetch(409, { ok: false, error: "tag_stale_conflict" });

    await expect(
      updateTag("tag_1", { code: "mentor2", expectedCode: "mentor" }),
    ).rejects.toMatchObject({ status: 409, code: "tag_stale_conflict" });

    try {
      mockFetch(409, { ok: false, error: "tag_code_conflict" });
      await updateTag("tag_1", { code: "mentor2", expectedCode: "mentor" });
      throw new Error("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(TagUpdateError);
      expect((error as TagUpdateError).code).toBe("tag_code_conflict");
    }
  });
});

describe("parseTagUpdateErrorCode", () => {
  it("既知 update code のみ返す", () => {
    expect(parseTagUpdateErrorCode('{"error":"tag_code_conflict"}')).toBe("tag_code_conflict");
    expect(parseTagUpdateErrorCode('{"error":"tag_stale_conflict"}')).toBe("tag_stale_conflict");
    expect(parseTagUpdateErrorCode('{"error":"tag_not_found"}')).toBe("tag_not_found");
    expect(parseTagUpdateErrorCode('{"error":"no_update_fields"}')).toBe("no_update_fields");
    expect(parseTagUpdateErrorCode('{"error":"invalid_body"}')).toBe("invalid_body");
    expect(parseTagUpdateErrorCode('{"error":"invalid_json"}')).toBe("invalid_json");
    expect(parseTagUpdateErrorCode('{"error":"unknown"}')).toBeNull();
    expect(parseTagUpdateErrorCode("{not json")).toBeNull();
    expect(parseTagUpdateErrorCode('"tag_code_conflict"')).toBeNull();
  });
});
