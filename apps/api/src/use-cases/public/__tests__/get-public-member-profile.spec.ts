// UT-08A-01: get-public-member-profile use-case unit test。
// 公開フィルタ EXISTS の 0 件 → 404、happy / D1 failure を担保する。
// issue-1029 lane D: resolvePhotoUrl DI と gate 不通過時の漏れ防止を担保する。
import { describe, expect, it, vi } from "vitest";
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

  // --- issue-1029 lane D: resolvePhotoUrl DI ---

  const buildPublicMock = () =>
    createPublicD1Mock({
      memberStatusById: { "m-1": buildMemberStatusRow({ member_id: "m-1" }) },
      currentResponseByMemberId: { "m-1": buildMemberResponseRow() },
      responseFieldsByResponseId: {
        "r-1": [buildResponseFieldRow({ stable_key: "fullName" })],
      },
      schemaFields: [buildSchemaQuestionRow({ stable_key: "fullName", position: 1 })],
      tagsByMemberId: { "m-1": [] },
    });

  it("D-1: resolver 注入で photoUrl", async () => {
    const db = buildPublicMock();
    const result = await getPublicMemberProfileUseCase("m-1", {
      ctx: withProvider(db, attendanceProvider),
      resolvePhotoUrl: async () => "https://r2/p?s=x",
    });
    expect(result.photoUrl).toBe("https://r2/p?s=x");
  });

  it("D-2: resolver 未注入で photoUrl なし（後方互換）", async () => {
    const db = buildPublicMock();
    const result = await getPublicMemberProfileUseCase("m-1", {
      ctx: withProvider(db, attendanceProvider),
    });
    expect(result.photoUrl).toBeUndefined();
  });

  it("D-3: 公開 gate 不通過は 404 で写真も漏れない（resolver 未呼び出し）", async () => {
    const db = createPublicD1Mock({
      memberStatusById: {
        "m-2": buildMemberStatusRow({ member_id: "m-2", publish_state: "member_only" }),
      },
    });
    const spy = vi.fn(async () => "https://r2/leak?s=x");
    await expect(
      getPublicMemberProfileUseCase("m-2", {
        ctx: withProvider(db),
        resolvePhotoUrl: spy,
      }),
    ).rejects.toBeInstanceOf(ApiError);
    expect(spy).not.toHaveBeenCalled();
  });

  it("D-4: resolver が undefined（写真未登録 / fail-soft）でも throw しない", async () => {
    const db = buildPublicMock();
    const result = await getPublicMemberProfileUseCase("m-1", {
      ctx: withProvider(db, attendanceProvider),
      resolvePhotoUrl: async () => undefined,
    });
    expect(result.photoUrl).toBeUndefined();
  });
});
