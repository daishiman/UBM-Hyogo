// UT-08A-01: list-public-members use-case unit test。
// happy + pagination / empty / D1 failure を担保する。
// issue-1029 lane C: resolvePhotoUrls DI による photoUrl 出し分けを担保する。
// issue-224: expand=tags の N+1 防止 batch fetch を担保する。
import { afterEach, describe, expect, it, vi } from "vitest";

import { aggregateTopTags } from "../../../repository/publicMembers";
import * as memberTagsModule from "../../../repository/memberTags";
import type { MemberTagWithDefinition } from "../../../repository/memberTags";
import { listPublicMembersUseCase } from "../list-public-members";
import { DEFAULT_PUBLIC_MEMBER_QUERY } from "../../../_shared/search-query-parser";
import {
  buildPublicMemberRow,
  buildResponseFieldRow,
  createPublicD1Mock,
} from "./helpers/public-d1";

const baseQuery = { ...DEFAULT_PUBLIC_MEMBER_QUERY, limit: 24, page: 1 };

// issue-224: listTagsByMemberIds が返すフラット行（必要 field のみ・残りはダミー）。
const flatTag = (
  member_id: string,
  code: string,
  label: string,
  category: string,
): MemberTagWithDefinition => ({
  member_id,
  tag_id: `tag-${code}`,
  source: "forms",
  confidence: null,
  assigned_at: "2024-01-01T00:00:00Z",
  assigned_by: null,
  code,
  label,
  category,
  source_stable_keys_json: "[]",
  active: 1,
});

const withExpandTags = {
  ...DEFAULT_PUBLIC_MEMBER_QUERY,
  expand: ["tags"] as "tags"[],
};

describe("listPublicMembersUseCase", () => {
  it("公開 member を summary view に組み立てる", async () => {
    const queryLog: string[] = [];
    const db = createPublicD1Mock({
      queryLog,
      publicMembers: [
        buildPublicMemberRow({ member_id: "m-1", current_response_id: "r-1" }),
      ],
      publicMemberCount: 1,
      topTags: [
        { code: "ai", label: "AI", count: 3 },
        { code: "design", label: "デザイン", count: 1 },
      ],
      responseFieldsByResponseId: {
        "r-1": [
          buildResponseFieldRow({
            stable_key: "fullName",
            value_json: JSON.stringify("テスト 太郎"),
          }),
          buildResponseFieldRow({
            stable_key: "ubmZone",
            value_json: JSON.stringify("0_to_1"),
          }),
        ],
      },
    });
    const result = await listPublicMembersUseCase(baseQuery, {
      ctx: { db: db as never },
    });
    expect(result.items).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
    expect(result.items[0]?.fullName).toBe("テスト 太郎");
    expect(result.items[0]?.ubmZone).toBe("0_to_1");
    expect(queryLog.some((sql) => sql.includes("public_consent = 'consented'"))).toBe(
      true,
    );
    expect(queryLog.some((sql) => sql.includes("publish_state = 'public'"))).toBe(
      true,
    );
    expect(queryLog.some((sql) => sql.includes("is_deleted = 0"))).toBe(true);
    expect(result.topTags).toEqual([
      { code: "ai", label: "AI", count: 3 },
      { code: "design", label: "デザイン", count: 1 },
    ]);
  });

  it("公開 member 0 件のとき空配列と total=0 を返す", async () => {
    const db = createPublicD1Mock({
      publicMembers: [],
      publicMemberCount: 0,
    });
    const result = await listPublicMembersUseCase(baseQuery, {
      ctx: { db: db as never },
    });
    expect(result.items).toHaveLength(0);
    expect(result.pagination.total).toBe(0);
    expect(result.topTags).toEqual([]);
  });

  it("response_fields の query 失敗を伝播させる", async () => {
    const db = createPublicD1Mock({
      publicMembers: [
        buildPublicMemberRow({ member_id: "m-1", current_response_id: "r-1" }),
      ],
      publicMemberCount: 1,
      failOnSql: /FROM response_fields/,
    });
    await expect(
      listPublicMembersUseCase(baseQuery, { ctx: { db: db as never } }),
    ).rejects.toThrow(/MockD1Failure/);
  });

  it("topTags 集計 SQL は公開境界、active tag、降順+code tie-break、上限20を固定する", async () => {
    const queryLog: string[] = [];
    const db = createPublicD1Mock({
      queryLog,
      topTags: [
        { code: "ai", label: "AI", count: 3 },
        { code: "design", label: "デザイン", count: 3 },
      ],
    });

    const result = await aggregateTopTags({ db: db as never });
    expect(result).toEqual([
      { code: "ai", label: "AI", count: 3 },
      { code: "design", label: "デザイン", count: 3 },
    ]);

    const sql = queryLog.find((entry) =>
      entry.includes("COUNT(DISTINCT mi.member_id) AS count"),
    );
    expect(sql).toBeTruthy();
    expect(sql).toContain("s.public_consent = 'consented'");
    expect(sql).toContain("s.publish_state = 'public'");
    expect(sql).toContain("s.is_deleted = 0");
    expect(sql).toContain("td.active = 1");
    expect(sql).toContain("COUNT(DISTINCT mi.member_id) AS count");
    expect(sql).toContain("ORDER BY count DESC, code ASC");
    expect(sql).toContain("LIMIT 20");
  });

  // --- issue-1029 lane C: resolvePhotoUrls DI ---

  const buildTwoMemberMock = () =>
    createPublicD1Mock({
      publicMembers: [
        buildPublicMemberRow({ member_id: "m1", current_response_id: "r1" }),
        buildPublicMemberRow({ member_id: "m2", current_response_id: "r2" }),
      ],
      publicMemberCount: 2,
      responseFieldsByResponseId: {
        r1: [buildResponseFieldRow({ stable_key: "fullName", value_json: JSON.stringify("A") })],
        r2: [buildResponseFieldRow({ stable_key: "fullName", value_json: JSON.stringify("B") })],
      },
    });

  const byId = (
    items: Array<{ memberId: string; photoUrl?: string | undefined }>,
    id: string,
  ) => items.find((i) => i.memberId === id);

  it("C-1: resolver 注入で item に photoUrl", async () => {
    const db = createPublicD1Mock({
      publicMembers: [buildPublicMemberRow({ member_id: "m1", current_response_id: "r1" })],
      publicMemberCount: 1,
      responseFieldsByResponseId: {
        r1: [buildResponseFieldRow({ stable_key: "fullName", value_json: JSON.stringify("A") })],
      },
    });
    const result = await listPublicMembersUseCase(baseQuery, {
      ctx: { db: db as never },
      resolvePhotoUrls: async () => new Map([["m1", "https://r2/m1?s=x"]]),
    });
    expect(result.items[0]?.photoUrl).toBe("https://r2/m1?s=x");
  });

  it("C-2: resolver 未注入で photoUrl なし（後方互換）", async () => {
    const db = createPublicD1Mock({
      publicMembers: [buildPublicMemberRow({ member_id: "m1", current_response_id: "r1" })],
      publicMemberCount: 1,
      responseFieldsByResponseId: {
        r1: [buildResponseFieldRow({ stable_key: "fullName", value_json: JSON.stringify("A") })],
      },
    });
    const result = await listPublicMembersUseCase(baseQuery, { ctx: { db: db as never } });
    expect(result.items[0]?.photoUrl).toBeUndefined();
  });

  it("C-3: resolver が一部 member だけ返す", async () => {
    const db = buildTwoMemberMock();
    const result = await listPublicMembersUseCase(baseQuery, {
      ctx: { db: db as never },
      resolvePhotoUrls: async () => new Map([["m1", "https://r2/m1?s=x"]]),
    });
    expect(byId(result.items, "m1")?.photoUrl).toBe("https://r2/m1?s=x");
    expect(byId(result.items, "m2")?.photoUrl).toBeUndefined();
  });

  it("C-4: resolver は抽出 memberIds で 1 回だけ呼ばれる（N+1 無し）", async () => {
    const db = buildTwoMemberMock();
    const spy = vi.fn(async () => new Map<string, string>());
    await listPublicMembersUseCase(baseQuery, {
      ctx: { db: db as never },
      resolvePhotoUrls: spy,
    });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(["m1", "m2"]);
  });

  it("C-5: resolver が空 Map（fail-soft）でも 200 相当を維持", async () => {
    const db = buildTwoMemberMock();
    const result = await listPublicMembersUseCase(baseQuery, {
      ctx: { db: db as never },
      resolvePhotoUrls: async () => new Map<string, string>(),
    });
    expect(result.items).toHaveLength(2);
    expect(result.items.every((i) => i.photoUrl === undefined)).toBe(true);
  });

  // --- issue-224: expand=tags の N+1 防止（batch fetch） ---

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // TC-1: expand=tags で各 member に tags 配列が付く
  it("attaches tags to each member when expand includes 'tags'", async () => {
    vi.spyOn(memberTagsModule, "listTagsByMemberIds").mockResolvedValue([
      flatTag("m-1", "founder", "創業メンバー", "role"),
      flatTag("m-1", "tech", "技術", "skill"),
    ]);
    const db = createPublicD1Mock({
      publicMembers: [
        buildPublicMemberRow({ member_id: "m-1", current_response_id: "r-1" }),
      ],
      publicMemberCount: 1,
      responseFieldsByResponseId: {
        "r-1": [
          buildResponseFieldRow({
            stable_key: "fullName",
            value_json: JSON.stringify("テスト 太郎"),
          }),
        ],
      },
    });

    const result = await listPublicMembersUseCase(withExpandTags, {
      ctx: { db: db as never },
    });

    expect(result.items[0]?.tags).toEqual([
      { code: "founder", label: "創業メンバー", category: "role" },
      { code: "tech", label: "技術", category: "skill" },
    ]);
  });

  // TC-2: 複数 member × 複数 tag で member_id 別に正しく groupBy
  it("groups tags by member_id without cross-contamination", async () => {
    vi.spyOn(memberTagsModule, "listTagsByMemberIds").mockResolvedValue([
      flatTag("m-1", "t1", "L1", "c1"),
      flatTag("m-2", "t2", "L2", "c2"),
      flatTag("m-2", "t3", "L3", "c3"),
    ]);
    const db = createPublicD1Mock({
      publicMembers: [
        buildPublicMemberRow({ member_id: "m-1", current_response_id: "r-1" }),
        buildPublicMemberRow({ member_id: "m-2", current_response_id: "r-2" }),
      ],
      publicMemberCount: 2,
      responseFieldsByResponseId: { "r-1": [], "r-2": [] },
    });

    const result = await listPublicMembersUseCase(withExpandTags, {
      ctx: { db: db as never },
    });

    const m1 = result.items.find((i) => i.memberId === "m-1");
    const m2 = result.items.find((i) => i.memberId === "m-2");
    expect(m1?.tags).toEqual([{ code: "t1", label: "L1", category: "c1" }]);
    expect(m2?.tags).toEqual([
      { code: "t2", label: "L2", category: "c2" },
      { code: "t3", label: "L3", category: "c3" },
    ]);
  });

  // TC-3: tags batch query が件数によらず 1 回（N+1 検知の第一証跡）
  it("calls listTagsByMemberIds exactly once with all member ids (no N+1)", async () => {
    const spy = vi
      .spyOn(memberTagsModule, "listTagsByMemberIds")
      .mockResolvedValue([
        flatTag("m-1", "t1", "L1", "c1"),
        flatTag("m-3", "t3", "L3", "c3"),
      ]);
    const db = createPublicD1Mock({
      publicMembers: [
        buildPublicMemberRow({ member_id: "m-1", current_response_id: "r-1" }),
        buildPublicMemberRow({ member_id: "m-2", current_response_id: "r-2" }),
        buildPublicMemberRow({ member_id: "m-3", current_response_id: "r-3" }),
      ],
      publicMemberCount: 3,
      responseFieldsByResponseId: { "r-1": [], "r-2": [], "r-3": [] },
    });

    await listPublicMembersUseCase(withExpandTags, {
      ctx: { db: db as never },
    });

    expect(spy).toHaveBeenCalledTimes(1);
    const passedIds = spy.mock.calls[0]?.[1] as string[]; // 第2引数 = member_id 配列
    expect(passedIds).toEqual(["m-1", "m-2", "m-3"]);
  });

  // TC-4: expand 未指定で tags キー無し かつ batch query 0 回
  it("does not fetch tags when expand is omitted", async () => {
    const spy = vi.spyOn(memberTagsModule, "listTagsByMemberIds");
    const db = createPublicD1Mock({
      publicMembers: [
        buildPublicMemberRow({ member_id: "m-1", current_response_id: "r-1" }),
      ],
      publicMemberCount: 1,
      responseFieldsByResponseId: { "r-1": [] },
    });

    const result = await listPublicMembersUseCase(
      { ...DEFAULT_PUBLIC_MEMBER_QUERY }, // expand 未指定 → []
      { ctx: { db: db as never } },
    );

    expect(spy).not.toHaveBeenCalled();
    expect(result.items[0]?.tags).toBeUndefined();
  });

  // TC-5: 空 member 集合では helper を呼ばない
  it("does not call listTagsByMemberIds when there are no members", async () => {
    const spy = vi.spyOn(memberTagsModule, "listTagsByMemberIds");
    const db = createPublicD1Mock({ publicMembers: [], publicMemberCount: 0 });

    const result = await listPublicMembersUseCase(withExpandTags, {
      ctx: { db: db as never },
    });

    expect(spy).not.toHaveBeenCalled();
    expect(result.items).toHaveLength(0);
  });
});
