import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthRequiredError } from "../../../../lib/fetch/errors";
import { createTag, TagCreateError } from "../tags";

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

describe("createTag (tags api)", () => {
  it("POST /api/admin/tags を叩き active 込み TagDefinitionItem を返す", async () => {
    const fetchSpy = mockFetch(201, {
      tagId: "tag_1",
      code: "mentor",
      label: "メンター",
      category: "role",
      active: 1,
    });

    await expect(
      createTag({ code: "mentor", label: "メンター", category: "role" }),
    ).resolves.toEqual({
      tagId: "tag_1",
      code: "mentor",
      label: "メンター",
      category: "role",
      active: true,
    });
    expect(fetchSpy.mock.calls[0]?.[0]).toBe("/api/admin/tags");
    expect(fetchSpy.mock.calls[0]?.[1]?.method).toBe("POST");
  });

  it("409 tag_code_conflict を TagCreateError で保持する", async () => {
    mockFetch(409, { ok: false, error: "tag_code_conflict" });
    await expect(
      createTag({ code: "mentor", label: "メンター", category: "role" }),
    ).rejects.toMatchObject({ status: 409, code: "tag_code_conflict" });
  });

  it("401 は AuthRequiredError にする", async () => {
    mockFetch(401, { ok: false, error: "unauthorized" });
    await expect(
      createTag({ code: "mentor", label: "メンター", category: "role" }),
    ).rejects.toBeInstanceOf(AuthRequiredError);
  });

  it("unknown error code は TagCreateError code null", async () => {
    mockFetch(500, { ok: false, error: "boom" });
    await expect(
      createTag({ code: "mentor", label: "メンター", category: "role" }),
    ).rejects.toBeInstanceOf(TagCreateError);
  });
});
