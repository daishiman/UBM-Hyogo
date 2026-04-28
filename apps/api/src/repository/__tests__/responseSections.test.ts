import { describe, it, expect, beforeEach } from "vitest";
import { MockStore, createMockDbCtx } from "../__fixtures__/d1mock";
import { RESPONSE_SECTIONS_R001 } from "../__fixtures__/members.fixture";
import { listSectionsByResponseId } from "../responseSections";
import { asResponseId } from "../_shared/brand";

describe("responseSections repository", () => {
  let store: MockStore;
  let ctx: ReturnType<typeof createMockDbCtx>;

  beforeEach(() => {
    store = new MockStore();
    store.responseSections = [...RESPONSE_SECTIONS_R001.map((r) => ({ ...r }))];
    ctx = createMockDbCtx(store);
  });

  describe("listSectionsByResponseId", () => {
    it("response_id に紐づくセクション一覧を取得できる", async () => {
      const result = await listSectionsByResponseId(ctx, asResponseId("r_001"));
      expect(result).toHaveLength(2);
    });

    it("セクションは position 昇順でソートされる", async () => {
      const result = await listSectionsByResponseId(ctx, asResponseId("r_001"));
      expect(result[0]?.section_key).toBe("profile");
      expect(result[1]?.section_key).toBe("skills");
    });

    it("存在しない response_id では空配列を返す", async () => {
      const result = await listSectionsByResponseId(ctx, asResponseId("nonexistent"));
      expect(result).toHaveLength(0);
    });
  });
});
