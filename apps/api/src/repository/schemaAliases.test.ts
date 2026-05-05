// @vitest-environment node
import { beforeEach, describe, expect, it } from "vitest";
import { asStableKey } from "./_shared/brand";
import { setupD1, type InMemoryD1 } from "./__tests__/_setup";
import { insert, lookup, update } from "./schemaAliases";

describe("schemaAliases repository", () => {
  let env: InMemoryD1;

  beforeEach(async () => {
    env = await setupD1();
  }, 30000);

  it("insert + lookup: questionId から stableKey alias を取得できる", async () => {
    await insert(env.ctx, {
      id: "alias-1",
      stableKey: asStableKey("full_name"),
      aliasQuestionId: "q1",
      aliasLabel: "Full name",
      source: "manual",
      resolvedBy: "admin@example.com",
      resolvedAt: "2026-05-01T00:00:00.000Z",
    });

    const row = await lookup(env.ctx, "q1");
    expect(row?.stableKey).toBe("full_name");
    expect(row?.aliasLabel).toBe("Full name");
  });

  it("update: patch した列だけを更新する", async () => {
    await insert(env.ctx, {
      id: "alias-1",
      stableKey: asStableKey("full_name"),
      aliasQuestionId: "q1",
      aliasLabel: "Full name",
      source: "manual",
      resolvedBy: null,
      resolvedAt: null,
    });

    const row = await update(env.ctx, "alias-1", {
      aliasLabel: "Legal name",
      resolvedBy: "admin@example.com",
    });

    expect(row.stableKey).toBe("full_name");
    expect(row.aliasLabel).toBe("Legal name");
    expect(row.resolvedBy).toBe("admin@example.com");
  });
});
