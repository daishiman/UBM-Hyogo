import { describe, it, expect } from "vitest";
import { isActive } from "../isActive";

describe("isActive", () => {
  it("/ matches only itself", () => {
    expect(isActive("/", "/")).toBe(true);
    expect(isActive("/", "/admin")).toBe(false);
    expect(isActive("/", "/members")).toBe(false);
  });

  it("/admin requires exact match", () => {
    expect(isActive("/admin", "/admin")).toBe(true);
    expect(isActive("/admin", "/admin/members")).toBe(false);
    expect(isActive("/admin", "/admin/tags")).toBe(false);
  });

  it("non-root href matches itself and segment children", () => {
    expect(isActive("/admin/members", "/admin/members")).toBe(true);
    expect(isActive("/admin/members", "/admin/members/123")).toBe(true);
    expect(isActive("/admin/members", "/admin/members/123/edit")).toBe(true);
  });

  it("prefix collision is rejected (boundary)", () => {
    expect(isActive("/admin/members", "/admin/membership")).toBe(false);
    expect(isActive("/members", "/admin/members")).toBe(false);
  });
});
