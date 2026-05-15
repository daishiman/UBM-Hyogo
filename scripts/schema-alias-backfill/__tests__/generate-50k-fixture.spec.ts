// Issue #504: contract tests for generate-50k-fixture.ts
import { describe, expect, it } from "vitest";
import {
  FIXTURE_PREFIX,
  SQL_CHUNK_SIZE,
  generateAll,
  generateRow,
  toSqlInsertChunks,
} from "../generate-50k-fixture";

describe("generate-50k-fixture", () => {
  // TC-GEN-01
  it("generateRow is deterministic for the same index", () => {
    const a = generateRow(42);
    const b = generateRow(42);
    expect(a).toEqual(b);
  });

  // TC-GEN-02
  it("generateAll(50000) produces exactly 50,000 unique dedupe_key values", () => {
    const rows = generateAll(50_000);
    expect(rows).toHaveLength(50_000);
    const keys = new Set(rows.map((r) => r.dedupeKey));
    expect(keys.size).toBe(50_000);
  });

  // TC-GEN-03
  it("every dedupe_key starts with the fixture prefix", () => {
    const rows = generateAll(1_000);
    for (const r of rows) {
      expect(r.dedupeKey.startsWith(FIXTURE_PREFIX)).toBe(true);
    }
  });

  // TC-GEN-04
  it("generated text never matches PII / token / secret patterns", () => {
    const rows = generateAll(1_000);
    const pattern = /@gmail|@senpai-lab|token|secret/i;
    const blob = rows
      .flatMap((r) => Object.values(r))
      .filter((v): v is string => typeof v === "string")
      .join("\n");
    expect(pattern.test(blob)).toBe(false);
  });

  // TC-GEN-05
  it("toSqlInsertChunks defaults to 500 rows per chunk", () => {
    const rows = generateAll(1_500);
    const chunks = toSqlInsertChunks(rows);
    expect(chunks).toHaveLength(3);
    // each chunk should contain exactly SQL_CHUNK_SIZE rows -> SQL_CHUNK_SIZE - 1 commas separating VALUES tuples
    const firstChunkValuesCommas = (chunks[0].match(/\),\n {2}\(/g) ?? []).length;
    expect(firstChunkValuesCommas).toBe(SQL_CHUNK_SIZE - 1);
  });

  it("dedupe_key embeds zero-padded index and 12-char hash suffix", () => {
    const r = generateRow(7);
    expect(r.dedupeKey).toMatch(/^ubm-test-fixture-50k-0000007-[0-9a-f]{12}$/);
  });

  it("rejects negative or non-integer indexes", () => {
    expect(() => generateRow(-1)).toThrow();
    expect(() => generateRow(1.5)).toThrow();
  });
});
