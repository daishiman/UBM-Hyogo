import { describe, expect, it } from "vitest";
import * as L from "../ledger";

describe("_shared/ledger re-export", () => {
  it("re-exports sync job lifecycle functions", () => {
    expect(typeof L.start).toBe("function");
    expect(typeof L.succeed).toBe("function");
    expect(typeof L.fail).toBe("function");
    expect(typeof L.findLatest).toBe("function");
    expect(typeof L.listRecent).toBe("function");
  });

  it("re-exports transition helpers", () => {
    expect(L.ALLOWED_TRANSITIONS.running).toContain("succeeded");
    expect(L.IllegalStateTransition).toBeDefined();
    expect(L.SyncJobNotFound).toBeDefined();
  });
});
