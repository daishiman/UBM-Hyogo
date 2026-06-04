// issue-1068 / task-A: createTag / parseTagErrorCode の unit spec（C-A-T1〜C-A-T3）。
//   fetch を vi.fn() で stub する（vi.stubGlobal("window",...) は使わない）。
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createTag,
  parseTagErrorCode,
  TagCreateError,
  type AdminTagRef,
} from "../members";

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

describe("createTag (issue-1068 task-A)", () => {
  it("C-A-T1: 201 → AdminTagRef を返し、/api/admin/tags へ POST + body で叩く", async () => {
    const fetchSpy = mockFetch(201, {
      tagId: "t1",
      code: "vip",
      label: "VIP",
      category: "membership",
      active: 1,
    });

    const result = await createTag({ code: "vip", label: "VIP", category: "membership" });

    // active は付与判定で不要なため AdminTagRef の 4 項目に絞る
    const expected: AdminTagRef = {
      tagId: "t1",
      code: "vip",
      label: "VIP",
      category: "membership",
    };
    expect(result).toEqual(expected);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe("/api/admin/tags");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({
      code: "vip",
      label: "VIP",
      category: "membership",
    });
  });

  it("C-A-T2: 409 → tag_code_conflict を載せた TagCreateError を throw", async () => {
    mockFetch(409, { ok: false, error: "tag_code_conflict" });

    await expect(
      createTag({ code: "vip", label: "VIP", category: "membership" }),
    ).rejects.toMatchObject({ code: "tag_code_conflict", status: 409 });

    // instanceof / .code でも検出できる
    try {
      mockFetch(409, { ok: false, error: "tag_code_conflict" });
      await createTag({ code: "vip", label: "VIP", category: "membership" });
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(TagCreateError);
      expect((e as TagCreateError).code).toBe("tag_code_conflict");
    }
  });

  it("C-A-T2b: 不明 code の !res.ok でも throw（code は null）", async () => {
    mockFetch(500, { ok: false, error: "boom" });
    await expect(
      createTag({ code: "vip", label: "VIP", category: "membership" }),
    ).rejects.toMatchObject({ code: null, status: 500 });
  });
});

describe("parseTagErrorCode (issue-1068 task-A)", () => {
  it("C-A-T3: 既知 code / 未知 code / 不正 JSON / error 欠落の判定", () => {
    expect(parseTagErrorCode('{"ok":false,"error":"invalid_body"}')).toBe("invalid_body");
    expect(parseTagErrorCode('{"ok":false,"error":"invalid_json"}')).toBe("invalid_json");
    expect(parseTagErrorCode('{"ok":false,"error":"tag_code_conflict"}')).toBe(
      "tag_code_conflict",
    );
    // 未知 code
    expect(parseTagErrorCode('{"ok":false,"error":"unknown_x"}')).toBeNull();
    // 不正 JSON
    expect(parseTagErrorCode("{not json")).toBeNull();
    // error 欠落
    expect(parseTagErrorCode('{"ok":false}')).toBeNull();
    // 非オブジェクト
    expect(parseTagErrorCode('"just a string"')).toBeNull();
    expect(parseTagErrorCode("")).toBeNull();
  });
});
