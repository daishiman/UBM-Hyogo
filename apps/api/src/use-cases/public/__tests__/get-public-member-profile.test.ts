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
import type { AttendanceProvider } from "../../../repository/attendance";

const emptyAttendanceProvider: AttendanceProvider = {
  async findByMemberIds() {
    return new Map();
  },
  async findByMemberId() {
    return { records: [], hasMore: false, nextCursor: null };
  },
};

const attendanceProvider: AttendanceProvider = {
  async findByMemberIds() {
    return new Map();
  },
  async findByMemberId() {
    return {
      records: [{ sessionId: "s-1", title: "定例会 1", heldOn: "2026-03-15" }],
      hasMore: false,
      nextCursor: null,
    };
  },
};

const withProvider = (db: unknown, provider: AttendanceProvider = emptyAttendanceProvider) => ({
  db: db as never,
  var: { attendanceProvider: provider },
});

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
      ctx: withProvider(db, attendanceProvider),
    });
    expect(result.memberId).toBe("m-1");
    expect(result.attendance).toEqual([
      { sessionId: "s-1", title: "定例会 1", heldOn: "2026-03-15" },
    ]);
  });

  it("publish_state が public でない member は UBM-1404 を投げる", async () => {
    const db = createPublicD1Mock({
      memberStatusById: {
        "m-2": buildMemberStatusRow({ member_id: "m-2", publish_state: "member_only" }),
      },
    });
    await expect(
      getPublicMemberProfileUseCase("m-2", { ctx: withProvider(db) }),
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
      getPublicMemberProfileUseCase("m-3", { ctx: withProvider(db) }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("deleted member は UBM-1404 を投げる", async () => {
    const db = createPublicD1Mock({
      memberStatusById: {
        "m-4": buildMemberStatusRow({ member_id: "m-4", is_deleted: 1 }),
      },
    });
    await expect(
      getPublicMemberProfileUseCase("m-4", { ctx: withProvider(db) }),
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
      getPublicMemberProfileUseCase("m-1", { ctx: withProvider(db) }),
    ).rejects.toThrow(/MockD1Failure/);
  });

  it("attendanceProvider 未注入時は fail-fast する", async () => {
    const db = createPublicD1Mock({
      memberStatusById: { "m-1": buildMemberStatusRow({ member_id: "m-1" }) },
      currentResponseByMemberId: { "m-1": buildMemberResponseRow() },
    });
    await expect(
      getPublicMemberProfileUseCase("m-1", {
        ctx: {
          db: db as never,
          var: { attendanceProvider: undefined as unknown as AttendanceProvider },
        },
      }),
    ).rejects.toThrow(/attendanceProvider not bound/i);
  });
});
