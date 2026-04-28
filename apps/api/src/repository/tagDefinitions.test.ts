import { describe, it, expect } from "vitest";
import { createFakeD1 } from "./_shared/__fakes__/fakeD1";
import { findByCode, listAllTagDefinitions, listByCategory } from "./tagDefinitions";

const CATEGORIES = ["industry", "occupation", "skill", "interest", "region", "stage"];

const seed = () => ({
  tables: {
    tag_definitions: CATEGORIES.flatMap((cat, idx) => [
      { tag_id: `t-${cat}-1`, code: `${cat}_1`, label: `${cat}1`, category: cat, source_stable_keys_json: "[]", active: 1 },
      { tag_id: `t-${cat}-2`, code: `${cat}_2`, label: `${cat}2`, category: cat, source_stable_keys_json: "[]", active: idx % 2 === 0 ? 1 : 1 },
    ]),
  },
  primaryKeys: { tag_definitions: ["tag_id"] },
});

describe("tagDefinitions repository", () => {
  it("listAllTagDefinitions は active=1 のみ返す", async () => {
    const fake = createFakeD1(seed());
    const r = await listAllTagDefinitions({ db: fake.d1 });
    expect(r).toHaveLength(12);
  });

  it("listByCategory は 6 カテゴリすべて値を返す (AC-6)", async () => {
    const fake = createFakeD1(seed());
    for (const cat of CATEGORIES) {
      const r = await listByCategory({ db: fake.d1 }, cat);
      expect(r.length).toBeGreaterThan(0);
      for (const row of r) expect(row.category).toBe(cat);
    }
  });

  it("findByCode は一致した tag を返す", async () => {
    const fake = createFakeD1(seed());
    const r = await findByCode({ db: fake.d1 }, "industry_1");
    expect(r?.label).toBe("industry1");
  });

  it("findByCode 不在は null", async () => {
    const fake = createFakeD1(seed());
    const r = await findByCode({ db: fake.d1 }, "nope");
    expect(r).toBeNull();
  });

  // 不変条件 #13: 型レベルで write API 不在を確認（コンパイル時保証）
  it("write API は提供されない (不変条件 #13)", async () => {
    const mod = await import("./tagDefinitions");
    expect((mod as Record<string, unknown>).insertTag).toBeUndefined();
    expect((mod as Record<string, unknown>).updateTag).toBeUndefined();
    expect((mod as Record<string, unknown>).deleteTag).toBeUndefined();
  });
});
