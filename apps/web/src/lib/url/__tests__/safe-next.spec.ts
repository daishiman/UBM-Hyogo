import { describe, expect, it } from "vitest";

import { safeNext } from "../safe-next";

describe("safeNext", () => {
  it.each([
    ["/profile", "/profile"],
    ["/admin/members", "/admin/members"],
    ["//evil.example.com", null],
    ["https://evil.example.com", null],
    ["javascript:alert(1)", null],
    ["\\evil", null],
    ["/\\evil", null],
    ["/login", null],
    ["/login?state=sent", null],
    [undefined, null],
    [123, null],
    [["arr"], null],
    ["", null],
    ["   ", null],
    ["/" + "a".repeat(255), "/" + "a".repeat(255)],
    ["/" + "a".repeat(256), null],
  ])("input %p -> %p", (input, expected) => {
    expect(safeNext(input)).toBe(expected);
  });
});
