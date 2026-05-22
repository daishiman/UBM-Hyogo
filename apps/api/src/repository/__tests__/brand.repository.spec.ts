import { describe, it, expect } from "vitest";
import {
  asMemberId,
  asResponseId,
  asStableKey,
  asResponseEmail,
  asTagId,
  asAdminId,
} from "../_shared/brand";

describe("branded types", () => {
  it("asMemberId が文字列を MemberId に変換する", () => {
    const m = asMemberId("m_001");
    expect(m).toBe("m_001");
  });

  it("asResponseId が文字列を ResponseId に変換する", () => {
    const r = asResponseId("r_001");
    expect(r).toBe("r_001");
  });

  it("asStableKey が文字列を StableKey に変換する", () => {
    const sk = asStableKey("full_name");
    expect(sk).toBe("full_name");
  });

  it("asResponseEmail が文字列を ResponseEmail に変換する", () => {
    const email = asResponseEmail("user@example.com");
    expect(email).toBe("user@example.com");
  });

  it("asTagId が文字列を TagId に変換する", () => {
    const tid = asTagId("tag_001");
    expect(tid).toBe("tag_001");
  });

  it("asAdminId が文字列を AdminId に変換する", () => {
    const aid = asAdminId("admin_001");
    expect(aid).toBe("admin_001");
  });

  it("MemberId と ResponseId は相互代入不可（型レベルで防止）", () => {
    const m = asMemberId("m_001");
    const r = asResponseId("r_001");
    // @ts-expect-error MemberId に ResponseId は代入不可
    const _wrongM: ReturnType<typeof asMemberId> = r;
    // @ts-expect-error ResponseId に MemberId は代入不可
    const _wrongR: ReturnType<typeof asResponseId> = m;
    // ランタイム値は同じでも型レベルで異なる
    expect(m).toBe("m_001");
    expect(r).toBe("r_001");
    // 未使用変数の警告を抑制
    void _wrongM;
    void _wrongR;
  });

  it("MemberId と StableKey は相互代入不可（型レベルで防止）", () => {
    const m = asMemberId("m_001");
    const sk = asStableKey("full_name");
    // @ts-expect-error
    const _wrong: ReturnType<typeof asMemberId> = sk;
    expect(m).toBeTruthy();
    void _wrong;
  });
});
