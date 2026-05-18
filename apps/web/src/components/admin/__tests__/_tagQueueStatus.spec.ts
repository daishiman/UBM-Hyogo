import { describe, it, expect } from "vitest";
import { TAG_QUEUE_STATUS_TOKEN, TERMINAL_TAG_QUEUE_STATUSES } from "../_tagQueueStatus";

describe("_tagQueueStatus", () => {
  it("TC-S-01: 全 5 status に label/tokenVar が存在", () => {
    const statuses = ["queued", "reviewing", "resolved", "rejected", "dlq"] as const;
    for (const s of statuses) {
      const entry = TAG_QUEUE_STATUS_TOKEN[s];
      expect(entry.label.length).toBeGreaterThan(0);
      expect(entry.tokenVar.startsWith("var(--")).toBe(true);
    }
  });

  it("TC-S-02: tokenVar に HEX 直書きが含まれない", () => {
    for (const entry of Object.values(TAG_QUEUE_STATUS_TOKEN)) {
      expect(entry.tokenVar).not.toMatch(/#[0-9a-f]{3,8}/i);
    }
  });

  it("terminal set は resolved/rejected/dlq の 3 件", () => {
    expect(TERMINAL_TAG_QUEUE_STATUSES.has("resolved")).toBe(true);
    expect(TERMINAL_TAG_QUEUE_STATUSES.has("rejected")).toBe(true);
    expect(TERMINAL_TAG_QUEUE_STATUSES.has("dlq")).toBe(true);
    expect(TERMINAL_TAG_QUEUE_STATUSES.has("queued")).toBe(false);
    expect(TERMINAL_TAG_QUEUE_STATUSES.has("reviewing")).toBe(false);
  });
});
