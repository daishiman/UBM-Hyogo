import { describe, it, expect } from "vitest";
import { buildCsv, csvFilename } from "../csv-export";

describe("csv-export", () => {
  it("emits BOM + CRLF and escapes quotes/commas", () => {
    const out = buildCsv(["a", "b"], [
      { a: "hello", b: 'comma,inside' },
      { a: 'he said "hi"', b: 1 },
    ]);
    expect(out.startsWith("﻿")).toBe(true);
    expect(out).toContain("\r\n");
    expect(out).toContain('"comma,inside"');
    expect(out).toContain('"he said ""hi"""');
  });

  it("returns header-only when rows empty", () => {
    const out = buildCsv(["a", "b"], []);
    expect(out).toBe("﻿a,b\r\n");
  });

  it("csvFilename includes period or 'all'", () => {
    expect(csvFilename("attendance", "2026-01-01", "2026-06-01")).toBe(
      "attendance-2026-01-01_2026-06-01.csv",
    );
    expect(csvFilename("attendance", null, null)).toBe("attendance-all_all.csv");
  });
});
