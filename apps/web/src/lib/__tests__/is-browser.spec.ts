// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { isBrowser, whenBrowser } from "../is-browser";

describe("isBrowser (jsdom)", () => {
  it("returns true under jsdom env", () => {
    expect(isBrowser()).toBe(true);
  });

  it("whenBrowser executes the callback", () => {
    const fn = vi.fn();
    whenBrowser(fn);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("whenBrowser executes synchronously", () => {
    let called = false;
    whenBrowser(() => {
      called = true;
    });
    expect(called).toBe(true);
  });
});
