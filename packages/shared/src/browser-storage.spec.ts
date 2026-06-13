import { afterEach, describe, expect, it, vi } from "vitest";

import { readPersistedBoolean, writePersistedBoolean } from "./browser-storage";

afterEach(() => {
  vi.unstubAllGlobals();
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.clear();
  }
});

describe("browser-storage (guarded persistence accessors)", () => {
  describe("readPersistedBoolean", () => {
    it("returns null when no value is stored (raw === null branch)", () => {
      expect(readPersistedBoolean("missing-key")).toBeNull();
    });

    it("returns true when the stored JSON is true", () => {
      writePersistedBoolean("k-true", true);
      expect(readPersistedBoolean("k-true")).toBe(true);
    });

    it("returns false when the stored JSON is not strictly true", () => {
      writePersistedBoolean("k-false", false);
      expect(readPersistedBoolean("k-false")).toBe(false);
    });

    it("returns false when stored JSON is a non-true truthy value", () => {
      window.localStorage.setItem("k-num", "1");
      expect(readPersistedBoolean("k-num")).toBe(false);
    });

    it("returns null on JSON parse failure (catch branch)", () => {
      window.localStorage.setItem("k-bad", "{not-json");
      expect(readPersistedBoolean("k-bad")).toBeNull();
    });

    it("returns null when window has no localStorage (browser guard false)", () => {
      vi.stubGlobal("window", {});
      expect(readPersistedBoolean("any")).toBeNull();
    });
  });

  describe("writePersistedBoolean", () => {
    it("persists a boolean that round-trips through readPersistedBoolean", () => {
      writePersistedBoolean("rt", true);
      expect(window.localStorage.getItem("rt")).toBe("true");
      expect(readPersistedBoolean("rt")).toBe(true);
    });

    it("is a no-op when window has no localStorage (browser guard false)", () => {
      vi.stubGlobal("window", {});
      expect(() => writePersistedBoolean("x", true)).not.toThrow();
    });

    it("swallows storage errors (catch branch)", () => {
      vi.stubGlobal("window", {
        localStorage: {
          getItem: () => null,
          setItem: () => {
            throw new Error("QuotaExceeded");
          },
        },
      });
      expect(() => writePersistedBoolean("quota", true)).not.toThrow();
    });
  });
});
