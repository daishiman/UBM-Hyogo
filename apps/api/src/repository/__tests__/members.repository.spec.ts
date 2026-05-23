import { describe, it, expect, beforeEach } from "vitest";
import { MockStore, createMockDbCtx } from "../__fixtures__/d1mock";
import {
  MEMBER_IDENTITY_1,
  MEMBER_IDENTITY_2,
} from "../__fixtures__/members.fixture";
import { findMemberById, listMembersByIds, upsertMember } from "../members";
import { asMemberId, asResponseId, asResponseEmail } from "../_shared/brand";

describe("members repository", () => {
  let store: MockStore;
  let ctx: ReturnType<typeof createMockDbCtx>;

  beforeEach(() => {
    store = new MockStore();
    store.memberIdentities = [{ ...MEMBER_IDENTITY_1 }, { ...MEMBER_IDENTITY_2 }];
    ctx = createMockDbCtx(store);
  });

  describe("findMemberById", () => {
    it("存在する member_id で identity を取得できる", async () => {
      const result = await findMemberById(ctx, asMemberId("m_001"));
      expect(result).not.toBeNull();
      expect(result?.member_id).toBe("m_001");
      expect(result?.response_email).toBe("user1@example.com");
    });

    it("存在しない member_id では null を返す", async () => {
      const result = await findMemberById(ctx, asMemberId("nonexistent"));
      expect(result).toBeNull();
    });
  });

  describe("listMembersByIds", () => {
    it("複数の member_id で identity 一覧を取得できる", async () => {
      const result = await listMembersByIds(ctx, [
        asMemberId("m_001"),
        asMemberId("m_002"),
      ]);
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.member_id)).toContain("m_001");
      expect(result.map((r) => r.member_id)).toContain("m_002");
    });

    it("空配列を渡すと空配列を返す", async () => {
      const result = await listMembersByIds(ctx, []);
      expect(result).toHaveLength(0);
    });

    it("存在しない member_id は含まれない", async () => {
      const result = await listMembersByIds(ctx, [asMemberId("nonexistent")]);
      expect(result).toHaveLength(0);
    });
  });

  describe("upsertMember", () => {
    it("新規 member を挿入できる", async () => {
      store.memberIdentities = [];
      await upsertMember(ctx, {
        memberId: asMemberId("m_new"),
        responseEmail: asResponseEmail("new@example.com"),
        currentResponseId: asResponseId("r_new"),
        firstResponseId: asResponseId("r_new"),
        lastSubmittedAt: "2026-02-01T00:00:00Z",
      });
      expect(store.memberIdentities).toHaveLength(1);
      expect(store.memberIdentities[0]?.member_id).toBe("m_new");
    });

    it("既存 member を更新できる", async () => {
      await upsertMember(ctx, {
        memberId: asMemberId("m_001"),
        responseEmail: asResponseEmail("updated@example.com"),
        currentResponseId: asResponseId("r_new"),
        firstResponseId: asResponseId("r_001"),
        lastSubmittedAt: "2026-02-01T00:00:00Z",
      });
      const updated = store.memberIdentities.find((r) => r["member_id"] === "m_001");
      expect(updated?.["response_email"]).toBe("updated@example.com");
      expect(updated?.["current_response_id"]).toBe("r_new");
    });
  });
});
