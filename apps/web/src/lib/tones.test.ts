import { describe, it, expect } from "vitest";
import { zoneTone, statusTone } from "./tones";

describe("zoneTone", () => {
  it("0_to_1 → cool", () => expect(zoneTone("0_to_1")).toBe("cool"));
  it("1_to_10 → warm", () => expect(zoneTone("1_to_10")).toBe("warm"));
  it("10_to_100 → amber", () => expect(zoneTone("10_to_100")).toBe("amber"));
  it("other → stone", () => expect(zoneTone("unknown")).toBe("stone"));
});

describe("statusTone", () => {
  it("member → green", () => expect(statusTone("member")).toBe("green"));
  it("academy → cool", () => expect(statusTone("academy")).toBe("cool"));
  it("other → stone", () => expect(statusTone("non_member")).toBe("stone"));
});
