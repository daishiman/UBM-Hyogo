import { describe, expect, it } from "vitest";
import {
  describeAuditAction,
  describeAuditField,
  describeAuditTargetType,
} from "../auditGlossary";

describe("auditGlossary display helpers", () => {
  it("maps known audit values to Japanese labels", () => {
    expect(describeAuditAction("attendance.add")).toBe("出席を追加");
    expect(describeAuditTargetType("meeting")).toBe("開催日");
    expect(describeAuditField("actorEmail")).toBe("実行者（メール）");
  });

  it("keeps safe fallbacks for unknown values and null target types", () => {
    expect(describeAuditAction("admin.future.unknown_op")).toBe("admin.future.unknown_op");
    expect(describeAuditTargetType("unknown_type")).toBe("unknown_type");
    expect(describeAuditTargetType(null)).toBe("—");
    expect(describeAuditField("cursor")).toBe("cursor");
    expect(() => describeAuditAction("x")).not.toThrow();
  });
});
