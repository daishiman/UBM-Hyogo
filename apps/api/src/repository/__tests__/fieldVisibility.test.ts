import { describe, it, expect, beforeEach } from "vitest";
import { MockStore, createMockDbCtx } from "../__fixtures__/d1mock";
import { FIELD_VISIBILITY_M001 } from "../__fixtures__/members.fixture";
import { listVisibilityByMemberId, setVisibility } from "../fieldVisibility";
import { asMemberId, asStableKey } from "../_shared/brand";

describe("fieldVisibility repository", () => {
  let store: MockStore;
  let ctx: ReturnType<typeof createMockDbCtx>;

  beforeEach(() => {
    store = new MockStore();
    store.memberFieldVisibility = [...FIELD_VISIBILITY_M001.map((r) => ({ ...r }))];
    ctx = createMockDbCtx(store);
  });

  describe("listVisibilityByMemberId", () => {
    it("member_id の全フィールド可視性を取得できる", async () => {
      const result = await listVisibilityByMemberId(ctx, asMemberId("m_001"));
      expect(result).toHaveLength(3);
    });

    it("各フィールドの visibility が含まれる", async () => {
      const result = await listVisibilityByMemberId(ctx, asMemberId("m_001"));
      const visMap = Object.fromEntries(result.map((r) => [r.stable_key, r.visibility]));
      expect(visMap["full_name"]).toBe("public");
      expect(visMap["nickname"]).toBe("member");
      expect(visMap["admin_note_field"]).toBe("admin");
    });

    it("存在しない member_id では空配列を返す", async () => {
      const result = await listVisibilityByMemberId(ctx, asMemberId("nonexistent"));
      expect(result).toHaveLength(0);
    });
  });

  describe("setVisibility", () => {
    it("新規フィールドの可視性を設定できる", async () => {
      store.memberFieldVisibility = [];
      await setVisibility(ctx, asMemberId("m_001"), asStableKey("new_field"), "member");
      expect(store.memberFieldVisibility).toHaveLength(1);
      expect(store.memberFieldVisibility[0]?.["visibility"]).toBe("member");
    });

    it("既存フィールドの可視性を更新できる", async () => {
      await setVisibility(ctx, asMemberId("m_001"), asStableKey("full_name"), "member");
      const updated = store.memberFieldVisibility.find(
        (r) => r["member_id"] === "m_001" && r["stable_key"] === "full_name",
      );
      expect(updated?.["visibility"]).toBe("member");
    });
  });
});
