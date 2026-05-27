import { describe, it, expect } from "vitest";
import { parseZoneSlices } from "../admin-dashboard-ui";

const validByZone = [
  { key: "0to1", label: "0→1", hint: "立ち上げ", count: 3, total: 11, tone: "info" },
  { key: "1to10", label: "1→10", hint: "拡大", count: 7, total: 11, tone: "accent" },
  { key: "10to100", label: "10→100", hint: "組織化", count: 1, total: 11, tone: "ok" },
];

describe("parseZoneSlices", () => {
  it("新 shape (length=3) を ReadonlyArray<ZoneSlice> に通す", () => {
    const result = parseZoneSlices(validByZone);
    expect(result).toBeDefined();
    expect(result?.length).toBe(3);
    expect(result?.[0].key).toBe("0to1");
    expect(result?.[2].tone).toBe("ok");
  });

  it("旧 loose shape ({zone,count}) は undefined", () => {
    expect(parseZoneSlices([{ zone: "0→1", count: 3 }])).toBeUndefined();
  });

  it("undefined / non-array 入力は undefined", () => {
    expect(parseZoneSlices(undefined)).toBeUndefined();
    expect(parseZoneSlices(null)).toBeUndefined();
    expect(parseZoneSlices("string")).toBeUndefined();
  });

  it("length != 3 は undefined", () => {
    expect(parseZoneSlices(validByZone.slice(0, 2))).toBeUndefined();
  });

  it("tone enum 外は undefined", () => {
    const bad = [{ ...validByZone[0], tone: "warn" }, validByZone[1], validByZone[2]];
    expect(parseZoneSlices(bad)).toBeUndefined();
  });
});
