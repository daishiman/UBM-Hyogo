import { describe, expect, it } from "vitest";
import { buildByZoneSlices } from "../byZone";

describe("buildByZoneSlices", () => {
  it("mixed raw zone 値を canonical 3 key に正規化 length=3 / 順序固定", () => {
    const slices = buildByZoneSlices(
      [
        { zone: "0→1", count: 3 },
        { zone: "1-10", count: 7 },
        { zone: "10to100", count: 1 },
      ],
      11,
    );
    expect(slices.length).toBe(3);
    expect(slices.map((s) => s.key)).toEqual(["0to1", "1to10", "10to100"]);
    expect(slices.map((s) => s.count)).toEqual([3, 7, 1]);
    expect(slices.every((s) => s.total === 11)).toBe(true);
  });

  it("空配列でも 3 件 count=0 を返す", () => {
    const slices = buildByZoneSlices([], 0);
    expect(slices.length).toBe(3);
    expect(slices.map((s) => s.count)).toEqual([0, 0, 0]);
  });

  it("unknown zone 行は無視される", () => {
    const slices = buildByZoneSlices(
      [
        { zone: "unknown", count: 99 },
        { zone: "0→1", count: 2 },
      ],
      2,
    );
    expect(slices.find((s) => s.key === "0to1")?.count).toBe(2);
    expect(slices.find((s) => s.key === "1to10")?.count).toBe(0);
  });

  it("tone が key 固定 (0to1=info / 1to10=accent / 10to100=ok)", () => {
    const slices = buildByZoneSlices([], 0);
    expect(slices.find((s) => s.key === "0to1")?.tone).toBe("info");
    expect(slices.find((s) => s.key === "1to10")?.tone).toBe("accent");
    expect(slices.find((s) => s.key === "10to100")?.tone).toBe("ok");
  });
});
