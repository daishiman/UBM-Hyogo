import { describe, it, expect, beforeEach } from "vitest";
import { MockStore, createMockDbCtx } from "../__fixtures__/d1mock";
import {
  TAG_DEFINITIONS,
  MEMBER_TAGS_M001,
} from "../__fixtures__/members.fixture";
import { listTagsByMemberId, listTagsByMemberIds } from "../memberTags";
import { asMemberId } from "../_shared/brand";

describe("memberTags repository", () => {
  let store: MockStore;
  let ctx: ReturnType<typeof createMockDbCtx>;

  beforeEach(() => {
    store = new MockStore();
    store.tagDefinitions = [...TAG_DEFINITIONS.map((r) => ({ ...r }))];
    store.memberTags = [...MEMBER_TAGS_M001.map((r) => ({ ...r }))];
    ctx = createMockDbCtx(store);
  });

  describe("listTagsByMemberId", () => {
    it("member_id のタグ一覧を tag_definitions JOIN で取得できる", async () => {
      const result = await listTagsByMemberId(ctx, asMemberId("m_001"));
      expect(result).toHaveLength(1);
      expect(result[0]?.code).toBe("engineer");
      expect(result[0]?.label).toBe("エンジニア");
      expect(result[0]?.category).toBe("occupation");
    });

    it("非アクティブなタグ定義は含まれない", async () => {
      // inactive_tag を member_tags に追加
      store.memberTags.push({
        member_id: "m_001",
        tag_id: "tag_003",
        source: "manual",
        confidence: null,
        assigned_at: "2026-01-01T00:00:00Z",
        assigned_by: null,
      });
      const result = await listTagsByMemberId(ctx, asMemberId("m_001"));
      // active=0 の tag_003 は除外される
      expect(result.every((r) => r.active === 1)).toBe(true);
    });

    it("存在しない member_id では空配列を返す", async () => {
      const result = await listTagsByMemberId(ctx, asMemberId("nonexistent"));
      expect(result).toHaveLength(0);
    });
  });

  describe("listTagsByMemberIds", () => {
    it("複数 member_id のタグをバッチ取得できる", async () => {
      // m_002 にもタグを追加
      store.memberTags.push({
        member_id: "m_002",
        tag_id: "tag_002",
        source: "rule",
        confidence: 0.8,
        assigned_at: "2026-01-02T00:00:00Z",
        assigned_by: null,
      });

      const result = await listTagsByMemberIds(ctx, [
        asMemberId("m_001"),
        asMemberId("m_002"),
      ]);
      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result.map((r) => r.member_id)).toContain("m_001");
      expect(result.map((r) => r.member_id)).toContain("m_002");
    });

    it("空配列を渡すと空配列を返す", async () => {
      const result = await listTagsByMemberIds(ctx, []);
      expect(result).toHaveLength(0);
    });
  });
});
