// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { isBrowser, whenBrowser } from "../is-browser";

describe("isBrowser (node)", () => {
  it("returns false under node env", () => {
    expect(isBrowser()).toBe(false);
  });

  it("whenBrowser is a noop under node env", () => {
    const fn = vi.fn();
    whenBrowser(fn);
    expect(fn).not.toHaveBeenCalled();
  });
});
