// UT-08A-01: get-public-member-profile use-case unit test。
// 公開フィルタ EXISTS の 0 件 → 404、happy / D1 failure を担保する。
import { describe, expect, it } from "vitest";
import { ApiError } from "@ubm-hyogo/shared/errors";

import { getPublicMemberProfileUseCase } from "../get-public-member-profile";
import {
  buildMemberResponseRow,
  buildMemberStatusRow,
  buildResponseFieldRow,
  buildSchemaQuestionRow,
  createPublicD1Mock,
} from "./helpers/public-d1";

describe("getPublicMemberProfileUseCase", () => {
  it("公開フラグが揃っている member の profile を返す", async () => {
    const db = createPublicD1Mock({
      memberStatusById: { "m-1": buildMemberStatusRow({ member_id: "m-1" }) },
      currentResponseByMemberId: { "m-1": buildMemberResponseRow() },
      responseFieldsByResponseId: {
        "r-1": [
          buildResponseFieldRow({ stable_key: "fullName" }),
          buildResponseFieldRow({
            stable_key: "nickname",
            value_json: JSON.stringify("たろう"),
          }),
        ],
      },
      schemaFields: [
        buildSchemaQuestionRow({ stable_key: "fullName", position: 1 }),
        buildSchemaQuestionRow({
          stable_key: "nickname",
          position: 2,
          question_pk: "q-pk-2",
        }),
      ],
      tagsByMemberId: { "m-1": [] },
    });

    const result = await getPublicMemberProfileUseCase("m-1", {
      ctx: { db: db as never },
    });
    expect(result.memberId).toBe("m-1");
  });

  it("publish_state が public でない member は UBM-1404 を投げる", async () => {
    const db = createPublicD1Mock({
      memberStatusById: {
        "m-2": buildMemberStatusRow({ member_id: "m-2", publish_state: "member_only" }),
      },
    });
    await expect(
      getPublicMemberProfileUseCase("m-2", { ctx: { db: db as never } }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("public_consent が consented でない member は UBM-1404 を投げる", async () => {
    const db = createPublicD1Mock({
      memberStatusById: {
        "m-3": buildMemberStatusRow({
          member_id: "m-3",
          public_consent: "declined",
        }),
      },
    });
    await expect(
      getPublicMemberProfileUseCase("m-3", { ctx: { db: db as never } }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("deleted member は UBM-1404 を投げる", async () => {
    const db = createPublicD1Mock({
      memberStatusById: {
        "m-4": buildMemberStatusRow({ member_id: "m-4", is_deleted: 1 }),
      },
    });
    await expect(
      getPublicMemberProfileUseCase("m-4", { ctx: { db: db as never } }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("response_fields の query 失敗を伝播させる", async () => {
    const db = createPublicD1Mock({
      memberStatusById: { "m-1": buildMemberStatusRow({ member_id: "m-1" }) },
      currentResponseByMemberId: { "m-1": buildMemberResponseRow() },
      schemaFields: [buildSchemaQuestionRow()],
      tagsByMemberId: { "m-1": [] },
      failOnSql: /FROM response_fields/,
    });
    await expect(
      getPublicMemberProfileUseCase("m-1", { ctx: { db: db as never } }),
    ).rejects.toThrow(/MockD1Failure/);
  });
});
