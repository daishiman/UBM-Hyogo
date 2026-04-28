import { describe, it, expect, beforeEach } from "vitest";
import { MockStore, createMockDbCtx } from "../__fixtures__/d1mock";
import { MEMBER_STATUS_CONSENTED } from "../__fixtures__/members.fixture";
import {
  getStatus,
  setConsentSnapshot,
  setPublishState,
  setDeleted,
} from "../status";
import { asMemberId, asAdminId } from "../_shared/brand";

describe("status repository", () => {
  let store: MockStore;
  let ctx: ReturnType<typeof createMockDbCtx>;

  beforeEach(() => {
    store = new MockStore();
    store.memberStatus = [{ ...MEMBER_STATUS_CONSENTED }];
    ctx = createMockDbCtx(store);
  });

  describe("getStatus", () => {
    it("存在する member_id でステータスを取得できる", async () => {
      const result = await getStatus(ctx, asMemberId("m_001"));
      expect(result).not.toBeNull();
      expect(result?.public_consent).toBe("consented");
      expect(result?.publish_state).toBe("public");
      expect(result?.is_deleted).toBe(0);
    });

    it("存在しない member_id では null を返す", async () => {
      const result = await getStatus(ctx, asMemberId("nonexistent"));
      expect(result).toBeNull();
    });
  });

  describe("setConsentSnapshot", () => {
    it("同意状態を更新できる", async () => {
      await setConsentSnapshot(ctx, asMemberId("m_001"), "declined", "consented");
      const updated = store.memberStatus.find((r) => r["member_id"] === "m_001");
      expect(updated?.["public_consent"]).toBe("declined");
      expect(updated?.["rules_consent"]).toBe("consented");
    });

    it("存在しない member の場合は新規作成する", async () => {
      store.memberStatus = [];
      await setConsentSnapshot(ctx, asMemberId("m_new"), "consented", "consented");
      expect(store.memberStatus).toHaveLength(1);
      expect(store.memberStatus[0]?.["public_consent"]).toBe("consented");
    });
  });

  describe("setPublishState", () => {
    it("公開状態を変更できる", async () => {
      await setPublishState(ctx, asMemberId("m_001"), "member_only", asAdminId("admin_001"));
      const updated = store.memberStatus.find((r) => r["member_id"] === "m_001");
      expect(updated?.["publish_state"]).toBe("member_only");
      expect(updated?.["updated_by"]).toBe("admin_001");
    });
  });

  describe("setDeleted", () => {
    it("論理削除でき、deleted_members に記録される", async () => {
      await setDeleted(ctx, asMemberId("m_001"), asAdminId("admin_001"), "退会申請");

      const statusRow = store.memberStatus.find((r) => r["member_id"] === "m_001");
      expect(statusRow?.["is_deleted"]).toBe(1);

      expect(store.deletedMembers).toHaveLength(1);
      expect(store.deletedMembers[0]?.["member_id"]).toBe("m_001");
      expect(store.deletedMembers[0]?.["deleted_by"]).toBe("admin_001");
      expect(store.deletedMembers[0]?.["reason"]).toBe("退会申請");
    });
  });
});
