// 06b U-01/U-02: login query parser の不変条件テスト。

import { describe, expect, it } from "vitest";
import {
  LOGIN_GATE_STATES,
  parseLoginQuery,
  type LoginGateState,
} from "./login-query";

describe("parseLoginQuery / U-01", () => {
  it.each(LOGIN_GATE_STATES)("state=%s が parse 成功する", (state) => {
    const q = parseLoginQuery({
      state,
      email: "user@example.com",
      redirect: "/profile",
    });
    expect(q.state).toBe(state satisfies LoginGateState);
    expect(q.email).toBe("user@example.com");
    expect(q.redirect).toBe("/profile");
  });
});

describe("parseLoginQuery / U-02 fallback", () => {
  it("不正な state 'foo' は input にフォールバックする", () => {
    const q = parseLoginQuery({ state: "foo" });
    expect(q.state).toBe("input");
  });

  it("不正な email は undefined になり state は input にフォールバック", () => {
    const q = parseLoginQuery({ state: "sent", email: "not-an-email" });
    // safeParse 失敗 -> input にフォールバック
    expect(q.state).toBe("input");
    expect(q.email).toBeUndefined();
  });

  it("redirect が '/' 始まりでなければ /profile に正規化", () => {
    const q = parseLoginQuery({ redirect: "https://evil.example/x" });
    expect(q.redirect).toBe("/profile");
  });

  it("protocol-relative redirect は /profile に正規化", () => {
    const q = parseLoginQuery({ redirect: "//evil.example/x" });
    expect(q.redirect).toBe("/profile");
  });

  it("backslash を含む redirect は /profile に正規化", () => {
    const q = parseLoginQuery({ redirect: "/\\evil" });
    expect(q.redirect).toBe("/profile");
  });

  it("redirect が undefined の場合も /profile デフォルト", () => {
    const q = parseLoginQuery({});
    expect(q.redirect).toBe("/profile");
    expect(q.state).toBe("input");
  });

  it("searchParams 全体が undefined でも安全に動く", () => {
    const q = parseLoginQuery(undefined);
    expect(q.state).toBe("input");
    expect(q.redirect).toBe("/profile");
  });

  it("string[] の searchParams は first を採用する", () => {
    const q = parseLoginQuery({ state: ["sent", "input"] });
    expect(q.state).toBe("sent");
  });
});
