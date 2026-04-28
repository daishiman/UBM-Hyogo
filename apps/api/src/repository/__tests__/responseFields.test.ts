import { describe, it, expect, beforeEach } from "vitest";
import { MockStore, createMockDbCtx } from "../__fixtures__/d1mock";
import { RESPONSE_FIELDS_R001 } from "../__fixtures__/members.fixture";
import { listFieldsByResponseId } from "../responseFields";
import { asResponseId } from "../_shared/brand";

describe("responseFields repository", () => {
  let store: MockStore;
  let ctx: ReturnType<typeof createMockDbCtx>;

  beforeEach(() => {
    store = new MockStore();
    store.responseFields = [...RESPONSE_FIELDS_R001.map((r) => ({ ...r }))];
    ctx = createMockDbCtx(store);
  });

  describe("listFieldsByResponseId", () => {
    it("response_id に紐づくフィールド一覧を取得できる", async () => {
      const result = await listFieldsByResponseId(ctx, asResponseId("r_001"));
      expect(result).toHaveLength(3);
    });

    it("stable_key が含まれる", async () => {
      const result = await listFieldsByResponseId(ctx, asResponseId("r_001"));
      expect(result.map((r) => r.stable_key)).toContain("full_name");
      expect(result.map((r) => r.stable_key)).toContain("nickname");
      expect(result.map((r) => r.stable_key)).toContain("admin_note_field");
    });

    it("存在しない response_id では空配列を返す", async () => {
      const result = await listFieldsByResponseId(ctx, asResponseId("nonexistent"));
      expect(result).toHaveLength(0);
    });
  });
});
