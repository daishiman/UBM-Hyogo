import { describe, expect, it } from "vitest";

import {
  describeRuntimeFoundation,
  runtimeFoundation,
  type RuntimeFoundation,
} from "./index";

describe("runtimeFoundation", () => {
  it("exposes pinned versions", () => {
    expect(runtimeFoundation.node).toBe("24.x");
    expect(runtimeFoundation.pnpm).toBe("10.x");
    expect(runtimeFoundation.next).toBe("16.x");
    expect(runtimeFoundation.react).toBe("19.2.x");
    expect(runtimeFoundation.typescript).toBe("6.x");
    expect(runtimeFoundation.webRuntime).toBe("@opennextjs/cloudflare");
    expect(runtimeFoundation.apiRuntime).toBe("hono-workers");
  });

  it("describeRuntimeFoundation joins core versions", () => {
    const out = describeRuntimeFoundation();
    expect(out).toContain("Node 24.x");
    expect(out).toContain("pnpm 10.x");
    expect(out).toContain("Next.js 16.x");
    expect(out).toContain("React 19.2.x");
    expect(out).toContain("TypeScript 6.x");
  });

  it("RuntimeFoundation type matches the const", () => {
    const _t: RuntimeFoundation = runtimeFoundation;
    expect(_t).toBe(runtimeFoundation);
  });
});
