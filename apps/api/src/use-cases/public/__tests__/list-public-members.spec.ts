// UT-08A-01: list-public-members use-case unit test。
// happy + pagination / empty / D1 failure を担保する。
import { describe, expect, it } from "vitest";

import { aggregateTopTags } from "../../../repository/publicMembers";
import { listPublicMembersUseCase } from "../list-public-members";
import { DEFAULT_PUBLIC_MEMBER_QUERY } from "../../../_shared/search-query-parser";
import {
  buildPublicMemberRow,
  buildResponseFieldRow,
  createPublicD1Mock,
} from "./helpers/public-d1";

const baseQuery = { ...DEFAULT_PUBLIC_MEMBER_QUERY, limit: 24, page: 1 };

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
});
