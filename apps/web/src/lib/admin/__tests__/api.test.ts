// 06c: lib/admin/api.ts の不変条件アサーション
// 不変条件 #11: profile 本文編集 mutation を export しない
// 不変条件 #13: tag 直接更新 mutation を export しない
import { describe, it, expect } from "vitest";
import * as adminApi from "../api";

describe("lib/admin/api.ts", () => {
  it("profile 本文編集の mutation export を持たない (#11)", () => {
    const keys = Object.keys(adminApi);
    expect(keys.some((k) => /profile|businessOverview|selfIntroduction/i.test(k))).toBe(false);
  });

  it("tag 直接更新 mutation を持たず resolveTagQueue のみ (#13)", () => {
    const keys = Object.keys(adminApi);
    const tagKeys = keys.filter((k) => /tag/i.test(k));
    expect(tagKeys).toEqual(["resolveTagQueue"]);
  });

  it("attendance / status / notes / schema-alias / meeting の mutation を export する", () => {
    expect(typeof adminApi.patchMemberStatus).toBe("function");
    expect(typeof adminApi.postMemberNote).toBe("function");
    expect(typeof adminApi.patchMemberNote).toBe("function");
    expect(typeof adminApi.deleteMember).toBe("function");
    expect(typeof adminApi.resolveTagQueue).toBe("function");
    expect(typeof adminApi.postSchemaAlias).toBe("function");
    expect(typeof adminApi.createMeeting).toBe("function");
    expect(typeof adminApi.addAttendance).toBe("function");
    expect(typeof adminApi.removeAttendance).toBe("function");
  });
});
