import { describe, it, expect, beforeEach } from "vitest";
import { MockStore, createMockDbCtx } from "../__fixtures__/d1mock";
import { MEMBER_IDENTITY_1 } from "../__fixtures__/members.fixture";
import {
  findIdentityByEmail,
  findIdentityByMemberId,
  updateCurrentResponse,
} from "../identities";
import { asMemberId, asResponseId, asResponseEmail } from "../_shared/brand";

describe("identities repository", () => {
  let store: MockStore;
  let ctx: ReturnType<typeof createMockDbCtx>;

  beforeEach(() => {
    store = new MockStore();
    store.memberIdentities = [{ ...MEMBER_IDENTITY_1 }];
    ctx = createMockDbCtx(store);
  });

  describe("findIdentityByEmail", () => {
    it("存在する email で identity を取得できる", async () => {
      const result = await findIdentityByEmail(
        ctx,
        asResponseEmail("user1@example.com"),
      );
      expect(result).not.toBeNull();
      expect(result?.member_id).toBe("m_001");
    });

    it("存在しない email では null を返す", async () => {
      const result = await findIdentityByEmail(
        ctx,
        asResponseEmail("nonexistent@example.com"),
      );
      expect(result).toBeNull();
    });
  });

  describe("findIdentityByMemberId", () => {
    it("存在する member_id で identity を取得できる", async () => {
      const result = await findIdentityByMemberId(ctx, asMemberId("m_001"));
      expect(result).not.toBeNull();
      expect(result?.response_email).toBe("user1@example.com");
    });

    it("存在しない member_id では null を返す", async () => {
      const result = await findIdentityByMemberId(ctx, asMemberId("nonexistent"));
      expect(result).toBeNull();
    });
  });

  describe("updateCurrentResponse", () => {
    it("current_response_id と last_submitted_at を更新できる", async () => {
      await updateCurrentResponse(
        ctx,
        asMemberId("m_001"),
        asResponseId("r_updated"),
        "2026-06-01T00:00:00Z",
      );
      const updated = store.memberIdentities.find((r) => r["member_id"] === "m_001");
      expect(updated?.["current_response_id"]).toBe("r_updated");
      expect(updated?.["last_submitted_at"]).toBe("2026-06-01T00:00:00Z");
    });
  });
});
