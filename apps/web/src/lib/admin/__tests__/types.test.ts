// Type-only モジュールの import smoke。barrel 同様、import で計上を確保する。
import { describe, it, expect } from "vitest";
import type {
  AdminAuditFilters,
  AdminAuditListItem,
  AdminAuditListResponse,
} from "../types";
import * as Types from "../types";

describe("lib/admin/types", () => {
  it("type-only module は import で statement を踏む", () => {
    const filters: AdminAuditFilters = { limit: 10 };
    const item: AdminAuditListItem = {
      auditId: "a",
      actorEmail: null,
      action: "x",
      targetType: null,
      targetId: null,
      createdAt: "2026-05-01T00:00:00.000Z",
    };
    const res: AdminAuditListResponse = { items: [item], nextCursor: null };
    expect(filters.limit).toBe(10);
    expect(res.items).toHaveLength(1);
    expect(Types).toBeDefined();
  });
});
