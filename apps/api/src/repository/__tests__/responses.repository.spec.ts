import { describe, it, expect, beforeEach } from "vitest";
import { MockStore, createMockDbCtx } from "../__fixtures__/d1mock";
import {
  MEMBER_IDENTITY_1,
  MEMBER_RESPONSE_1,
  MEMBER_RESPONSE_2,
} from "../__fixtures__/members.fixture";
import {
  findResponseById,
  findCurrentResponse,
  listResponsesByEmail,
  upsertResponse,
} from "../responses";
import { asMemberId, asResponseId, asResponseEmail } from "../_shared/brand";

describe("responses repository", () => {
  let store: MockStore;
  let ctx: ReturnType<typeof createMockDbCtx>;

  beforeEach(() => {
    store = new MockStore();
    store.memberIdentities = [{ ...MEMBER_IDENTITY_1 }];
    store.memberResponses = [{ ...MEMBER_RESPONSE_1 }, { ...MEMBER_RESPONSE_2 }];
    ctx = createMockDbCtx(store);
  });

  describe("findResponseById", () => {
    it("存在する response_id で回答を取得できる", async () => {
      const result = await findResponseById(ctx, asResponseId("r_001"));
      expect(result).not.toBeNull();
      expect(result?.response_id).toBe("r_001");
      expect(result?.response_email).toBe("user1@example.com");
    });

    it("存在しない response_id では null を返す", async () => {
      const result = await findResponseById(ctx, asResponseId("nonexistent"));
      expect(result).toBeNull();
    });
  });

  describe("findCurrentResponse", () => {
    it("member_id の現在の回答を取得できる", async () => {
      const result = await findCurrentResponse(ctx, asMemberId("m_001"));
      expect(result).not.toBeNull();
      expect(result?.response_id).toBe("r_001");
    });

    it("存在しない member_id では null を返す", async () => {
      const result = await findCurrentResponse(ctx, asMemberId("nonexistent"));
      expect(result).toBeNull();
    });
  });

  describe("listResponsesByEmail", () => {
    it("email に紐づく回答一覧を取得できる", async () => {
      const result = await listResponsesByEmail(
        ctx,
        asResponseEmail("user1@example.com"),
      );
      expect(result).toHaveLength(1);
      expect(result[0]?.response_id).toBe("r_001");
    });

    it("存在しない email では空配列を返す", async () => {
      const result = await listResponsesByEmail(
        ctx,
        asResponseEmail("nonexistent@example.com"),
      );
      expect(result).toHaveLength(0);
    });
  });

  describe("upsertResponse", () => {
    it("新規回答を挿入できる", async () => {
      store.memberResponses = [];
      await upsertResponse(ctx, {
        responseId: asResponseId("r_new"),
        formId: "form_001",
        revisionId: "rev_001",
        schemaHash: "abc123",
        responseEmail: asResponseEmail("new@example.com"),
        submittedAt: "2026-02-01T00:00:00Z",
        editResponseUrl: null,
        answersJson: "{}",
        rawAnswersJson: "{}",
        extraFieldsJson: "{}",
        unmappedQuestionIdsJson: "[]",
        searchText: "",
      });
      expect(store.memberResponses).toHaveLength(1);
      expect(store.memberResponses[0]?.["response_id"]).toBe("r_new");
    });

    it("既存回答を全フィールド更新できる（partial update 不可）", async () => {
      await upsertResponse(ctx, {
        responseId: asResponseId("r_001"),
        formId: "form_001",
        revisionId: "rev_002", // 更新
        schemaHash: "def456", // 更新
        responseEmail: asResponseEmail("user1@example.com"),
        submittedAt: "2026-06-01T00:00:00Z",
        editResponseUrl: "https://example.com/edit",
        answersJson: '{"fullName": "更新後"}',
        rawAnswersJson: "{}",
        extraFieldsJson: "{}",
        unmappedQuestionIdsJson: "[]",
        searchText: "更新後",
      });
      const updated = store.memberResponses.find((r) => r["response_id"] === "r_001");
      expect(updated?.["revision_id"]).toBe("rev_002");
      expect(updated?.["schema_hash"]).toBe("def456");
      expect(updated?.["answers_json"]).toBe('{"fullName": "更新後"}');
    });
  });
});
