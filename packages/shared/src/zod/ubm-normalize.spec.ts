// members-search-filter-ux-and-api-fix / Phase 4 RED → Phase 5 GREEN
// 正規化関数の単体テスト（全選択肢 + 未知/空 = null・例外を投げない）。
import { describe, expect, it } from "vitest";

import {
  normalizeUbmMembershipType,
  normalizeUbmZone,
} from "./ubm-normalize";

describe("normalizeUbmZone", () => {
  it.each([
    ["0→1", "0_to_1"],
    ["1→10", "1_to_10"],
    ["10→100", "10_to_100"],
    ["  1→10  ", "1_to_10"], // TC-NZ-04 前後空白
  ])("normalizes %j -> %j", (input, expected) => {
    expect(normalizeUbmZone(input)).toBe(expected);
  });

  it.each([
    ["未知ゾーン"],
    [""],
    ["   "],
  ])("returns null for unknown/empty %j without throwing", (input) => {
    expect(normalizeUbmZone(input)).toBeNull();
  });

  it("returns null for null / undefined", () => {
    expect(normalizeUbmZone(null)).toBeNull();
    expect(normalizeUbmZone(undefined)).toBeNull();
  });
});

describe("normalizeUbmMembershipType", () => {
  it.each([
    ["会員", "member"],
    ["非会員", "non_member"],
    ["アカデミー生", "academy"],
    ["  会員 ", "member"], // TC-NS-04 前後空白
  ])("normalizes %j -> %j", (input, expected) => {
    expect(normalizeUbmMembershipType(input)).toBe(expected);
  });

  it.each([
    ["その他"],
    [""],
    ["   "],
  ])("returns null for unknown/empty %j without throwing", (input) => {
    expect(normalizeUbmMembershipType(input)).toBeNull();
  });

  it("returns null for null / undefined", () => {
    expect(normalizeUbmMembershipType(null)).toBeNull();
    expect(normalizeUbmMembershipType(undefined)).toBeNull();
  });
});
