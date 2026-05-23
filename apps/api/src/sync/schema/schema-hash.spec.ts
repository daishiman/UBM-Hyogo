// @vitest-environment node
import { describe, it, expect } from "vitest";
import { schemaHash } from "./schema-hash";
import { flatten } from "./flatten";
import { FORMS_GET_31_ITEMS } from "../../../tests/fixtures/forms-get";

describe("schemaHash", () => {
  it("同じ items は同じ hash を返す", async () => {
    const flat = flatten(FORMS_GET_31_ITEMS.items);
    const a = await schemaHash(flat);
    const b = await schemaHash(flat);
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it("並び順が違っても正規化されて同じ hash になる（itemId 昇順正規化）", async () => {
    const flat = flatten(FORMS_GET_31_ITEMS.items);
    const reversed = [...flat].reverse();
    const a = await schemaHash(flat);
    const b = await schemaHash(reversed);
    expect(a).toBe(b);
  });

  it("title が変わると hash が変わる", async () => {
    const flat = flatten(FORMS_GET_31_ITEMS.items);
    const mutated = flat.map((q, i) => (i === 0 ? { ...q, title: q.title + "X" } : q));
    const a = await schemaHash(flat);
    const b = await schemaHash(mutated);
    expect(a).not.toBe(b);
  });
});
