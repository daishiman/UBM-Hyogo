// UT-08A-01: list-public-members use-case unit test。
// happy + pagination / empty / D1 failure を担保する。
import { describe, expect, it } from "vitest";

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
});
