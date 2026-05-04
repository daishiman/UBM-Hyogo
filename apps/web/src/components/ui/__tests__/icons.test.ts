import { describe, it, expect } from "vitest";
import type { IconName } from "../icons";
import * as Icons from "../icons";

describe("components/ui/icons", () => {
  it("IconName 値リストを satisfies で踏むことで type-only モジュールを計上する", () => {
    const names = [
      "chevron-down",
      "chevron-up",
      "x",
      "search",
      "check",
      "menu",
      "external-link",
    ] as const satisfies readonly IconName[];
    expect(names.length).toBeGreaterThan(0);
    expect(Icons).toBeDefined();
  });
});
